import * as sw from "../../utils/simpleWorker";
import * as contract from "./lintContract";

import {resolve} from "../../../common/utils";
import {FilePathType, ProjectDataLoaded} from "../../../common/types";

/** This is were we push the errors */
import {errorsCache} from "../../globalErrorCacheServer";
/** This is where we get the active project information from */
import * as activeProjectConfig from "../../disk/activeProjectConfig";
import * as projectDataLoader from "../../disk/projectDataLoader";
import * as fmc from "../../disk/fileModelCache";
import * as flm from "../fileListing/fileListingMaster";

namespace Master {
    export const receiveErrorCacheDelta: typeof contract.master.receiveErrorCacheDelta
        = (data) => {
            errorsCache.applyDelta(data);
            return resolve({});
        };
}

// Ensure that the namespace follows the contract
const _checkTypes: typeof contract.master = Master;
// launch worker
export const {worker} = sw.startWorker({
    workerPath: __dirname + '/lintWorker',
    workerContract: contract.worker,
    masterImplementation: Master
});
export function start() {
    let lastProjectData: ProjectDataLoaded | null = null;
    activeProjectConfig.activeProjectConfigDetailsUpdated.on((activeProjectConfigDetails) => {
        const projectData = projectDataLoader.getProjectDataLoaded(activeProjectConfigDetails);
        lastProjectData = projectData;
        worker.setProjectData(projectData);
    });

    // only saved ones as linter reads directly from disk and works on whole file contents
    fmc.didStatusChange.on((update) => update.saved && worker.fileSaved({ filePath: update.filePath }));
    // We really want to clear errors if someone deletes some file
    flm.fileListingDelta.on(delta=>{
        if (!lastProjectData) return;
        /**
         * NOTE: it might be better if `activeProjectConfig` did this stuff and just asked us to sync
         * using `acitveProjectConfigDetailsUpdated`
         * PS: adding any file just works as its handled by `didStatusChange`
         */
        const relevant = delta.removedFilePaths
            .filter(x => x.type == FilePathType.File)
            .filter(x => x.filePath.endsWith('tslint.json') || x.filePath.endsWith('.ts'))
            .map(x => x.filePath);
        if (relevant.length){
            worker.setProjectData(lastProjectData);
        }
    });
}
