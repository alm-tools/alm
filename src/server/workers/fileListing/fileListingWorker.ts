import * as sw from "../../utils/simpleWorker";
import * as contract from "./fileListingContract";
import * as fs from "fs";
import * as fsu from "../../utils/fsu";

import * as glob from "glob";
import chokidar = require('chokidar');
import {throttle} from "../../../common/utils";
import path = require('path');
import {TypedEvent}  from "../../../common/events";

namespace Worker {
    export var echo: typeof contract.worker.echo = (q) => {
        return master.increment(q).then((res) => {
            return {
                text: q.text,
                num: res.num
            };
        });
    }

    // export var fileList: typeof contract.worker.fileList = (q) => {
    //     return listing.current();
    // }

    var directoryUnderWatch: string;

    export var setupWatch: typeof contract.worker.setupWatch = (q) => {
        directoryUnderWatch = q.directory;

        let completed = false;
        let liveList: { [filePath: string]: boolean } = {};

        // Utility to send new file list
        var sendNewFileList = () => {
            let filePaths = Object.keys(liveList)
                // Remove .git we have no use for that here
                .filter(x=>!x.includes('/.git/'))
                // filePaths sorted by shortest length first
                .sort((a, b) => a.length - b.length)
                // Also sort alphabetically
                .sort();
            master.fileListUpdated({
                filePaths,
                completed
            });
        };

        // create initial list using 10x faster glob.Glob!
        (function () {
           var mg = new glob.Glob('**', { cwd: q.directory }, (e, newList) => {
               if (e) {
                   console.error('Globbing error:', e);
               }

               /** Filter out directories */
               newList = newList.filter(nl=> {
                   let p = path.resolve(q.directory,nl);
                   return mg.cache[p] && mg.cache[p] == 'FILE';
               });

               // Make absolute & consistent
               newList = newList.map(x=> fsu.resolve(q.directory, x))

               // Initial search complete!
               completed = true;
               newList.forEach(filePath=>liveList[filePath] = true);
               sendNewFileList();
           });
       })();

       /**
        * Slower version for
        * - initial partial serach
        * - later updates which might be complete directory of files removed
        */
        let sendNewFileListThrottled = throttle(sendNewFileList, 500);

        function fileAdded(filePath: string, stat: fs.Stats) {
            filePath = fsu.consistentPath(filePath);

            // if we don't know about this already (because of faster initial scan)
            if (!liveList[filePath]) {
                liveList[filePath] = true;
                sendNewFileListThrottled();
            }
        }

        function fileDeleted(filePath: string) {
            filePath = fsu.consistentPath(filePath);
            delete liveList[filePath];
            sendNewFileListThrottled();
        }

        /** Create watcher */
        let watcher = chokidar.watch(directoryUnderWatch, { ignoreInitial: false });

        // Just the ones that impact file listing
        // https://github.com/paulmillr/chokidar#methods--events
        watcher.on('add', fileAdded);
        // watcher.on('addDir', );
        watcher.on('unlink', fileDeleted);
        // watcher.on('unlinkDir', );

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
