// This file exists to get a contract for the server side code type checking 
// without taking an explicit dependency on the service file
import * as _service from "./serviceClient";

// the types are picked up from the top level type annotation
export let serviceClient: typeof _service = {
    incrementNumber: null
};

// make sure the `name` is present on each field (which is all that is used at runtime from the client)
Object.keys(serviceClient).forEach(key => {
    serviceClient[key] = { name: key }
});

