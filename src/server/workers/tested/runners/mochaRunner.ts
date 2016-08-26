/**
 * @module
 */
import * as types from "../../../../common/types";
import * as cp from "child_process";
import * as utils from "../../../../common/utils";
import * as fsu from "../../../utils/fsu";
import {tap} from "./tap";

const tsNodeCompilerOptions = JSON.stringify({
    allowJs: true,
    target: 'es6',
    module: 'commonjs'
});

/** Main utility function to execute a command */
let mochaExec = (filePath:string) => {
    /** Find key paths */
    const nodeModulesFolder = fsu.travelUpTheDirectoryTreeTillYouFind(__dirname, "node_modules");
    const tsNodePath = `${nodeModulesFolder}/ts-node`;
    const mochaPath = `${nodeModulesFolder}/.bin/mocha`;

    /** Execute this */
    const toExec
        = `node ${mochaPath} '${tsNodePath}/register' ${filePath} --reporter tap`;

    // console.log("TESTED Will Exec", toExec); // DEBUG

    /** In this dir */
    const cwd = utils.getDirectory(filePath);

    /** With these compiler options */
    const TS_NODE_COMPILER_OPTIONS = tsNodeCompilerOptions;

    return new Promise((resolve, reject) => {
        cp.exec(toExec, {
            cwd,
            env: {
                TS_NODE_COMPILER_OPTIONS
            }
        }, (err, stdout, stderr) => {
            const output =
                stderr.toString().trim().length
                    ? stderr.toString()
                    : stdout.toString();

            return resolve(tap({ output, filePath }));
        });
    });
}


/**
 * Takes a file name and runs it with ts-node + mocha and
 * returns its parsed test output
 */
export function runTest(filePath: string): Promise<types.TestModule> {
    return mochaExec(filePath);
}
