import * as sw from "../../utils/simpleWorker";
import * as contract from "./projectServiceContract";
import * as activeProject from "./activeProject"

namespace Worker {
    export const echo: typeof contract.worker.echo = (data) => Promise.resolve(data);
    export const setActiveProjectConfigDetails: typeof contract.worker.setActiveProjectConfigDetails = (details) => {
        activeProject.setActiveProjectConfigDetails(details.activeProjectConfigDetails);
        return Promise.resolve({});
    }
}

// Ensure that the namespace follows the contract
const _checkTypes: typeof contract.worker = Worker;
// run worker
export const {master} = sw.runWorker({
    workerImplementation: Worker,
    masterContract: contract.master
});


/**
 * Keep the master in sync with some important stuff
 */
import * as tsErrorsCache from "./cache/tsErrorsCache";
tsErrorsCache.errorsCache.errorsUpdated.on((errorsUpdate) => master.receiveErrorsUpdate(errorsUpdate));
import {fileOuputStatusUpdated} from "./cache/outputStatusCache";
fileOuputStatusUpdated.on((fileOuputStatusUpdate) => master.receiveFileOuputStatusUpdate(fileOuputStatusUpdate));
import {completeOutputStatusCacheUpdated} from "./cache/outputStatusCache";
completeOutputStatusCacheUpdated.on((completeOutputStatusCacheUpdate) => master.receiveCompleteOutputStatusCacheUpdate(completeOutputStatusCacheUpdate));

/**
 * We send down the master to `activeProject` otherwise we get in a cyclic reference :-/
 * (activeProject needs us.master to read files) + (we need activeProject to tell it to set active project configuration)
 *
 * Similarly for `project` (project -> usedby -> activeProject -> used by us)
 */
activeProject.setMaster(master);
import * as project from "./core/project";
project.setMaster(master);

/**
 * If files get edited on the master tell the modules that care
 */
// TODO: ASYNC
// ASYNC :-/
