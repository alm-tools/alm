import {RequesterResponder, Message} from "./socketLib";
let socketIo = io;
let origin = `${window.location.protocol}//${window.location.hostname}${(window.location.port ? ':' + window.location.port: '')}`;

export class Client extends RequesterResponder {
    protected getSocket = () => this.socket;
    private socket: SocketIOClient.Socket;

    constructor(serviceClient: any) {
        super();
        this.socket = io.connect(origin);
        
        // Also provide the following services to the server
        this.registerAllFunctionsExportedFromAsResponders(serviceClient);
        this.startListening();
    }
}