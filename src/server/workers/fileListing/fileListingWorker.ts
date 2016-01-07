import * as sw from "../../utils/simpleWorker";
import * as contract from "./fileListingContract";
import * as fs from "fs";
import * as fsu from "../../utils/fsu";
import * as utils from "../../../common/utils";

import * as glob from "glob";
import chokidar = require('chokidar');
import {throttle} from "../../../common/utils";
import path = require('path');
import {TypedEvent}  from "../../../common/events";
import * as types from "../../../common/types";

/** A Map for faster live calculations */
type LiveList = { [filePath: string]: types.FilePathType };

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
        let liveList: LiveList = {};

        // Utility to send new file list
        var sendNewFileList = () => {
            let filePaths = Object.keys(liveList)
                .filter(x=>
                    // Remove .git we have no use for that here
                    !x.includes('/.git/')
                    // MAC
                    && x !== '.DS_Store'
                )
                // sort
                .sort((a, b) => {
                    // sub dir wins!
                    if (b.startsWith(a)){
                        return -1;
                    }
                    if (a.startsWith(b)){
                        return 1;
                    }

                    // The next sorts are slow and only done after initial listing!
                    if (!completed) {
                        return a.length - b.length;
                    }

                    // sort by name
                    return a.toLowerCase().localeCompare(b.toLowerCase());
                })

                // Convert ot file path type
                .map(filePath => {
                    let type = liveList[filePath];
                    return {filePath, type};
                });

            master.fileListUpdated({
                filePaths,
                completed
            });
        };

        /**
         * Slower version for
         * - initial partial serach
         * - later updates which might be called a lot because of some directory of files removed
         */
         let sendNewFileListThrottled = throttle(sendNewFileList, 500);

         /**
          * Utility function to get the listing from a directory
          */
         const getListing = (dirPath: string): Promise<types.FilePath[]> => {
             return new Promise((resolve)=>{
                 let mg = new glob.Glob('**', { cwd: dirPath }, (e, globResult) => {
                     if (e) {
                         console.error('Globbing error:', e);
                     }

                     let list = globResult.map(nl=> {
                         let p = path.resolve(dirPath,nl);
                         let type = mg.cache[p] && mg.cache[p] == 'FILE' ? types.FilePathType.File : types.FilePathType.Dir;
                         return {
                             filePath: fsu.consistentPath(p),
                             type,
                         }
                     });

                     resolve(list);
                 });
             });
         }

        // create initial list using 10x faster glob.Glob!
        (function () {
           let cwd = q.directory;
           var mg = new glob.Glob('**', { cwd }, (e, newList) => {
               if (e) {
                   console.error('Globbing error:', e);
               }

               let list = newList.map(nl=> {
                   let p = path.resolve(cwd,nl);
                   let type = mg.cache[p] && mg.cache[p] == 'FILE' ? types.FilePathType.File : types.FilePathType.Dir;
                   return {
                       filePath: fsu.consistentPath(p),
                       type,
                   }
               });

               // Initial search complete!
               completed = true;
               list.forEach(entry => liveList[entry.filePath] = entry.type);
               sendNewFileList();
           });
           /** Still send the listing while globbing so user gets immediate feedback */
           mg.on('match',(match)=>{
               let p = path.resolve(q.directory,match);
               if (mg.cache[p]){
                  liveList[fsu.consistentPath(p)] = mg.cache[p] == 'FILE' ? types.FilePathType.File : types.FilePathType.Dir;
                  sendNewFileListThrottled();
               }
           });
       })();


        function fileAdded(filePath: string) {
            filePath = fsu.consistentPath(filePath);

            // Only send if we don't know about this already (because of faster initial scan)
            if (!liveList[filePath]) {
                let type = types.FilePathType.File;
                liveList[filePath] = type;
                sendNewFileListThrottled();
            }
        }

        function dirAdded(dirPath: string) {
            dirPath = fsu.consistentPath(dirPath);

            /**
             * - glob the folder
             * - send the folder throttled
             */
            getListing(dirPath).then(res=>{
                res.forEach(fpDetails => {
                    if (!liveList[fpDetails.filePath]) {
                        let type = fpDetails.type
                        liveList[fpDetails.filePath] = type;
                    }
                });
                sendNewFileListThrottled();
            }).catch(res=>{
                console.error('[FLW] DirPath listing failed:', dirPath, res);
            });
        }

        function fileDeleted(filePath: string) {
            filePath = fsu.consistentPath(filePath);
            delete liveList[filePath];
            sendNewFileListThrottled();
        }

        function dirDeleted(dirPath: string) {
            dirPath = fsu.consistentPath(dirPath);
            Object.keys(liveList).forEach(filePath => {
                if (filePath.startsWith(dirPath)){
                    delete liveList[filePath];
                }
            });
            sendNewFileListThrottled();
        }

        /** Create watcher */
        let watcher = chokidar.watch(directoryUnderWatch, { ignoreInitial: true });

        // Just the ones that impact file listing
        // https://github.com/paulmillr/chokidar#methods--events
        watcher.on('add', fileAdded);
        watcher.on('addDir', dirAdded);
        watcher.on('unlink', fileDeleted);
        watcher.on('unlinkDir', dirDeleted);

        // Just for changes
        watcher.on('change', (filePath, stat: fs.Stats) => {
            stat = stat || fs.statSync(filePath);
            filePath = fsu.consistentPath(filePath);
            let type = stat.isDirectory() ? types.FilePathType.Dir : types.FilePathType.File;
            master.fileChanged({ filePath, type });
        });

        return Promise.resolve({});
    }
}

// Ensure that the namespace follows the contract
var _checkTypes: typeof contract.worker = Worker;
// run worker
export var {master} = sw.runWorker(Worker, contract.master);

function debug(...args){
    console.error.apply(console,args);
}
