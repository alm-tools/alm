/**
 * Note: this function is common between instrumenter + our workers
 * So don't depend on any other `js` / `ts` (althought it might just work fine)
 */
import * as types from "../../../../common/types";
export {TestLog} from "../../../../common/types";
import {stringify} from "../../../../common/json";
export {stringify} from "../../../../common/json";
import {writeFile, readFile, deleteFile} from "../../../utils/fsu";

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
        if (l.endsWith(')')){
            const withStartRemoved = l.substr(l.indexOf('(') + 1);
            const withEndRemoved = withStartRemoved.substr(0, withStartRemoved.length - 2);
            return withEndRemoved;
        }
        else {
            return l;
        }
    });

    const stack = lines.map(l => {
        let [filePath, lineStr, chStr] = l.split(':');
        chStr = chStr || '0';

        const line = parseInt(lineStr);
        const ch = parseInt(chStr);

        return { filePath, position: { line, ch } };
    })

    return stack;
}

/**
 * We use the file to pass information from
 * - the instrumenter
 * - to the runner
 */
const getDataFilePath = (filePath:string) => filePath + '/_almTestData.json';
export type DataFileContents = {
    logs: types.TestLog[]
}
export const writeDataFile = (filePath: string, contents: DataFileContents) => {
    const dataFilePath = getDataFilePath(filePath);
    const contentsStr = stringify(contents);
    writeFile(dataFilePath,contentsStr);
}
export const readAndDeleteDataFile = (filePath: string) => {
    const dataFilePath = getDataFilePath(filePath);
    const result: DataFileContents = JSON.parse(readFile(dataFilePath));
    deleteFile(dataFilePath);
    return result;
}
