// This code is designed to be used by both the parent and the child
import cp = require('child_process');
import path = require('path');

export var resolve: typeof Promise.resolve = Promise.resolve.bind(Promise);

/**
 * The main function you should call from master
 */
export function startWorker<TWorker>(config:{
    workerPath: string,
    workerContract: TWorker,
    masterImplementation: any,
    /**
     * We automatially restart the worker if it crashes
     * After that is done, you can do reinitialization in this if you want
     */
    onCrashRestart?: ()=>any,
}): { parent: Parent; worker: TWorker } {
    var parent = new Parent();
    parent.startWorker(config.workerPath, showError, [], config.onCrashRestart || (()=>null));

    function showError(error: Error) {
        if (error) {
            console.error('Failed to start a worker:', error);
        }
    }

    var worker = parent.sendAllToIpc(config.workerContract);
    parent.registerAllFunctionsExportedFromAsResponders(config.masterImplementation);
    return { parent, worker };
}


/**
 * The main function you should call from worker
 */
export function runWorker<TMaster>(config:{workerImplementation: any, masterContract: TMaster}): { child: Child; master: TMaster } {
    var child = new Child();
    child.registerAllFunctionsExportedFromAsResponders(config.workerImplementation);
    let master = child.sendAllToIpc(config.masterContract);
    return { child, master };
}

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
    protected sendTarget: {
        (): { send?: <T>(message: Message<T>) => any }
    };

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

        this.pendingRequests.shift();
        this.pendingRequestsChanged(this.pendingRequests.slice());

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

    /**
     * This is used by both the request and the reponse
     */
    private sendToIpcHeart = (data, message) => {

        // If we don't have a child exit
        if (!this.sendTarget()) {
            console.log('PARENT ERR: no child when you tried to send :', message);
            return <any>Promise.reject(new Error("No worker active to recieve message: " + message));
        }

        // Initialize if this is the first call of this type
        if (!this.currentListeners[message]) this.currentListeners[message] = {};

        // Create an id unique to this call and store the defered against it
        var id = createId();
        const promise = new Promise((resolve,reject)=>{
            this.currentListeners[message][id] = { resolve, reject, promise };
        });


        // Send data to worker
        this.pendingRequests.push(message);
        this.pendingRequestsChanged(this.pendingRequests);
        this.sendTarget().send({ message: message, id: id, data: data, request: true });
        return promise;
    }

    /**
     * Send all the member functions to IPC
     */
    sendAllToIpc<TWorker>(contract: TWorker): TWorker {
        var toret = {} as TWorker;
        Object.keys(contract).forEach(key => {
            toret[key] = this.sendToIpc(contract[key], key);
        });
        return toret;
    }

    /**
     * Takes a sync named function
     * and returns a function that will execute this function by name using IPC
     * (will only work if the process on the other side has this function as a registered responder)
     */
    sendToIpc<Query, Response>(func: QRFunction<Query, Response>, name?: string): QRFunction<Query, Response> {
        name = func.name || name;
        if (!name) {
            console.error('NO NAME for function', func.toString());
            throw new Error('Name not specified for function: \n' + func.toString());
        }
        return (data) => this.sendToIpcHeart(data, name);
    }

    /**
     * If there are more than one pending then we only want the last one as they come in.
     * All others will get the default value
     */
    sendToIpcOnlyLast<Query, Response>(func: QRFunction<Query, Response>, defaultResponse: Response): QRFunction<Query, Response> {
        return (data) => {
            var message = func.name;

            // If we don't have a child exit
            if (!this.sendTarget()) {
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
                // console.log('I have the response for:',parsed.message)
                this.sendTarget().send({
                    message: message,
                    /** Note: to process a request we just pass the id as we recieve it */
                    id: parsed.id,
                    data: response,
                    error: null,
                    request: false
                });
                // console.log('I sent the response', parsed.message);
            })
            .catch((error) => {
                this.sendTarget().send({
                    message: message,
                    /** Note: to process a request we just pass the id as we recieve it */
                    id: parsed.id,
                    data: null,
                    error: error,
                    request: false
                });
            });
    }

    private addToResponders<Query, Response>(func: (query: Query) => Promise<Response>, name?: string) {
        name = func.name || name;
        if (!name) {
            console.error('NO NAME for function', func.toString());
            throw new Error('Name not specified for function: \n' + func.toString());
        }
        this.responders[name] = func;
    }

    registerAllFunctionsExportedFromAsResponders(aModule: any) {
        Object.keys(aModule)
            .filter((funcName) => typeof aModule[funcName] == 'function')
            .forEach((funcName) => this.addToResponders(aModule[funcName], funcName));
    }
}

/** The parent */
export class Parent extends RequesterResponder {

    private child: cp.ChildProcess;
    private node = process.execPath;

    /** If we get this error then the situation if fairly hopeless */
    private gotENOENTonSpawnNode = false;
    protected sendTarget = () => this.child;
    private stopped = false;

    /** start worker */
    startWorker(
        childJsPath: string,
        terminalError: (e: Error) => any,
        customArguments: string[] = [],
        onCrashRestart: () => any
    ) {
        try {
            const fileName = path.basename(childJsPath);
            this.child = cp.fork(
                childJsPath,
                customArguments,
                { cwd: path.dirname(childJsPath), env: {} }
            );

            this.child.on('error', (err) => {
                if (err.code === "ENOENT" && err.path === this.node) {
                    this.gotENOENTonSpawnNode = true;
                }
                console.log('CHILD ERR ONERROR:', err.message, err.stack, err);
                this.child = null;
            });

            this.child.on('message', (message: Message<any>) => {
                // console.log('PARENT: A child asked me', message.message)
                if (message.request) {
                    this.processRequest(message);
                }
                else {
                    this.processResponse(message);
                }
            });

            this.child.on('close', (code) => {
                if (this.stopped) {
                    return;
                }

                // Handle process dropping

                // If orphaned then Definitely restart
                if (code === orphanExitCode) {
                    this.startWorker(childJsPath, terminalError, customArguments, onCrashRestart);
                    onCrashRestart();
                }
                // If we got ENOENT. Restarting will not help.
                else if (this.gotENOENTonSpawnNode) {
                    terminalError(new Error('gotENOENTonSpawnNode'));
                }
                // We haven't found a reson to not start worker yet
                else {
                    console.log(`${fileName} worker restarting. Don't know why it stopped with code:`, code);
                    this.startWorker(childJsPath, terminalError, customArguments, onCrashRestart);
                    onCrashRestart();
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

    protected sendTarget = () => process;
    private connected = true;

    constructor() {
        super();

        // Keep alive
        this.keepAlive();
        process.on('exit', () => this.connected = false);

        // Start listening
        process.on('message', (message: Message<any>) => {
            // console.error('--------CHILD: parent told me :-/', message.message)
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
            if (!this.connected) {
                process.exit(orphanExitCode);
            }
        }, 1000);
    }
}
