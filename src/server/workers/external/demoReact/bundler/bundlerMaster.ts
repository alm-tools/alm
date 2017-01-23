import * as sw from "../../../../utils/simpleWorker";
import * as contract from "./bundlerContract";
import { TypedEvent } from '../../../../../common/events';
import { LiveDemoBundleResult } from '../../../../../common/types';

/** Emitted everytime a build completes */
export const liveDemoBuildComplete = new TypedEvent<LiveDemoBundleResult>();

namespace Master {
    export const bundleStatus: typeof contract.master.bundleStatus = async (q) => {
        liveDemoBuildComplete.emit(q);
        return {};
    }
}
// Ensure that the namespace follows the contract
const _checkTypes: typeof contract.master = Master;

// launch worker
const { worker, parent } = sw.startWorker({
    workerPath: __dirname + '/bundlerWorker',
    workerContract: contract.worker,
    masterImplementation: Master
});

export function start(config: {
    entryFilePath: string,
    outputFilePath: string,
}) {
    worker.start(config);
}
