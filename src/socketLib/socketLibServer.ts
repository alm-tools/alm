import http = require('http');
import socketIo = require('socket.io');
import {RequesterResponder,anycastMessageName} from "./socketLib";

export var getCastNoopFunction = <T>() => (messageContents: T): void=> { };

interface CastMessage<T> {
    message: string;
    data?: T;
}

export class Server {
    io: SocketIO.Server;
    constructor(private app: http.Server, responderModule: any, clientCreator: (socket: ServerInstance) => any) {
        this.io = socketIo(app);
        this.io.on('connection', (socket) => {
            let serverInstance = new ServerInstance(socket, responderModule);
             serverInstance.client = clientCreator(serverInstance);
        });
    }
    
    /**
     * Mutates the original in place plus returns the mutated version
     * Each member of `instance` must be a function that takes some message contents and doesn't expect a return value
     */
    setupAllCast<T>(instance: T): T {
        var toRet = instance;
        Object.keys(toRet).forEach(name => {
            toRet[name] = (data: T) => {
                let castMessage: CastMessage<T> = {
                    message: name,
                    data: data
                };
                console.log('EMIT TO ALL : ',name)
                this.io.sockets.emit(anycastMessageName, castMessage);
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
