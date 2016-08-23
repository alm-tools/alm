import * as sw from "../../utils/simpleWorker";
import * as types from "../../../common/types";
import * as contract from "./testedContract";
import {resolve} from "../../../common/utils";

import * as testResultCache from "./common/testResultCache";
const testCache = new testResultCache.TestResultCache();

namespace Master {
    export const receiveTestResultDelta: typeof contract.master.receiveTestResultDelta
        = (data) => {
            testCache.applyDelta(data);
            return resolve({});
        };
}

// Ensure that the namespace follows the contract
const _checkTypes: typeof contract.master = Master;
// launch worker
export const {worker} = sw.startWorker({
    workerPath: __dirname + '/testedWorker',
    workerContract: contract.worker,
    masterImplementation: Master
});
export function start() {
    // Any optional initilization on worker;
}
