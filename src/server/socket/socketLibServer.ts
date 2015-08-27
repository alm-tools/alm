import {RequesterResponder, Message} from "./socketLib";
import http = require('http');
import socketIo = require('socket.io');

export class Server {
    constructor(private app: http.Server, responderModule: any) {
        let io = socketIo(app);
        io.on('connection', (socket) => {
            let serverInstance = new ServerInstance(socket, responderModule);
        });
    }
}

class ServerInstance extends RequesterResponder {
    protected getSocket = () => ({
        emit: (message) => this.socket.emit('message', message),
        on: this.socket.on.bind(this.socket)
    });

    constructor(private socket: SocketIO.Socket, responderModule: any) {
        super();
        this.registerAllFunctionsExportedFromAsResponders(responderModule);
        super.startListening();
    }
}

