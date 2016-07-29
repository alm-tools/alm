/**
 * A global view on the errors. Essentially a sink for the errors from the server
 */
import {ErrorsCache} from "../server/utils/errorsCache";
export const errorsCache = new ErrorsCache();
