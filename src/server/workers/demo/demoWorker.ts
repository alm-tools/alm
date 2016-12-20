import * as sw from "../../utils/simpleWorker";
import * as contract from "./demoContract";

namespace Worker {
    export const enableLiveDemo: typeof contract.worker.enableLiveDemo = (q) => {
        // TODO: demo
        return Promise.resolve({});
    }
    export const disableLiveDemo: typeof contract.worker.disableLiveDemo = (q) => {
        // TODO: demo
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
