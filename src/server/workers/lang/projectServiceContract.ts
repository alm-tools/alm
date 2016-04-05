/**
 * This is a work in progress for splitting the code into worker + master
 * similar to what we do for file listing
 * Currently : It just holds contracts between the master (web server) and the worker (language tools)
 */
import * as sw from "../../utils/simpleWorker";

// Just for types
import * as fmc from "../../disk/fileModelCache";
import * as flm from "../fileListing/fileListingMaster";
import * as types from "../../../common/types";

// API provided by the worker (language tools)
export var worker = {
    echo: {} as sw.QRFunction<{ data: string }, { data: string }>,

    filePathsUpdated: {} as sw.QRFunction<{}, {}>,
    fileEdited: {} as sw.QRFunction<{ filePath: string; edit: CodeEdit }, {}>,
    fileChangedOnDisk : {} as sw.QRFunction<{ filePath: string; contents: string }, {}>,

    // TODO ASYNC:
    // Project Service stuff

    // Used to tell the worker about what project it should work on
    // Note: The project validation / expansion happens locally. Only the hard stuff of *analysis* is done by the worker
    // This makes the worker bit more host agnostic
    setActiveProjectConfigDetails: {} as sw.QRFunction<{ activeProjectConfigDetails: ActiveProjectConfigDetails }, {}>,
}

// API provided by master (web server)
export var master = {
    getFileContents: {} as sw.QRFunction<{filePath:string},{contents:string}>,
    getOpenFilePaths: {} as sw.QRFunction<{},string[]>,

    // Sinks for important events
    receiveErrorsUpdate: {} as sw.QRFunction<LimitedErrorsUpdate, {}>,
    receiveFileOuputStatusUpdate: {} as sw.QRFunction<types.JSOutputStatus, {}>,
    receiveCompleteOutputStatusCacheUpdate: {} as sw.QRFunction<types.JSOutputStatusCache, {}>,

    // TODO:
    // endpoint to tell about file output statuses
}
