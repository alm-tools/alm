import * as sls from "../socketLib/socketLibServer";
import * as contract from "./socketContract";
import http = require("http");
import * as fsu from "../server/utils/fsu";
import * as fslw from "../server/workers/fileListing/fileListingMaster";
import * as project from "../server/project/project";
import {FileModel} from "../server/utils/fileModel";
let resolve = sls.resolve;

let openFiles: FileModel[] = [];
function getOpenFile(filePath: string) {
    if (openFiles.some(f=> f.filePath == filePath)) {
        return openFiles.filter(f=> f.filePath == filePath)[0];
    }
}
function getOrCreateOpenFile(filePath: string) {
    var file = getOpenFile(filePath);
    if (!file) {
        file = new FileModel(filePath);
        openFiles.push(file);
    }
    return file;
}

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

    export var getAllFiles : typeof contract.server.getAllFiles = (data) => {
        return fslw.worker.getFileList({ directory: process.cwd() });
    }
    
    export var makeAbsolute : typeof contract.server.makeAbsolute = (data)=> {
        return Promise.resolve({filePath: project.makeAbsolute(data.relativeFilePath)});
    }
    
    /**
     * File stuff
     */
     export var openFile : typeof contract.server.openFile = (data) => {
         let file = getOrCreateOpenFile(data.filePath);
         return resolve({contents:file.getContents()});
     }
     export var closeFile : typeof contract.server.openFile = (data) => {
         // TODO
         return resolve({});
     }
     export var editFile : typeof contract.server.editFile = (data) => {
         // TODO
         let file = getOrCreateOpenFile(data.filePath);
         return resolve({});
     }
}

// Ensure that the namespace follows the contract
var _checkTypes: typeof contract.server = Server;

/** Will be available after register is called */
export var cast = contract.cast;

/** launch server */
export function register(app: http.Server) {
    let runResult = sls.run({
        app,
        serverImplementation: Server,
        clientContract:contract.client,
        cast:contract.cast
    });
    cast = runResult.cast;
    
    // For testing
    // setInterval(() => cast.hello.emit({ text: 'nice' }), 1000);
}

