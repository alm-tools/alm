/**
 * This is a work in progress for splitting the code into worker + master
 * similar to what we do for file listing
 * Currently : It just holds contracts between the master (web server) and the worker (language tools)
 */
import * as sw from "../../utils/simpleWorker";

// Just for types
import * as fmc from "../../disk/fileModelCache";
import * as flm from "../fileListing/fileListingMaster";

// API provided by the worker (language tools)
export var worker = {
    echo: {} as sw.QRFunction<{ data: string }, { data: string }>,
    // TODO:
    // endpoint to tell file paths updated
    // endpoint to tell about file edited
    // endpoint to tell about file saved
    //
    // Project Service stuff
}

// API provided by master (web server)
export var master = {
    getFileContents: {} as sw.QRFunction<{filePath:string},{contents:string}>,
    receiveErrorsUpdate: {} as sw.QRFunction<ErrorsUpdate, {}>,

    // TODO:
    // endpoint to tell about file output statuses
}
