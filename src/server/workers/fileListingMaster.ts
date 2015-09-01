import * as sw from "../utils/simpleWorker";
import * as contract from "./fileListingContract";

namespace Master {
    export var increment: typeof contract.master.increment = (q) => {
        return Promise.resolve({
            num: ++q.num
        });
    }
}
export = Master;

// Ensure that the namespace follows the contract
var _checkTypes: contract.MasterContract = Master;