import * as sls from "../socketLib/socketLibServer";
import * as contract from "./socketContract";
import http = require("http");
import * as fsu from "../server/utils/fsu";
import * as fslw from "../server/workers/fileListing/fileListingMaster";
import * as workingDir from "../server/disk/workingDir";
import {FileModel} from "../server/disk/fileModel";
let resolve = sls.resolve;

import {savedFileChangedOnDisk, getOpenFile, getOrCreateOpenFile, closeOpenFile} from "../server/disk/fileModelCache";
import * as errorCache from "../server/lang/errorsCache";

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

    export var getAllFiles: typeof contract.server.getAllFiles = (data) => {
        return fslw.worker.getFileList({ directory: process.cwd() });
    }

    export var makeAbsolute: typeof contract.server.makeAbsolute = (data) => {
        return Promise.resolve({ filePath: workingDir.makeAbsolute(data.relativeFilePath) });
    }

    /**
     * File stuff
     */
    export var openFile: typeof contract.server.openFile = (data) => {
        let file = getOrCreateOpenFile(data.filePath);
        return resolve({ contents: file.getContents() });
    }
    export var closeFile: typeof contract.server.openFile = (data) => {
        closeOpenFile(data.filePath);
        return resolve({});
    }
    export var editFile: typeof contract.server.editFile = (data) => {
        let file = getOrCreateOpenFile(data.filePath);
        let {saved} = file.edit(data.edit);
        // console.log('-------------------------');
        // console.log(file.getContents());
        return resolve({ saved });
    }
    export var saveFile: typeof contract.server.saveFile = (data) => {
        let file = getOrCreateOpenFile(data.filePath);
        file.save();
        return resolve({});
    }

    /**
     * Config stuff
     */
    export var getProjects: typeof contract.server.getProjects = (data) => {
        return resolve({ projects: [] });
    };

    /**
     * Error handling
     */

    export var getErrors: typeof contract.server.getErrors = (data) => {
        return resolve(errorCache.getErrors());
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
        clientContract: contract.client,
        cast: contract.cast
    });
    cast = runResult.cast;

    savedFileChangedOnDisk.pipe(cast.savedFileChangedOnDisk);
    errorCache.errorsUpdated.pipe(cast.errorsUpdated);

    // For testing
    // setInterval(() => cast.hello.emit({ text: 'nice' }), 1000);
}
