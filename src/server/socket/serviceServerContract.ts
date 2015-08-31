// This file exists to get a contract for the client side code type checking 
// without taking an explicit dependency on the service file
import * as _service from "./serviceServer";
export type contract = typeof _service;

// the types are picked up from the top level type annotation
export let service: contract = {
    echo: null,
    getAllFiles: null,
};

// make sure the `name` is present on each field (which is all that is used at runtime from the client)
Object.keys(service).forEach(key => {
    service[key] = { name: key }
});
