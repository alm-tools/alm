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
        return Promise.resolve({ relativeFilePaths: listing });
    }

    var directoryUnderWatch: string;

    export var setupWatch: typeof contract.worker.setupWatch = (q) => {
        directoryUnderWatch = q.directory;

        var sendNewFileList = debounce((function () {
            var mg = new glob.Glob('**', { cwd: q.directory }, (e, newList) => {
                if (e) {
                    console.error('Globbing error:', e);
                }

                /** Filter out directories */
                listing = newList.filter(nl=> {
                    let p = path.resolve(q.directory,nl);
                    return mg.cache[p] && mg.cache[p] == 'FILE';
                });

                master.fileListChanged({ fileList: listing });
            });
        }),500);

        sendNewFileList();

        let watcher = chokidar.watch(directoryUnderWatch);

        // Just the ones that impact file listing
        // https://github.com/paulmillr/chokidar#methods--events
        watcher.on('add', sendNewFileList);
        watcher.on('addDir', sendNewFileList);
        watcher.on('unlink', sendNewFileList);
        watcher.on('unlinkDir', sendNewFileList);

        return Promise.resolve({});
    }
}

// Ensure that the namespace follows the contract
var _checkTypes: typeof contract.worker = Worker;
// run worker
export var {master} = sw.runWorker(Worker, contract.master);
