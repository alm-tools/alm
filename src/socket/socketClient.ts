import * as slc from "../socketLib/socketLibClient";
import * as contract from "./socketContract";

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
let client = new slc.Client(Client);
export let server = client.sendAllToSocket(contract.server);
export let cast = client.setupAllCast(contract.cast);

// Sample usage
cast.hello.on((p) => { console.log(p) });


