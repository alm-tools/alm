// This code is designed to be used by both the parent and the child
import childprocess = require('child_process');
var exec = childprocess.exec;
var spawn = childprocess.spawn;
import path = require('path');

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
    request: boolean;
}

/** Query Response function */
export interface QRFunction<Query, Response> {
    (query: Query): Promise<Response>;
}

/** Creates a Guid (UUID v4) */
function createId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/** Used by parent and child for keepalive */
var orphanExitCode = 100;

class RequesterResponder {

    /** Must be implemented in children */
    protected getProcess: {
        (): { send?: <T>(message: Message<T>) => any }
    }
    = () => { throw new Error('getProcess is abstract'); return null; }


    ///////////////////////////////// REQUESTOR /////////////////////////

    private currentListeners: { [message: string]: { [id: string]: PromiseDeferred<any> } } = {};

    /** Only relevant when we only want the last of this type */
    private currentLastOfType: {
        [message: string]: { data: any; defer: PromiseDeferred<any>; }
    } = {};

    private pendingRequests: string[] = [];
    public pendingRequestsChanged = (pending: string[]) => null;

    /** process a message from the child */
    protected processResponse(m: any) {
        var parsed: Message<any> = m;

        this.pendingRequests.pop();
        this.pendingRequestsChanged(this.pendingRequests);

        if (!parsed.message || !parsed.id) {
            console.log('PARENT ERR: Invalid JSON data from child:', m);
        }
        else if (!this.currentListeners[parsed.message] || !this.currentListeners[parsed.message][parsed.id]) {
            console.log('PARENT ERR: No one was listening:', parsed.message, parsed.data);
        }
        else { // Alright nothing *weird* happened
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
                let lastPromise = this.sendToIpcHeart(last.data, parsed.message);
                lastPromise.then((res) => last.defer.resolve(res), (rej) => last.defer.reject(rej));
            }
        }
    }

    private sendToIpcHeart = (data, message) => {

        // If we don't have a child exit
        if (!this.getProcess()) {
            console.log('PARENT ERR: no child when you tried to send :', message);
            return <any>Promise.reject(new Error("No worker active to recieve message: " + message));
        }

        // Initialize if this is the first call of this type
        if (!this.currentListeners[message]) this.currentListeners[message] = {};

        // Create an id unique to this call and store the defered against it
        var id = createId();
        var defer = Promise.defer<any>();
        this.currentListeners[message][id] = defer;

        // Send data to worker
        this.pendingRequests.push(message);
        this.pendingRequestsChanged(this.pendingRequests);
        this.getProcess().send({ message: message, id: id, data: data, request: true });
        return defer.promise;
    }

    /**
     * Takes a sync named function
     * and returns a function that will execute this function by name using IPC
     * (will only work if the process on the other side has this function as a registered responder)
     */
    sendToIpc<Query, Response>(func: QRFunction<Query, Response>): QRFunction<Query, Response> {
        var message = func.name;
        return (data) => this.sendToIpcHeart(data, message);
    }

    /**
     * If there are more than one pending then we only want the last one as they come in.
     * All others will get the default value
     */
    sendToIpcOnlyLast<Query, Response>(func: QRFunction<Query, Response>, defaultResponse: Response): QRFunction<Query, Response> {
        return (data) => {
            var message = func.name;

            // If we don't have a child exit
            if (!this.getProcess()) {
                console.log('PARENT ERR: no child when you tried to send :', message);
                return <any>Promise.reject(new Error("No worker active to recieve message: " + message));
            }

            // Allow if this is the only call of this type
            if (!Object.keys(this.currentListeners[message] || {}).length) {
                return this.sendToIpcHeart(data, message);
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
                var defer = Promise.defer<Response>();
                this.currentLastOfType[message] = {
                    data: data,
                    defer: defer
                }
                return defer.promise;
            }
        };
    }

    ////////////////////////////////// RESPONDER ////////////////////////

    private responders: { [message: string]: <Query, Response>(query: Query) => Promise<Response> } = {};

    protected processRequest = (m: any) => {
        var parsed: Message<any> = m;
        if (!parsed.message || !this.responders[parsed.message]) {
            // TODO: handle this error scenario. Either the message is invalid or we do not have a registered responder
            return;
        }
        var message = parsed.message;
        var responsePromise: Promise<any>;
        try {
            responsePromise = this.responders[message](parsed.data);
        } catch (err) {
            responsePromise = Promise.reject({ method: message, message: err.message, stack: err.stack, details: err.details || {} });
        }

        responsePromise
            .then((response) => {
                this.getProcess().send({
                    message: message,
                    /** Note: to process a request we just pass the id as we recieve it */
                    id: parsed.id,
                    data: response,
                    error: null,
                    request: false
                });
            })
            .catch((error) => {
                this.getProcess().send({
                    message: message,
                    /** Note: to process a request we just pass the id as we recieve it */
                    id: parsed.id,
                    data: null,
                    error: error,
                    request: false
                });
            });
    }

    private addToResponders<Query, Response>(func: (query: Query) => Promise<Response>) {
        this.responders[func.name] = func;
    }

    registerAllFunctionsExportedFromAsResponders(aModule: any) {
        Object.keys(aModule)
            .filter((funcName) => typeof aModule[funcName] == 'function')
            .forEach((funcName) => this.addToResponders(aModule[funcName]));
    }
}

/** The parent */
export class Parent extends RequesterResponder {

    private child: childprocess.ChildProcess;
    private node = process.execPath;

    /** If we get this error then the situation if fairly hopeless */
    private gotENOENTonSpawnNode = false;
    protected getProcess = () => this.child;
    private stopped = false;

    /** start worker */
    startWorker(childJsPath: string, terminalError: (e: Error) => any, customArguments: string[]) {
        try {
            this.child = spawn(this.node, [
            // '--debug', // Uncomment if you want to debug the child process
                childJsPath
            ].concat(customArguments), { cwd: path.dirname(childJsPath), env: { ATOM_SHELL_INTERNAL_RUN_AS_NODE: '1' }, stdio: ['ipc'] });

            this.child.on('error', (err) => {
                if (err.code === "ENOENT" && err.path === this.node) {
                    this.gotENOENTonSpawnNode = true;
                }
                console.log('CHILD ERR ONERROR:', err.message, err.stack, err);
                this.child = null;
            });

            this.child.on('message', (message: Message<any>) => {
                if (message.request) {
                    this.processRequest(message);
                }
                else {
                    this.processResponse(message);
                }
            });

            this.child.stderr.on('data', (err) => {
                console.log("CHILD ERR STDERR:", err.toString());
            });
            this.child.on('close', (code) => {
                if (this.stopped) {
                    return;
                }

                // Handle process dropping

                // If orphaned then Definitely restart
                if (code === orphanExitCode) {
                    this.startWorker(childJsPath, terminalError, customArguments);
                }
                // If we got ENOENT. Restarting will not help.
                else if (this.gotENOENTonSpawnNode) {
                    terminalError(new Error('gotENOENTonSpawnNode'));
                }
                // We haven't found a reson to not start worker yet
                else {
                    console.log("ts worker restarting. Don't know why it stopped with code:", code);
                    this.startWorker(childJsPath, terminalError, customArguments);
                }
            });
        } catch (err) {
            terminalError(err);
        }
    }

    /** stop worker */
    stopWorker() {
        this.stopped = true;
        if (!this.child) return;
        try {
            this.child.kill('SIGTERM');
        }
        catch (ex) {
            console.error('failed to kill worker child');
        }
        this.child = null;
    }
}

export class Child extends RequesterResponder {

    protected getProcess = () => process;

    constructor() {
        super();

        // Keep alive
        this.keepAlive();

        // Start listening
        process.on('message', (message: Message<any>) => {
            if (message.request) {
                this.processRequest(message);
            }
            else {
                this.processResponse(message);
            }
        });
    }

    /** keep the child process alive while its connected and die otherwise */
    private keepAlive() {
        setInterval(() => {
            // We have been orphaned
            if (!(<any>process).connected) {
                process.exit(orphanExitCode);
            }
        }, 1000);
    }
}
