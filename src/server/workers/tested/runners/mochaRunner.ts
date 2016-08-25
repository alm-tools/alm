/**
 * @module
 */
import * as types from "../../../../common/types";

/**
 * Takes a file name and runs it with ts-node + mocha and
 * returns its parsed test output
 */
export function runTest(filePath: string): Promise<types.TestModule> {
    const result: types.TestModule = {
        filePath: filePath,
        suites: []
    }
    return Promise.resolve(result);
}
