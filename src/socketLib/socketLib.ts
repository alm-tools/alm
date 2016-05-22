// This code is designed to be used by both the server and the client
// Very similar to workerlib but designed to work with socket.io
// The client is the requestor (hence parent like) and the server is the responder (hence child like)
// client == parent
// server == child

/**
 * Allcast and Broadcast both come through as a message of the following type
 */
export var anycastMessageName = 'anycast';

export * from "../common/events";

// Lets get the types straight:
export type ServerSocket = SocketIO.Socket;
export type ClientSocket = SocketIOClient.Socket;

// Parent makes queries<T>
// Child responds<T>
export interface Message<T> {
    message: string;
    id: string;
    data?: T;
    error?: {
        method: string;
        message: string;
        stack: string;
        details: any;
    };
    /** Is this message a request or a response */
    isRequest: boolean;
}

export interface CastMessage<T> {
    message: string;
    data?: T;
}

/** Query Response function */
export interface QRFunction<Query, Response> {
    (query: Query): Promise<Response>;
}

/** Query Response function for use by server */
export interface QRServerFunction<Query, Response, Client> {
    (query: Query, client?: any): Promise<Response>;
}


/** Creates a Guid (UUID v4) */
function createId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

export class RequesterResponder {

    /** Must be implemented in children */
    protected getSocket: {
        (): {
            on?: Function;
            emit?: <T>(messageType: string, message: Message<T>) => any
        }
    }

    startListening() {
        try {
            if (!this.getSocket()) {
                console.log('You started listening without a socket!');
                return;
            }
            let socket = this.getSocket();

            socket.on('error', (err) => {
            });

            socket.on('message', (message: Message<any>) => {
                if (message.isRequest) {
                    this.processRequest(message);
                }
                else {
                    this.processResponse(message);
                }
            });
        } catch (err) {
            console.log('Socket : terminal error in listening', err);
        }
    }

    ///////////////////////////////// REQUESTOR /////////////////////////

    private currentListeners: { [message: string]: { [id: string]: PromiseDeferred<any> } } = {};

    /** Only relevant when we only want the last of this type */
    private currentLastOfType: {
        [message: string]: { data: any; defer: PromiseDeferred<any>; }
    } = {};

    private pendingRequests: {
        [id: string]: string; // The name of message
    } = Object.create(null);
    public pendingRequestsChanged = (pending: string[]) => null;

    /** process a message from the server */
    protected processResponse(m: any) {
        var parsed: Message<any> = m;

        if (!parsed.message || !parsed.id) {
            console.log('SERVER ERR: Invalid JSON data from server:', m);
        }
        else if (!this.currentListeners[parsed.message] || !this.currentListeners[parsed.message][parsed.id]) {
            console.log('SERVER ERR: No one was listening:', parsed.message, parsed.data);
        }
        else { // Alright nothing *weird* happened

            delete this.pendingRequests[parsed.id]
            this.pendingRequestsChanged(Object.keys(this.pendingRequests).map(k=>this.pendingRequests[k]));

            if (parsed.error) {
                this.currentListeners[parsed.message][parsed.id].reject(parsed.error);
                console.log(parsed.error);
                console.log(parsed.error.stack);
            }
            else {
                this.currentListeners[parsed.message][parsed.id].resolve(parsed.data);
            }
            delete this.currentListeners[parsed.message][parsed.id];

            // If there is current last one queued then that needs to be resurrected
            if (this.currentLastOfType[parsed.message]) {
                let last = this.currentLastOfType[parsed.message];
                delete this.currentLastOfType[parsed.message];
                let lastPromise = this.sendToServerHeart(last.data, parsed.message);
                lastPromise.then((res) => last.defer.resolve(res), (rej) => last.defer.reject(rej));
            }
        }
    }

    private sendToServerHeart = (data, message) => {

        // If we don't have a server exit
        if (!this.getSocket()) {
            console.log('SEND ERR: no server when you tried to send :', message);
            return <any>Promise.reject(new Error("No socket active to recieve message: " + message));
        }

        // Initialize if this is the first call of this type
        if (!this.currentListeners[message]) this.currentListeners[message] = {};

        // Create an id unique to this call and store the defered against it
        var id = createId();
        const promise = new Promise((resolve,reject)=>{
            this.currentListeners[message][id] = { resolve, reject, promise };
        });

        // Send data to worker
        this.pendingRequests[id] = message;
        this.pendingRequestsChanged(Object.keys(this.pendingRequests).map(k=>this.pendingRequests[k]));
        this.getSocket().emit('message', { message: message, id: id, data: data, isRequest: true });
        return promise;
    }

    /**
     * Send all the member functions to IPC
     */
    sendAllToSocket<TWorker>(contract: TWorker): TWorker {
        var toret = {} as TWorker;
        Object.keys(contract).forEach(key => {
            toret[key] = this.sendToSocket(contract[key], key);
        });
        return toret;
    }

    /**
     * Takes a sync named function
     * and returns a function that will execute this function by name using IPC
     * (will only work if the process on the other side has this function as a registered responder)
     */
    sendToSocket<Query, Response>(func: QRFunction<Query, Response>, name:string): QRFunction<Query, Response> {
        var message = name;
        return (data) => this.sendToServerHeart(data, message);
    }

    /**
     * If there are more than one pending then we only want the last one as they come in.
     * All others will get the default value
     */
    sendToSocketOnlyLast<Query, Response>(func: QRFunction<Query, Response>, defaultResponse: Response, name:string): QRFunction<Query, Response> {
        return (data) => {
            var message = name;

            // If we don't have a child exit
            if (!this.getSocket()) {
                console.log('SEND ERR: no socket when you tried to send :', message);
                return <any>Promise.reject(new Error("No worker active to recieve message: " + message));
            }

            // Allow if this is the only call of this type
            if (!Object.keys(this.currentListeners[message] || {}).length) {
                return this.sendToServerHeart(data, message);
            }
            else {
                // Note:
                // The last needs to continue once the current one finishes
                // That is done in our response handler


                // If there is already something queued as last.
                // Then it is no longer last and needs to be fed a default value
                if (this.currentLastOfType[message]) {
                    this.currentLastOfType[message].defer.resolve(defaultResponse);
                }

                // this needs to be the new last
                const promise = new Promise<Response>((resolve,reject)=>{
                    this.currentLastOfType[message] = {
                        data: data,
                        defer: {promise,resolve,reject}
                    }
                });

                return promise;
            }
        };
    }

    ////////////////////////////////// RESPONDER ////////////////////////

    /** Client is an optionl service provided to the responders to call back into the requestor */
    public client: any;

    private responders: { [message: string]: <Query, Response>(query: Query, client?: any) => Promise<Response> } = {};

    protected processRequest = (m: any) => {
        var parsed: Message<any> = m;
        if (!parsed.message || !this.responders[parsed.message]) {
            // TODO: handle this error scenario. Either the message is invalid or we do not have a registered responder
            return;
        }
        var message = parsed.message;
        var responsePromise: Promise<any>;
        try {
            responsePromise = this.responders[message](parsed.data, this.client);
        } catch (err) {
            responsePromise = Promise.reject({ method: message, message: err.message, stack: err.stack, details: err.details || {} });
        }

        responsePromise
            .then((response) => {
                this.getSocket().emit('message', {
                    message: message,
                    /** Note: to process a request we just pass the id as we recieve it */
                    id: parsed.id,
                    data: response,
                    error: null,
                    isRequest: false
                });
            })
            .catch((error) => {
                this.getSocket().emit('message', {
                    message: message,
                    /** Note: to process a request we just pass the id as we recieve it */
                    id: parsed.id,
                    data: null,
                    error: error,
                    isRequest: false
                });
            });
    }

    private addToResponders<Query, Response>(func: (query: Query) => Promise<Response>,name: string) {
        this.responders[name] = func;
    }

    registerAllFunctionsExportedFromAsResponders(aModule: any) {
        Object.keys(aModule)
            .filter((funcName) => typeof aModule[funcName] == 'function')
            .forEach((funcName) => this.addToResponders(aModule[funcName], funcName));
    }
}
