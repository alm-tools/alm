import * as sw from "../../utils/simpleWorker";

/**
 * There are two contracts
 * A contract on how the master --calls--> worker
 * A contract on how the worker --calls--> master
 */
export const worker = {
    enableLiveDemo: {} as sw.QRFunction<{ filePath: string }, {}>,
    disableLiveDemo: {} as sw.QRFunction<{}, {}>
}

export const master = {
    receiveClearLiveDemo: {} as sw.QRFunction<{}, {}>,
    receiveLiveDemoData: {} as sw.QRFunction<{ data: string }, {}>,
}
