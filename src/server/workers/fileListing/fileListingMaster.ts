import * as sw from "../../utils/simpleWorker";
import * as contract from "./fileListingContract";

import {TypedEvent} from "../../../common/events";
import * as workingDir from "../../disk/workingDir";
import * as types from "../../../common/types";
import {emitServerExit} from "../../../socket/serverExit";
import * as chalk from "chalk";

/** called whenever the list of files we know about is updated */
export const filePathsUpdated = new TypedEvent<{ filePaths: types.FilePath[]; rootDir: string; completed: boolean;}>();
/** only starts getting called when the initial file paths listing is completed */
export const filePathsCompleted = new TypedEvent<{ filePaths: types.FilePath[]; rootDir: string; completed: boolean;}>();

/**
 * Incremental and buffered
 */
export const fileListingDelta = new TypedEvent<types.FileListingDelta>();
const gfileListingDelta = fileListingDelta;

namespace Master {
    export const increment: typeof contract.master.increment = (q) => {
        return Promise.resolve({
            num: ++q.num
        });
    }

    export const abort: typeof contract.master.abort = (q) => {
        console.log(chalk.red(q.errorMessage));
        emitServerExit();
        return Promise.resolve({});
    }

    /** warning, this function is named differently from the event filePathsUpdated for a reason */
    export const fileListUpdated: typeof contract.master.fileListUpdated = (q) => {
        if (q.completed) {
            filePathsCompleted.emit({ filePaths: q.filePaths, rootDir: workingDir.getProjectRoot(), completed:q.completed });
        }
        filePathsUpdated.emit({ filePaths: q.filePaths, rootDir: workingDir.getProjectRoot(), completed:q.completed });
        return Promise.resolve({});
    }

    export const fileListingDelta: typeof contract.master.fileListingDelta = (q) => {
        gfileListingDelta.emit(q);
        return Promise.resolve({});
    }
}

// Ensure that the namespace follows the contract
const _checkTypes: typeof contract.master = Master;
// launch worker
export const {worker} = sw.startWorker({
    workerPath: __dirname + '/fileListingWorker',
    workerContract: contract.worker,
    masterImplementation: Master,
    onCrashRestart: ()=> {
        start();
    }
});

export function start() {
    worker.setupWatch({ directory: workingDir.getProjectRoot() });
}
