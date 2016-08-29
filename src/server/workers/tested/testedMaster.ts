import * as sw from "../../utils/simpleWorker";
import * as types from "../../../common/types";
import * as contract from "./testedContract";
import {resolve} from "../../../common/utils";
import {TypedEvent} from "../../../common/events";

/** This is were we push the errors */
import {errorsCache} from "../../globalErrorCacheServer";

import * as testResultCache from "./common/testResultsCache";
export const testCache = new testResultCache.TestResultsCache();

export const working = new TypedEvent<types.Working>();

namespace Master {
    export const receiveTestResultsDelta: typeof contract.master.receiveTestResultsDelta
        = (data) => {
            testCache.applyTestResultsDelta(data);
            return resolve({});
        };
    export const receiveErrorCacheDelta: typeof contract.master.receiveErrorCacheDelta
        = (data) => {
            errorsCache.applyDelta(data);
            return resolve({});
        };
    export const receiveWorking: typeof contract.master.receiveWorking
        = (data) => {
            working.emit(data);
            return resolve({});
        }
}

// Ensure that the namespace follows the contract
const _checkTypes: typeof contract.master = Master;
// launch worker
export const {worker} = sw.startWorker({
    workerPath: __dirname + '/testedWorker',
    workerContract: contract.worker,
    masterImplementation: Master
});

import * as fmc from "../../disk/fileModelCache";
import * as wd from "../../disk/workingDir";
export function start() {
    /** Start up the working with working dir */
    const init = () => worker.init({workingDir: wd.getProjectRoot()});
    wd.projectRootUpdated.on(init);
    init();

    // only saved ones as linter reads directly from disk and works on whole file contents
    fmc.didStatusChange.on((update) => update.saved && worker.fileSaved({ filePath: update.filePath }));
}
