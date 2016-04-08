/**
 * A global view on the errors. This consolidates errors from all the workers + web server.
 *
 * Note: Only a few error sources at the moment
 * - worker: ts worker
 * - web server: active project config does some validation
 */
import {ErrorsCache} from "./utils/errorsCache";
export const errorsCache = new ErrorsCache();
