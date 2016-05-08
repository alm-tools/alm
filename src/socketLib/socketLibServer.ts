import http = require('http');
import https = require('https');
import socketIo = require('socket.io');
import {RequesterResponder, anycastMessageName, CastMessage, TypedEvent} from "./socketLib";

export var resolve: typeof Promise.resolve = Promise.resolve.bind(Promise);

/** This is your main boot function for the server */
export function run<TClient, TCast>(config: {
    app: http.Server | https.Server,
    serverImplementation: any,
    clientContract: TClient,
    cast: TCast
}): {
        server: Server,
        cast: TCast,
    } {

    let server = new Server(config.app, config.serverImplementation, (serverInstance: ServerInstance) => {
        return serverInstance.sendAllToSocket(config.clientContract);
    });

    // Provide the server push messages
    let cast = server.setupAllCast(config.cast);

    return { server, cast };
}

export class Server {
    io: SocketIO.Server;
    constructor(private app: http.Server | https.Server, serverImplementation: any, clientCreator: (socket: ServerInstance) => any) {
        this.io = socketIo(app
            // polling is more available on hosts (e.g. azure) but it causes more socket hangups in socketIO
            /* ,{transports:['polling']} */
        );
        this.io.on('connection', (socket) => {
            let serverInstance = new ServerInstance(socket, serverImplementation);
            serverInstance.client = clientCreator(serverInstance);
        });
    }

    /**
     * Mutates the original in place plus returns the mutated version
     * Each member of `instance` must be a typed event
     */
    setupAllCast<T>(instance: T): T {
        var toRet = instance;
        Object.keys(toRet).forEach(name => {
            // Override the actual emit function with one that sends it on to the server
            const evt = new TypedEvent();
            toRet[name] = evt;
            evt.on((data: T) => {
                let castMessage: CastMessage<T> = {
                    message: name,
                    data: data
                };
                // console.log('EMIT TO ALL : ', name)
                this.io.sockets.emit(anycastMessageName, castMessage);
            });
        });
        return toRet;
    }
}

export class ServerInstance extends RequesterResponder {
    protected getSocket = () => this.socket;

    constructor(private socket: SocketIO.Socket, responderModule: any) {
        super();
        this.registerAllFunctionsExportedFromAsResponders(responderModule);
        super.startListening();
    }
}
