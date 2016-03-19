/**
 * This is a work in progress for splitting the code into worker + master
 * similar to what we do for file listing
 * Currently : It just holds contracts between the master (web server) and the worker (language tools)
 */
import * as sw from "../../utils/simpleWorker";

// TODO: These are the imports that shouldn't be here once we have true process seperation
import * as fmc from "../../disk/fileModelCache";
import * as flm from "../fileListing/fileListingMaster";

// API provided by the worker (language tools)
export var worker = {
    // TODO:
    // endpoint to tell file paths updated
    // endpoint to tell about file edited
    // endpoint to tell about file saved
    //
    // Project Service stuff
}

// API provided by master (web server)
export var master = {
    getOrCreateOpenFile: fmc.getOrCreateOpenFile,

    // TODO:
    // endpoint to tell about errors
    // endpoint to tell about file output statuses
}
