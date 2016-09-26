import * as sw from "../../utils/simpleWorker";
import * as contract from "./projectServiceContract";

import * as fmc from "../../disk/fileModelCache";
import {resolve, selectMany} from "../../../common/utils";
import {TypedEvent} from "../../../common/events";
import * as types from "../../../common/types";
import * as projectDataLoader from "../../disk/projectDataLoader";

// *sinks* for important caches
import {errorsCache} from "../../globalErrorCacheServer";
export const fileOutputStatusUpdated = new TypedEvent<types.JSOutputStatus>();
export const completeOutputStatusCacheUpdated = new TypedEvent<types.JSOutputStatusCache>();
export const liveBuildResults = new TypedEvent<types.LiveBuildResults>();
export const working = new TypedEvent<types.Working>();

namespace Master {
    export const sync: typeof contract.master.sync
        = (data) => {
            activeProjectConfig.sync();
            return resolve({});
        }
    export const getFileContents: typeof contract.master.getFileContents
        = (data) => {
            const contents = fmc.getOrCreateOpenFile(data.filePath).getContents();
            return resolve({ contents });
        }
    export const getOpenFilePaths: typeof contract.master.getOpenFilePaths
        = (data) =>
            resolve(fmc.getOpenFiles().map(f => f.config.filePath));

    // sinks for important caches
    export const receiveErrorCacheDelta: typeof contract.master.receiveErrorCacheDelta
        = (data) => {
            errorsCache.applyDelta(data);
            return resolve({});
        };
    export const receiveFileOutputStatusUpdate: typeof contract.master.receiveFileOutputStatusUpdate
        = (data) => {
            fileOutputStatusUpdated.emit(data);
            return resolve({});
        }
    export const receiveCompleteOutputStatusCacheUpdate: typeof contract.master.receiveCompleteOutputStatusCacheUpdate
        = (data) => {
            completeOutputStatusCacheUpdated.emit(data);
            return resolve({});
        }
    export const receiveLiveBuildResults: typeof contract.master.receiveLiveBuildResults
        = (data) => {
            liveBuildResults.emit(data);
            return resolve({});
        }
    export const receiveIncrementallyAddedFile: typeof contract.master.receiveIncrementallyAddedFile
        = (data) => {
            activeProjectConfig.incrementallyAddedFile(data.filePath);
            return resolve({});
        }

    export const receiveWorking: typeof contract.master.receiveWorking
        = (data) => {
            working.emit(data);
            return resolve({});
        }
}

// Ensure that the namespace follows the contract
const _checkTypes: typeof contract.master = Master;
// launch worker
export const {worker} = sw.startWorker({
    workerPath: __dirname + '/projectServiceWorker',
    workerContract: contract.worker,
    masterImplementation: Master,
    onCrashRestart: ()=> {
        /** TS Crashed. Send down the data again if any */
        if (activeProjectConfig.activeProjectConfigDetails) {
            errorsCache.clearErrorsForSource('projectService');
            sendActiveProjectDownToWorker(activeProjectConfig.activeProjectConfigDetails);
        }
    }
});

const sendActiveProjectDownToWorker = (activeProjectConfigDetails: types.AvailableProjectConfig) => {
    const projectData = projectDataLoader.getProjectDataLoaded(activeProjectConfigDetails);
    worker.setActiveProjectConfigDetails({ projectData });
}

// Subscribe and send down the stuff we need to send to the worker based on our state
import * as activeProjectConfig  from "../../disk/activeProjectConfig";
import * as fileListingMaster from "../fileListing/fileListingMaster";
export function start() {
    /** When active project changes send down the data */
    activeProjectConfig.activeProjectConfigDetailsUpdated.on(sendActiveProjectDownToWorker);

    fileListingMaster.fileListingDelta.on((delta) => activeProjectConfig.fileListingDelta(delta));
    fmc.didEdits.on((edits) => worker.fileEdited(edits));
    fmc.savedFileChangedOnDisk.on((update) => worker.fileChangedOnDisk(update));
    fmc.didStatusChange.on((update) => update.saved && worker.fileSaved({ filePath: update.filePath }));
}
