/**
 * This is your interface to the `worker` from the `master`
 */
import * as sw from "../utils/simpleWorker";
import * as contract from "./fileListingContract";
import * as master from "./fileListingMaster";

export var worker = sw.run(__dirname + '/fileListingWorker', contract.worker, master);