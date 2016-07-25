import * as sw from "../../utils/simpleWorker";

/**
 * There are two contracts
 * A contract on how the master --calls--> worker
 * A contract on how the worker --calls--> master
 */
export const worker = {
    /** Linter takes in all the files in the project */
    activeProjectFilePaths: {} as sw.QRFunction<{ filePaths: string[] }, {}>,
}

export const master = {
    /** Linter sends out errors */
    receiveErrorCacheDelta: {} as sw.QRFunction<ErrorCacheDelta, {}>,
}
