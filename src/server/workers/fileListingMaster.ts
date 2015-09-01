import * as sw from "../utils/simpleWorker";
import * as contract from "./fileListingContract";

namespace Master {
    export var increment: typeof contract.master.increment = (q) => {
        return Promise.resolve({
            num: ++q.num
        });
    }
}

// Ensure that the namespace follows the contract
var _checkTypes: contract.MasterContract = Master;
export var worker = sw.startWorker(__dirname + '/fileListingWorker', contract.worker, Master);