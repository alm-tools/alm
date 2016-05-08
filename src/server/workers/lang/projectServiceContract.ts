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
import * as socketContract from "../../../socket/socketContract";

// API provided by the worker (language tools)
export var worker = {
    echo: {} as sw.QRFunction<{ data: string }, { data: string }>,

    fileListingDelta: {} as sw.QRFunction<types.FileListingDelta, {}>,
    fileEdited: {} as sw.QRFunction<{ filePath: string; edit: CodeEdit }, {}>,
    fileChangedOnDisk : {} as sw.QRFunction<{ filePath: string; contents: string }, {}>,
    fileSaved : {} as sw.QRFunction<{ filePath: string }, {}>,

    // Project Service stuff
    getCompletionsAtPosition : {} as typeof socketContract.server.getCompletionsAtPosition,
    quickInfo : {} as typeof socketContract.server.quickInfo,
    getRenameInfo : {} as typeof socketContract.server.getRenameInfo,
    getDefinitionsAtPosition : {} as typeof socketContract.server.getDefinitionsAtPosition,
    getDoctorInfo : {} as typeof socketContract.server.getDoctorInfo,
    getReferences : {} as typeof socketContract.server.getReferences,
    formatDocument: {} as typeof socketContract.server.formatDocument,
    formatDocumentRange: {} as typeof socketContract.server.formatDocumentRange,
    getNavigateToItems : {} as typeof socketContract.server.getNavigateToItems,
    getDependencies : {} as typeof socketContract.server.getDependencies,
    getAST : {} as typeof socketContract.server.getAST,

    // Used to tell the worker about what project it should work on
    // Note: The project validation / expansion happens locally. Only the hard stuff of *analysis* is done by the worker
    // This makes the worker bit more host agnostic
    setActiveProjectConfigDetails: {} as sw.QRFunction<{ projectData: types.ProjectDataLoaded }, {}>,
}

// API provided by master (web server)
export var master = {
    sync: {} as sw.QRFunction<{},{}>,
    getFileContents: {} as sw.QRFunction<{filePath:string},{contents:string}>,
    getOpenFilePaths: {} as sw.QRFunction<{},string[]>,

    // Sinks for important events
    receiveErrorCacheDelta: {} as sw.QRFunction<ErrorCacheDelta, {}>,
    receiveFileOutputStatusUpdate: {} as sw.QRFunction<types.JSOutputStatus, {}>,
    receiveCompleteOutputStatusCacheUpdate: {} as sw.QRFunction<types.JSOutputStatusCache, {}>,
    receiveLiveBuildResults: {} as sw.QRFunction<types.LiveBuildResults, {}>,

    // TODO:
    // endpoint to tell about file output statuses
}
