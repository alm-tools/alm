import * as sw from "../../../../utils/simpleWorker";
import * as contract from "./bundlerContract";
import { TypedEvent } from '../../../../../common/events';
import { LiveDemoBuildResult } from '../../../../../common/types';

/** Emitted everytime a build completes */
export const liveDemoBuildComplete = new TypedEvent<LiveDemoBuildResult>();

namespace Master {
    export const buildComplete: typeof contract.master.buildComplete = async (q) => {
        liveDemoBuildComplete.emit(q);
        return {};
    }
}
// Ensure that the namespace follows the contract
const _checkTypes: typeof contract.master = Master;

let stopPrevious = () => { };
export function start(config: {
    entryFileName: string,
    outputFileName: string,
}) {
    stopPrevious();
    // launch worker
    const { worker, parent } = sw.startWorker({
        workerPath: __dirname + '/bundlerWorker',
        workerContract: contract.worker,
        masterImplementation: Master
    });
    stopPrevious = () => parent.stopWorker();

    worker.start(config);
}
