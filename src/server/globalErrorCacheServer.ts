/**
 * A global view on the errors. This consolidates errors from all the workers + web server.
 *
 * A few error sources at the moment
 * - web server: active project config does some validation
 * - ts worker
 * - linter worker
 */
import {ErrorsCache} from "./utils/errorsCache";
export const errorsCache = new ErrorsCache();
errorsCache.errorsDelta.on(()=>{
    // console.log('Error count', errorsCache.debugGetErrorsFlattened().length); // DEBUG
})
