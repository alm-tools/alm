/**
 * Note: this function is common between instrumenter + our workers
 * So don't depend on any other `js` / `ts` (althought it might just work fine)
 */
import * as types from "../../../../common/types";
export { TestLog, TestSuitePosition, TestItPosition } from "../../../../common/types";
import { stringify, parse } from "../../../../common/json";
export { stringify } from "../../../../common/json";
import { writeFile, readFile, deleteFile, consistentPath, travelUpTheDirectoryTreeTillYouFind } from "../../../utils/fsu";

/**
Error: Fail
  at Context.<anonymous> (D:\REPOS\alm\src\tests\testedTest.ts:21:15)
  at callFn (D:\REPOS\alm\node_modules\mocha\lib\runnable.js:334:21)
  at Test.Runnable.run (D:\REPOS\alm\node_modules\mocha\lib\runnable.js:327:7)
  at Runner.runTest (D:\REPOS\alm\node_modules\mocha\lib\runner.js:429:10)
  at D:\REPOS\alm\node_modules\mocha\lib\runner.js:535:12
  at next (D:\REPOS\alm\node_modules\mocha\lib\runner.js:349:14)
  at D:\REPOS\alm\node_modules\mocha\lib\runner.js:359:7
  at next (D:\REPOS\alm\node_modules\mocha\lib\runner.js:285:14)
  at Immediate._onImmediate (D:\REPOS\alm\node_modules\mocha\lib\runner.js:327:5)
*/
export const makeStack = (raw: string): types.TestErrorStack => {
    let lines = raw.split(/\r\n?|\n/);
    /** First line is just the error message. Don't need it */
    lines = lines.slice(1);

    /** Remove each leading `at ` */
    lines = lines.map(l => l.trim().substr(3));

    /** For lines that have function name, they end with `)`. So detect and remove leading `(` for them */
    lines = lines.map(l => {
        if (l.endsWith(')')) {
            const withStartRemoved = l.substr(l.indexOf('(') + 1);
            const withEndRemoved = withStartRemoved.substr(0, withStartRemoved.length - 1);
            return withEndRemoved;
        }
        else {
            return l;
        }
    });

    const stack = lines.map(l => {
        let parts = l.split(':');

        const chStr = parts[parts.length - 1];
        const lineStr = parts[parts.length - 2];
        /** NOTE: file path on windows will contain `:`. Hence the join */
        const filePath = consistentPath(parts.slice(0, parts.length - 2).join(':'));

        /**
         * The chrome ones are 1 based. We want 0 based
         */
        const line = parseInt(lineStr) - 1;
        const ch = parseInt(chStr) - 1;

        return { filePath, position: { line, ch } };
    })

    return stack;
}

/**
 * When we care about the last log point in the file.
 */
export const makeTestLogPosition = (filePath: string, stack: types.TestErrorStack): types.TestLogPosition => {
    const tipOfTheStack = stack[0];
    const result: types.TestLogPosition = {
        isActualLastInFile: tipOfTheStack.filePath === filePath,
        lastPositionInFile: stack.find(s => s.filePath === filePath) ? stack.find(s => s.filePath === filePath).position
            : { line: 0, ch: 0 },
        stack
    }
    return result;
}

/**
 * When we care about the last log point in the file.
 */
export const makeTestLogPositionFromMochaError = (
    filePath: string,
    stack: types.TestErrorStack,
    /**
     * The stack might not actually contain any reference to file path
     * This happens e.g. when one throws a `string` instead of `error` in mocha.
     * So this is the position we use in such cases
     */
    positionIfFilePathNotFound: EditorPosition
): types.TestLogPosition => {
    const tipOfTheStack = stack[0];

    const lastPositionInFile = stack.find(s => s.filePath === filePath)
        ? stack.find(s => s.filePath === filePath).position
        : positionIfFilePathNotFound;

    const result: types.TestLogPosition = {
        isActualLastInFile: !!tipOfTheStack && tipOfTheStack.filePath === filePath,
        lastPositionInFile,
        stack
    }
    return result;
}

/** Utility to get stack */
export const stackFromCaller = () => makeStack((new Error() as any).stack)
    /**
     * Skip 1 as its this function
     * Skip another as its the function calling us
     */
    .slice(2);

/**
 * We use the file to pass information from
 * - the instrumenter
 * - to the runner
 */
const getDataFilePath = (filePath: string) => filePath + '_almTestData.json';
export type DataFileContents = {
    logs: types.TestLog[]
    suites: types.TestSuitePosition[],
    its: types.TestItPosition[],
}
export const writeDataFile = (filePath: string, contents: DataFileContents) => {
    const dataFilePath = getDataFilePath(filePath);
    const contentsStr = stringify(contents);
    writeFile(dataFilePath, contentsStr);
}
export const readAndDeleteDataFile = (filePath: string) => {
    const dataFilePath = getDataFilePath(filePath);
    const result: DataFileContents = parse<DataFileContents>(readFile(dataFilePath)).data || {
        logs: [],
        suites: [],
        its: []
    };
    deleteFile(dataFilePath);
    return result;
}
