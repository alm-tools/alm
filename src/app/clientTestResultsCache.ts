/**
 * A global view into the error results on the client side
 */
import {TestResultsCache} from "../server/workers/tested/common/testResultsCache";
export const testResultsCache = new TestResultsCache();
