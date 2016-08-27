/**
 * @module
 */
import * as types from "../../../../common/types";
import * as cp from "child_process";
import * as utils from "../../../../common/utils";
import * as fsu from "../../../utils/fsu";
import * as json from "../../../../common/json";

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
    const mochaPath = `${nodeModulesFolder}/mocha/bin/mocha`;

    /** Execute this */
    const toExec
        = [mochaPath, `${tsNodePath}/register`, filePath,'--reporter', 'json'];

    // console.log("TESTED Will Exec", toExec); // DEBUG

    /** In this dir */
    const cwd = utils.getDirectory(filePath);

    /** With these compiler options */
    const TS_NODE_COMPILER_OPTIONS = tsNodeCompilerOptions;

    return new Promise<types.TestModule>((resolve, reject) => {
        const child = cp.spawn(process.execPath,toExec, {
            cwd,
            env: {
                TS_NODE_COMPILER_OPTIONS
            }
        });

        const output: string[] = [];
        child.stdout.on('data', (data) => {
            output.push(data.toString());
        });

        child.stderr.on('data', (data) => {
            console.log(`MOCHA STDERR: ${data}`);
        });

        child.on('close', (code) => {
            resolve(parseMochaJSON({ output: output.join(''), filePath }));
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

/**
 * Convert MOCHA json output to our test result format
 * http://mochajs.org/#json
 */
export function parseMochaJSON(cfg: { output: string, filePath: string }): types.TestModule {
    // console.log(cfg.output); // DEBUG
    const output = json.parse<MochaJSON>(cfg.output).data;
    // console.log(cfg.output) // DEBUG

    /** TODO: tested parse output */
    const result: types.TestModule = {
        filePath: cfg.filePath,
        suites: []
    }
    return result;
}


/**
 * Key mocha data structures
 * Gathered by running the samples ;)
 */
type MochaJSON = {
    stats: Stats;

    /** All the tests */
    tests: Test[];

    /** The same list as `tests` seperated out */
    pending: Test[];
    failures: Test[];
    passes: Test[];
}

interface Stats {
    suites: number;
    tests: number;
    passes: number;
    pending: number;
    failures: number;
    start: string;
    end: string;
    /** Duration in MS */
    duration: number;
}

interface Test {
    /** Title contains the `it` section */
    title: string;
    /** Full title contains the `describe` + ' ' + `it` sections */
    fullTitle: string;
    /**
     * Duration in ms
     * NOTE: note present if test is skipped
     */
    duration: number;
    currentRetry: number;
    err: {} | Err;
}

interface Err {
    /**
     * Multi line nodejs style stack trace
     */
    stack: string;
    /**
     * 'Fail'
     */
    message: string;
}
