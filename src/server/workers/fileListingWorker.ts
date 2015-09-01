import * as sw from "../utils/simpleWorker";
import * as contract from "./fileListingContract";

namespace Worker {
    export var echo: typeof contract.worker.echo = (q) => {
        return master.increment(q).then((res) => {
            return {
                text: q.text,
                num: res.num
            };
        });
    }
}
export = Worker;

// Ensure that the namespace follows the contract
var _checkTypes: contract.WorkerContract = Worker;
// Register as a worker
var child = new sw.Child();
child.registerAllFunctionsExportedFromAsResponders(Worker);
var master = child.sendAllToIpc(contract.master);