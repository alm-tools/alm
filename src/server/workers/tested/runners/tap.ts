import * as types from "../../../../common/types";

/** Convert TAP to our test result format */
export function tap(cfg: { output: string, filePath: string }): types.TestModule {
    console.log(cfg.output);

    /** TODO: tested parse tap */
    const result: types.TestModule = {
        filePath: cfg.filePath,
        suites: []
    }
    return result;
}
