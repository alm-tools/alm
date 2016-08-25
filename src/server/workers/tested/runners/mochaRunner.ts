/**
 * @module
 */
import * as types from "../../../../common/types";
import * as cp from "child_process";
import * as utils from "../../../../common/utils";
import * as fsu from "../../../utils/fsu";

const tsNodeCompilerOptions = JSON.stringify({
    allowJs: true,
    target: 'es6',
    module: 'commonjs'
});

/** Main utility function to execute a command */
let mochaExec = (filePath:string): Promise<string> => {
    /** Find key paths */
    const nodeModulesFolder = fsu.travelUpTheDirectoryTreeTillYouFind(__dirname, "node_modules");
    const tsNodePath = `${nodeModulesFolder}/.bin/ts-node`;
    const mochaPath = `${nodeModulesFolder}/.bin/mocha`;

    /** Execute this */
    const toExec
        = `node ${tsNodePath} --compilerOptions '${tsNodeCompilerOptions}' ${mochaPath} ${filePath}`;

    console.log("Will Exec", toExec)

    /** In this dir */
    const cwd = utils.getDirectory(filePath);

    return new Promise((resolve, reject) => {
        cp.exec(toExec, { cwd: cwd }, (err, stdout, stderr) => {
            if (stderr.toString().trim().length) {
                return resolve(stderr.toString());
            }
            return resolve(stdout);
        });
    });
}


/**
 * Takes a file name and runs it with ts-node + mocha and
 * returns its parsed test output
 */
export function runTest(filePath: string): Promise<types.TestModule> {

    /** TODO: tested actually run the test */
    mochaExec(filePath).then(res=>{
        console.log(res);
    })

    const result: types.TestModule = {
        filePath: filePath,
        suites: []
    }
    return Promise.resolve(result);
}
