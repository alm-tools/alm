import * as sw from "../../utils/simpleWorker";
import * as types from "../../../common/types";

/**
 * A worker consists of two contracts
 * a contract on how the master --calls--> worker
 * a contract on how the worker --calls--> master
 */
export var worker = {
    echo: {} as sw.QRFunction<{ text: string, num: number }, { text: string, num: number }>,
    setupWatch: {} as sw.QRFunction<{ directory: string }, {}>
}

export var master = {
    increment: {} as sw.QRFunction<{ num: number }, { num: number }>,
    fileListUpdated: {} as sw.QRFunction<({ filePaths: types.FilePath[], completed: boolean }), any>,
    fileChanged: {} as sw.QRFunction<types.FilePath, any>
}
