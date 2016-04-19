import * as sw from "../../utils/simpleWorker";
import * as contract from "./projectServiceContract";

import * as fmc from "../../disk/fileModelCache";
import {resolve,selectMany} from "../../../common/utils";
import {TypedEvent} from "../../../common/events";
import * as types from "../../../common/types";
import * as projectDataLoader from "../../disk/projectDataLoader";

// *sinks* for important caches
import {errorsCache} from "../../globalErrorCache";
export const fileOutputStatusUpdated = new TypedEvent<types.JSOutputStatus>();
export const completeOutputStatusCacheUpdated = new TypedEvent<types.JSOutputStatusCache>();
completeOutputStatusCacheUpdated.emit(Object.create(null)); // So that we do not hold back any new joiners

namespace Master {
    export const getFileContents: typeof contract.master.getFileContents
        = (data) =>{
            const contents = fmc.getOrCreateOpenFile(data.filePath).getContents();
            return resolve({contents});
        }
    export const getOpenFilePaths: typeof contract.master.getOpenFilePaths
        = (data) =>
            resolve(fmc.getOpenFiles().map(f=>f.config.filePath));

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
}

// Ensure that the namespace follows the contract
const _checkTypes: typeof contract.master = Master;
// launch worker
export const {worker} = sw.startWorker({
    workerPath: __dirname + '/projectServiceWorker',
    workerContract: contract.worker,
    masterImplementation: Master
});

// Subscribe and send down the stuff we need to send to the worker based on our state
import * as activeProjectConfig  from "../../disk/activeProjectConfig";
import * as fileListingMaster from "../fileListing/fileListingMaster";
export function start() {
    activeProjectConfig.activeProjectConfigDetailsUpdated.on((activeProjectConfigDetails)=>{
        const projectData = projectDataLoader.getProjectDataLoaded(activeProjectConfigDetails);
        worker.setActiveProjectConfigDetails({projectData});
    });
    fileListingMaster.filePathsUpdated.on(()=>worker.filePathsUpdated({}));
    fmc.didEdit.on((edit)=>worker.fileEdited(edit));
    fmc.savedFileChangedOnDisk.on((update)=>worker.fileChangedOnDisk(update));
    fmc.didStatusChange.on((update) => update.saved && worker.fileSaved({ filePath: update.filePath }));
}
