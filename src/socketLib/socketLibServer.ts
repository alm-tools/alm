import http = require('http');
import socketIo = require('socket.io');
import {RequesterResponder, anycastMessageName, CastMessage, TypedEvent} from "./socketLib";

/** This is your main boot function for the server */
export function run<TClient, TCast>(config: {
    app: http.Server,
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
    constructor(private app: http.Server, serverImplementation: any, clientCreator: (socket: ServerInstance) => any) {
        this.io = socketIo(app);
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
            toRet[name] = {
                emit: (data: T) => {
                    let castMessage: CastMessage<T> = {
                        message: name,
                        data: data
                    };
                    // console.log('EMIT TO ALL : ', name)
                    this.io.sockets.emit(anycastMessageName, castMessage);
                }
            };
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
