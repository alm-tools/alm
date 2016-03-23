import * as sw from "../../utils/simpleWorker";
import * as contract from "./projectServiceContract";

namespace Worker {
    export const echo: typeof contract.worker.echo = (data) => Promise.resolve(data);
}

// Ensure that the namespace follows the contract
const _checkTypes: typeof contract.worker = Worker;
// run worker
export const {master} = sw.runWorker({
    workerImplementation: Worker,
    masterContract: contract.master
});


// Keep the master in sync with some important stuff
import {errorsUpdated} from "./cache/errorsCache";
errorsUpdated.on((errorsUpdate) => master.receiveErrorsUpdate(errorsUpdate));
import {fileOuputStatusUpdated,completeOutputStatusCacheUpdated} from "./cache/outputStatusCache";
fileOuputStatusUpdated.on((fileOuputStatusUpdate) => master.receiveFileOuputStatusUpdate(fileOuputStatusUpdate));
completeOutputStatusCacheUpdated.on((completeOutputStatusCacheUpdate) => master.receiveCompleteOutputStatusCacheUpdate(completeOutputStatusCacheUpdate));
