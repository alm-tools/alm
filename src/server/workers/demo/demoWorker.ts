import * as sw from "../../utils/simpleWorker";
import * as contract from "./demoContract";

const workerPrefix = `[DEMO]`;

namespace Worker {
    export const enableLiveDemo: typeof contract.worker.enableLiveDemo = (q) => {
        WorkerImplementation.enableLiveDemo(q.filePath);
        return Promise.resolve({});
    }
    export const disableLiveDemo: typeof contract.worker.disableLiveDemo = (q) => {
        WorkerImplementation.disableLiveDemo();
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

class FileExecutor {
    constructor(filePath: string, cb: (data: string) => void) {
        // TODO: demo
    }
    kill() {
        // TODO: demo
    }
}

namespace WorkerImplementation {
    let executor: FileExecutor | undefined;
    export const enableLiveDemo = (filePath: string) => {
        console.log(workerPrefix, `Started on filePath: ${filePath}`);
        if (executor) {
            executor.kill();
        }
        master.receiveClearLiveDemo({});
        executor = new FileExecutor(filePath, (data) => {
            master.receiveLiveDemoData({data});
        });
    }
    export const disableLiveDemo = () => {
        if (executor) {
            master.receiveClearLiveDemo({});
            executor.kill();
            executor = undefined;
        }
    }
}
