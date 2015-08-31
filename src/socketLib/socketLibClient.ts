import {RequesterResponder, Message, anycastMessageName, TypedEvent,CastMessage} from "./socketLib";
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
        
        this.socket.on(anycastMessageName,(msg:CastMessage<any>)=>{
            this.typedEvents[msg.message].emit(msg.data);
        });
    }
    
    private typedEvents:{[key:string]:TypedEvent<any>} = {};
    
    /**
     * Each member of `instance` must be a typed event
     * we wire these up to be emitted in the client if an emit is called on the server
     */
    setupAllCast<T>(instance: T): T {
        Object.keys(instance).forEach(name => {
            // Override the actual emit function with one that sends it on to the server
            this.typedEvents[name] = instance[name];
        });
        return instance;
    }
}