import * as sw from "../../utils/simpleWorker";
import * as contract from "./lintContract";

import {resolve} from "../../../common/utils";

/** This is were we push the errors */
import {errorsCache} from "../../globalErrorCacheServer";
/** This is where we get the active project information from */
import * as activeProjectConfig from "../../disk/activeProjectConfig";
import * as projectDataLoader from "../../disk/projectDataLoader";
import * as fmc from "../../disk/fileModelCache";

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
    activeProjectConfig.activeProjectConfigDetailsUpdated.on((activeProjectConfigDetails) => {
        const projectData = projectDataLoader.getProjectDataLoaded(activeProjectConfigDetails);
        worker.setProjectData(projectData);
    });

    // only saved ones as linter reads directly from disk and works on whole file contents
    fmc.didStatusChange.on((update) => update.saved && worker.fileSaved({ filePath: update.filePath }));
}
