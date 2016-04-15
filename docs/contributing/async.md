# Process overview
The following shows the process boundaries

![](https://raw.githubusercontent.com/alm-tools/alm-tools.github.io/master/screens/design/process.png)

We have two libraries to manage this (designed for simple RPC) and both of them follow the same principle of `QueryResponse` async programming.

# Async programming

There are NPM libraries for such stuff but none written with the requirements of TypeScript in mind.
* DRY: A contract should only be defined once and any edits to that should result in compile errors in all places that need to change.
* Understanding Code: Doing a *find reference* on a contract should show both callers and implementation.

## Basic principle
Consider a function that takes a JavaScript object `Query` and returns a *promise* to a JavaScript object `Response`. If we have such an function (`QRFunction<Query,Response>`) it is trivial to take *the same code* (as long as its runtime dependencies allow it) and:
* mutate it on the *calling side* to simply pass the Query it over a JSON layer (e.g. a socket connection OR Inter Process Communication `ipc` for node workers) and wait for a response, creating a Promise in the meantime to pass back, and resolve this promise when the JSON layer comes back with the *actual* response.
* use it as is on the *called side*, but just register with the JSON layer as a responder for the query (detected by `name`).

## Contract
On thing to note is the *as long as its runtime dependencies allow it* gotcha (e.g. some function might depend on `fs` and you don't want to import such a module on the client). This is not always true, so we just create a *pseudo* object and call it `contract`. The calling side needs to do nothing with this object (except mutate it as documented), but the *called side* needs to provide a concrete implementation.
* We just let TypeScript verify the overall implementation on the *called side* by a line like `var _checkTypes: typeof contract.worker = Worker;`).
* Additionally individual function implementations use the contract too (e.g. `export var fileListUpdated: typeof contract.master.fileListUpdated = (q) => {`) and let TypeScript do the necessary type inference (`Query`) and validation `Promise<Qesponse>`.

## Two way
The contract can be two way by *just having two contracts*. E.g. for a socket : `client -> server` and `server -> client`. Having a contracts separated from implementations also means that we don't have to deal with cyclic dependencies when writing the implementations.

## Libraries
To take the contract + implementation and work the magic we have two libraries, `socketLib` and `simpleWorker`, that work over sockets and IPC respectively.

## More than just Promises
Basically anything that is *async* in its contract can be used under the same principle. Our `socketLib` allows us to convert *events* raised from the server become *events* that are emitted (`cast`) to all the clients. Great for stuff like an up to date error list, file changes etc.

## Example FrontEnd

We use socketio in the frontend. Checkout the [`socket` folder][socket] which contains the socket contract + server + client :rose:

# `simpleWorker`
Checkout the example [fileListing worker][fileListing]. Here is are the snippets you need to create a new worker:

## Contract
```ts
import * as sw from "../../utils/simpleWorker";

/**
 * There are two contracts
 * A contract on how the master --calls--> worker
 * A contract on how the worker --calls--> master
 */
export const worker = {
    // TODO: Put your own
    echo: {} as sw.QRFunction<{ text: string, num: number }, { text: string, num: number }>,
}

export const master = {
    // TODO: Put your own
    increment: {} as sw.QRFunction<{ num: number }, { num: number }>,
}
```

## Master
```ts
import * as sw from "../../utils/simpleWorker";
import * as contract from "./fileListingContract";

namespace Master {
    export const increment: typeof contract.master.increment = (q) => {
        return Promise.resolve({
            num: ++q.num
        });
    }
}

// Ensure that the namespace follows the contract
const _checkTypes: typeof contract.master = Master;
// launch worker
export const {worker} = sw.startWorker({
    workerPath: __dirname + '/fileListingWorker',
    workerContract: contract.worker,
    masterImplementation: Master
});
export function start() {
    // Any optional initilization on worker;
}
```

## Worker
```ts
import * as sw from "../../utils/simpleWorker";
import * as contract from "./fileListingContract";

namespace Worker {
    export const echo: typeof contract.worker.echo = (q) => {
        return master.increment(q).then((res) => {
            return {
                text: q.text,
                num: res.num
            };
        });
    }
}

// Ensure that the namespace follows the contract
const _checkTypes: typeof contract.worker = Worker;
// run worker
export const {master} = sw.runWorker({
    workerImplementation: Worker,
    masterContract: contract.master
});
```

You generally want to export a `start` function in the master and just call that to ensure that `master` file is loaded (hence worker started).

[socket]: https://github.com/alm-tools/alm/tree/e34bbf9cb6227f3cd150737fef5a47f212e2ad7a/src/socket
[fileListing]: https://github.com/alm-tools/alm/tree/master/src/server/workers/fileListing
