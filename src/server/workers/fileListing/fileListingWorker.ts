import * as sw from "../../utils/simpleWorker";
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

// Ensure that the namespace follows the contract
var _checkTypes: contract.WorkerContract = Worker;
// run worker
export var {master} = sw.runWorker(Worker, contract.master);