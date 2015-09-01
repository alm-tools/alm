import * as sw from "../utils/simpleWorker";

/**
 * A worker consists of two contracts
 * a contract on how the master --calls--> worker
 * a contract on how the worker --calls--> master
 */

export var master = {
    increment: null as sw.QRFunction<{ num: number }, { num: number }>
}

export type MasterContract = typeof master;

export var worker = {
    echo: null as sw.QRFunction<{ text: string, num: number }, { text: string, num: number }>
}

export type WorkerContract = typeof worker;

sw.setupNames(master);
sw.setupNames(worker);