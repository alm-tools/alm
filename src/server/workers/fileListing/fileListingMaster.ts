import * as sw from "../../utils/simpleWorker";
import * as contract from "./fileListingContract";

import * as socketServer from "../../socket/socketServer";

namespace Master {
    export var increment: typeof contract.master.increment = (q) => {
        return Promise.resolve({
            num: ++q.num
        });
    }
    export var fileListChanged: typeof contract.master.fileListChanged = (q) => {
        socketServer.cast.fileListUpdated.emit({ fileList: q.fileList });
        return Promise.resolve({});
    }
}

// Ensure that the namespace follows the contract
var _checkTypes: typeof contract.master = Master;
// launch worker
export var {worker} = sw.startWorker(__dirname + '/fileListingWorker', contract.worker, Master);
