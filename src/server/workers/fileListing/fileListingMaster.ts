import * as sw from "../../utils/simpleWorker";
import * as contract from "./fileListingContract";

import * as socketServer from "../../../socket/socketServer";
import {TypedEvent} from "../../../common/events";
import * as workingDir from "../../disk/workingDir";

export var filePathsUpdated = new TypedEvent<{ filePaths: string[] }>();
export var filePaths: string[] = [];

namespace Master {
    export var increment: typeof contract.master.increment = (q) => {
        return Promise.resolve({
            num: ++q.num
        });
    }
    export var fileListChanged: typeof contract.master.fileListChanged = (q) => {

        socketServer.cast.fileListUpdated.emit({ relativeFilePaths: q.fileList });

        filePaths = q.fileList.map(rfp => workingDir.makeAbsolute(rfp));
        filePathsUpdated.emit({ filePaths });

        return Promise.resolve({});
    }
}

// Ensure that the namespace follows the contract
var _checkTypes: typeof contract.master = Master;
// launch worker
export var {worker} = sw.startWorker(__dirname + '/fileListingWorker', contract.worker, Master);

export function start() {
    worker.setupWatch({ directory: workingDir.getProjectRoot() });
}
