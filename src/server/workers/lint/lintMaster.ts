import * as sw from "../../utils/simpleWorker";
import * as contract from "./lintContract";

namespace Master {
    export const increment: typeof contract.master.increment = (q) => {
        return Promise.resolve({
            num: ++q.num
        });
    }
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
    // Any optional initilization on worker;
}
