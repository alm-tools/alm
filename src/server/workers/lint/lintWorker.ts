import * as sw from "../../utils/simpleWorker";
import * as contract from "./lintContract";

import {resolve} from "../../../common/utils";

namespace Worker {
    export const activeProjectFilePaths: typeof contract.worker.activeProjectFilePaths = (data) => {
        console.log('Got the file paths. Now I should start linting them.', data.filePaths.length);
        return resolve({});
    }
}

// Ensure that the namespace follows the contract
const _checkTypes: typeof contract.worker = Worker;
// run worker
export const {master} = sw.runWorker({
    workerImplementation: Worker,
    masterContract: contract.master
});
