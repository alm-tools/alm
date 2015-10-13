import * as sw from "../../utils/simpleWorker";

/**
 * A worker consists of two contracts
 * a contract on how the master --calls--> worker
 * a contract on how the worker --calls--> master
 */
export var worker = {
    echo: {} as sw.QRFunction<{ text: string, num: number }, { text: string, num: number }>,
    fileList: {} as sw.QRFunction<{}, { relativeFilePaths: string[] }>,
    setupWatch: {} as sw.QRFunction<{ directory: string }, {}>
}

export var master = {
    increment: {} as sw.QRFunction<{ num: number }, { num: number }>,
    fileListUpdated: {} as sw.QRFunction<({ relativeFilePaths: string[] }), any>
}
