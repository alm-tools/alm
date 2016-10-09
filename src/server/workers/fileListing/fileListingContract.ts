import * as sw from "../../utils/simpleWorker";
import * as types from "../../../common/types";

/**
 * There are two contracts
 * A contract on how the master --calls--> worker
 * A contract on how the worker --calls--> master
 */
export const worker = {
    echo: {} as sw.QRFunction<{ text: string, num: number }, { text: string, num: number }>,
    setupWatch: {} as sw.QRFunction<{ directory: string }, {}>
}

export const master = {
    increment: {} as sw.QRFunction<{ num: number }, { num: number }>,
    fileListUpdated: {} as sw.QRFunction<({ filePaths: types.FilePath[], completed: boolean }), any>,
    fileListingDelta: {} as sw.QRFunction<types.FileListingDelta, any>,
    abort: {} as sw.QRFunction<{ errorMessage: string }, {}>,
}
