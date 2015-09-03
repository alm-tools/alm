import * as sls from "../socketLib/socketLibServer";
import * as contract from "./socketContract";
import http = require("http");
import * as fsu from "../server/utils/fsu";
import * as fslw from "../server/workers/fileListing/fileListingMaster";

namespace Server {
    export var echo: typeof contract.server.echo = (data, client) => {
        console.log('Echo request received:', data);
        return client.increment({ num: data.num }).then((res) => {
            return {
                text: data.text,
                num: res.num
            };
        });
    }
    
    export var getFileContents : typeof contract.server.getFileContents = (data) => {
        let contents = fsu.readFile(fsu.resolve(process.cwd(), data.filePath));
        return Promise.resolve({ contents });
    }
    
    export var getAllFiles : typeof contract.server.getAllFiles = (data) => {
        return fslw.worker.getFileList({ directory: process.cwd() });
    }
}

// Ensure that the namespace follows the contract
var _checkTypes: typeof contract.server = Server;
// launch Server
// let server = new slc.Server();
// export let server = client.sendAllToSocket(contract.server);
// export let cast = client.setupAllCast(contract.anycast);
// 
// // Sample usage
// cast.hello.on((p) => { console.log(p) });
// 
// 

export var cast = contract.cast;

export function register(app: http.Server) {
    let clientCreator = (serverInstance: sls.ServerInstance): typeof contract.client => {
        return {
            increment: serverInstance.sendToSocket(contract.client.increment,'increment')
        };
    };
    let server = new sls.Server(app, Server, clientCreator);
    
    // Provide the server push messages
    cast = server.setupAllCast(contract.cast);

    // For testing
    setInterval(() => cast.hello.emit({ text: 'nice' }), 1000);
}

