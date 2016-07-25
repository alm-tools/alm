import * as sw from "../../utils/simpleWorker";

/**
 * There are two contracts
 * A contract on how the master --calls--> worker
 * A contract on how the worker --calls--> master
 */
export const worker = {
    // TODO: Put your own
    echo: {} as sw.QRFunction<{ text: string, num: number }, { text: string, num: number }>,
}

export const master = {
    // TODO: Put your own
    increment: {} as sw.QRFunction<{ num: number }, { num: number }>,
}
