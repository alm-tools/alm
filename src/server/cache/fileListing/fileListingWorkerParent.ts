import * as wl from "../../utils/workerLib";

var parent = new wl.Parent();
parent.startWorker(__dirname + '/fileListingWorker.js', showError, []);

function showError(error: Error) {
    if (error) {
        console.error('Failed to start a file listing worker:', error);
    }
}

import * as fileListingWorker from "./fileListingWorker";
export var processAllFiles = parent.sendToIpc(fileListingWorker.processAllFiles);