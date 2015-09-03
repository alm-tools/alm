import * as sw from "../../utils/simpleWorker";
import * as contract from "./fileListingContract";

import * as glob from "glob";
import chokidar = require('chokidar');
import {debounce} from "../../../common/utils";
import path = require('path');

namespace Worker {
    export var echo: typeof contract.worker.echo = (q) => {
        return master.increment(q).then((res) => {
            return {
                text: q.text,
                num: res.num
            };
        });
    }

    let listing: string[] = [];

    export var getFileList: typeof contract.worker.getFileList = (q) => {
        return Promise.resolve({ fileList: listing });
    }

    var directoryUnderWatch: string;

    export var setupWatch: typeof contract.worker.setupWatch = (q) => {
        directoryUnderWatch = q.directory;

        function sendNewFileList() {
            var mg = new glob.Glob('**', { cwd: q.directory }, (e, newList) => {
                if (e) {
                    console.error('Globbing error:', e);
                }
                
                /** Filter out directories */
                listing = newList.filter(nl=> {
                    let p = path.resolve(q.directory,nl);
                    return mg.statCache[p] && mg.statCache[p].isFile()
                });
                
                master.fileListChanged({ fileList: listing });
            });
        }

        sendNewFileList();

        let watcher = chokidar.watch(directoryUnderWatch);
        watcher.on('change', debounce(function() {
            sendNewFileList();
        },100));

        return Promise.resolve({});
    }
}

// Ensure that the namespace follows the contract
var _checkTypes: typeof contract.worker = Worker;
// run worker
export var {master} = sw.runWorker(Worker, contract.master);