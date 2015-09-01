import * as socketServer from "./socket/socketServer";

import * as fslw from "./workers/fileListing/fileListingMaster";

export function started() {
    
    fslw.worker.setupWatch({ directory: process.cwd() });
    
    
    // 
    // function sendClientNewFileList(){
    //     fslw.processAllFiles({ filePath: process.cwd() }).then((files) => {
    //         socketServer.cast.fileListUpdated.emit({ files });
    //     });
    // }
    // 
    // let watcher = chokidar.watch('.');
    // watcher.on('change', function() {
    //     sendClientNewFileList();
    // });
}