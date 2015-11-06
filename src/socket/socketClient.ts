import * as slc from "../socketLib/socketLibClient";
import * as contract from "./socketContract";
export import Types = contract.Types;

namespace Client {
    export var increment: typeof contract.client.increment = (q) => {
        return Promise.resolve({
            num: ++q.num
        });
    }
}

// Ensure that the namespace follows the contract
var _checkTypes: typeof contract.client = Client;
// launch client
export let {server, cast, pendingRequestsChanged, connectionStatusChanged}
    = slc.run({ clientImplementation: Client, serverContract: contract.server, cast: contract.cast });

// Sample usage
cast.hello.on((p) => { console.log(p) });
