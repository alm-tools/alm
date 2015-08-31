// Watch the file system for changes and notify clients of changes
import chokidar = require('chokidar');
import * as fslw from "./cache/fileListing/fileListingWorkerParent";
import * as socketServer from "./socket/socketServer";

export function started() {
    
    function sendClientNewFileList(){
        fslw.processAllFiles({ filePath: process.cwd() }).then((files) => {
            socketServer.cast.fileListUpdated.emit({ files });
        });
    }
    
    let watcher = chokidar.watch('.');
    watcher.on('change', function() {
        sendClientNewFileList();
    });
}