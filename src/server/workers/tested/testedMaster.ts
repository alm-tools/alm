import * as sw from "../../utils/simpleWorker";
import * as types from "../../../common/types";
import * as contract from "./testedContract";
import {resolve, debounce} from "../../../common/utils";
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
import * as activeProjectConfig from "../../disk/activeProjectConfig";
/**
 * Some things e.g. filePaths updated happen a lot.
 * So debounce this
 */
const syncDebounced = debounce(()=>worker.init({workingDir: wd.getProjectRoot()}), 500);
export function start() {
    /** Start up the working with working dir */
    wd.projectRootUpdated.on(syncDebounced);

    /** File save */
    fmc.didStatusChange.on((update) => {
        // saved ones as worker reads directly from disk and works on whole file contents
        update.saved && worker.fileSaved({ filePath: update.filePath })

        /**
         * If a saved file is in the compilation context we should really run all tests
         * untill we have a better dependency analysis
         */
        activeProjectConfig.projectFilePathsUpdated.current().then(res => {
            if (res.filePaths.some(fp => fp === update.filePath)){
                syncDebounced();
            }
        });
    });

    /**
     * New test file added to the directory
     * NOTE: it works because
     *  - new test files should also be a part of the compilation context
     *    And that triggers a file paths update ;)
     */
    activeProjectConfig.projectFilePathsUpdated.on(syncDebounced);
}
