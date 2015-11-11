import * as sw from "../../utils/simpleWorker";
import * as contract from "./fileListingContract";
import * as fs from "fs";
import * as fsu from "../../utils/fsu";

import * as glob from "glob";
import chokidar = require('chokidar');
import {debounce} from "../../../common/utils";
import path = require('path');
import {TypedEvent}  from "../../../common/events";

let listing = new TypedEvent<{relativeFilePaths: string[]}>();

namespace Worker {
    export var echo: typeof contract.worker.echo = (q) => {
        return master.increment(q).then((res) => {
            return {
                text: q.text,
                num: res.num
            };
        });
    }

    export var fileList: typeof contract.worker.fileList = (q) => {
        return listing.current();
    }

    var directoryUnderWatch: string;

    export var setupWatch: typeof contract.worker.setupWatch = (q) => {
        directoryUnderWatch = q.directory;
        let sentOnce = false;

        var sendNewFileList = debounce((function () {
            var mg = new glob.Glob('**', { cwd: q.directory }, (e, newList) => {
                if (e) {
                    console.error('Globbing error:', e);
                }

                /** Filter out directories */
                newList = newList.filter(nl=> {
                    let p = path.resolve(q.directory,nl);
                    return mg.cache[p] && mg.cache[p] == 'FILE';
                });

                sentOnce = true;
                listing.emit({ relativeFilePaths: newList });
            });
        }),500);

        sendNewFileList();

        function sendNewFileListIfSentOnce(){
            if (!sentOnce) return;

            sendNewFileList();
        }

        let watcher = chokidar.watch(directoryUnderWatch, { ignoreInitial: false });

        let liveList: { [filePath: string]: boolean } = {};

        function fileAdded(filePath: string, stat: fs.Stats) {
            filePath = fsu.consistentPath(filePath);
            liveList[filePath] = true;

            sendNewFileListIfSentOnce();
        }

        function fileDeleted(filePath: string) {
            filePath = fsu.consistentPath(filePath);
            delete liveList[filePath];

            sendNewFileListIfSentOnce();
        }

        // Just the ones that impact file listing
        // https://github.com/paulmillr/chokidar#methods--events
        watcher.on('add', fileAdded);
        watcher.on('addDir', sendNewFileListIfSentOnce);
        watcher.on('unlink', fileDeleted);
        watcher.on('unlinkDir', sendNewFileListIfSentOnce);

        // Just for changes
        watcher.on('change', (filePath) => {
            filePath = fsu.consistentPath(filePath);
            master.fileChanged({ filePath });
        });

        return Promise.resolve({});
    }
}

// Ensure that the namespace follows the contract
var _checkTypes: typeof contract.worker = Worker;
// run worker
export var {master} = sw.runWorker(Worker, contract.master);
listing.on(master.fileListUpdated);
