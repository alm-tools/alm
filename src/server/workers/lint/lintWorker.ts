import * as sw from "../../utils/simpleWorker";
import * as contract from "./lintContract";

import {resolve} from "../../../common/utils";
import * as Linter from "tslint";

namespace Worker {
    export const activeProjectFilePaths: typeof contract.worker.activeProjectFilePaths = (data) => {
        // console.log('Linter got filePaths', data.filePaths.length); // DEBUG
        LinterImplementation.setFilePaths(data.filePaths);
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


namespace LinterImplementation {
    let filePaths: string[] = [];

    export function setFilePaths(_filePaths: string[]) {
        filePaths = filePaths;
        lintAgain();
    }

    /**
     * We only create the program when we are ready to lint
     */
    let program: ts.Program | null = null;

    function lintAgain() {
        /**
         * TODO: lint
         * create the program
         *
         * create the Linter for each file and get its output
         *
         */
    }
}
