/**
 * @module
 */
import * as types from "../../../../common/types";
import * as cp from "child_process";
import * as utils from "../../../../common/utils";
import * as fsu from "../../../utils/fsu";
import * as json from "../../../../common/json";
import {makeStack, readAndDeleteDataFile} from "./instrumenterCommon";

const tsNodeCompilerOptions = JSON.stringify({
    /**
     * Keep getting "cannot write file" ts / ts-node errors otherwise
     */
    allowJs: false,
    /** Node's not quite there yet */
    target: 'es5',
    module: 'commonjs'
});

/** Main utility function to execute a command */
let mochaExec = (filePath:string) => {
    /** Find key paths */
    const nodeModulesFolder = fsu.travelUpTheDirectoryTreeTillYouFind(__dirname, "node_modules");
    const tsNodePath = `${nodeModulesFolder}/ts-node`;
    const mochaPath = `${nodeModulesFolder}/mocha/bin/mocha`;
    const instrumentationPath = __dirname + '/mochaInstrumenter.ts';

    /** Execute this */
    const toExec
        = [
            mochaPath,
            `${tsNodePath}/register`,
            instrumentationPath,
            /**
             * NOTE: the location of `filePath` in args is used by the instrumenter
             * -3
             */
            filePath,
            '--reporter', 'json'
        ];

    // console.log("TESTED Will Exec", toExec); // DEBUG

    /** In this dir */
    const cwd = utils.getDirectory(filePath);

    /** With these compiler options */
    const TS_NODE_COMPILER_OPTIONS = tsNodeCompilerOptions;

    return new Promise<types.TestModule>((resolve, reject) => {
        const child = cp.spawn(process.execPath,toExec, {
            cwd,
            env: {
                TS_NODE_COMPILER_OPTIONS,
                /**
                 * Disable cache just because
                 */
                TS_NODE_CACHE: false,
                /**
                 * disableWarnings as we don't want it to prevent us from running the js
                 */
                TS_NODE_DISABLE_WARNINGS: true,
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

    const stats = output.stats;
    // console.log(output.stats); // DEBUG

    const tests = output.tests || [];

    const suites: types.TestSuiteResult[] = [];

    /**
     * PLAN
     * Collect first level suites
     * Collect second level suites
     */
    /**
     * First collect all the suite names
     * Becuase they go like:
     * a
     *   test
     *   test
     *
     *   a b
     *     test
     *     test
     *
     *   test
     *   test
     * k
     *   test
     *
     *   k u
     *     test
     *
     * We only need to keep the *current* suite and add to that.
     */

    const suiteMap: { [description: string]: types.TestSuiteResult } = Object.create(null);
    const suiteExists = (description: string): boolean => !!suiteMap[description];
    const getOrCreateSuite = (description: string) => {
        /** If already created return */
        if (suiteExists(description)) return suiteMap[description];

        /**
         * Otherwise create
         */
        let currentSuite: types.TestSuiteResult = {
            description,
            suites: [],
            tests: [],
            stats: {
                testCount: 0,
                passCount: 0,
                failCount: 0,
                skipCount: 0,
                durationMs: 0,
            }
        }

        /** Add to suite map for faster lookup */
        suiteMap[description] = currentSuite;

        /**
         * Add to suites
         * If the last test spec name is same as the start of this one then its a sub spec ;)
         */
        if (suites.length && (description.startsWith(suites[suites.length - 1].description))) {
            const lastSuite = suites[suites.length - 1];
            currentSuite.description = currentSuite.description.substr(lastSuite.description.length).trim();
            lastSuite.suites.push(currentSuite);
        }
        else { /** Otherwise its a new root level spec */
            suites.push(currentSuite);
        }

        /** Return */
        return currentSuite;
    }

    tests.forEach(test => {
        const suiteDescription = test.fullTitle.substr(0, test.fullTitle.length - test.title.length).trim();

        const suite = getOrCreateSuite(suiteDescription);

        const testStatus = (test: Test): types.TestStatus => {
            if (test.duration == null) {
                return types.TestStatus.Skipped
            }
            if (!Object.keys(test.err).length) {
                return types.TestStatus.Success
            }
            return types.TestStatus.Fail;
        }

        const makeTestError = (test: Test): types.TestError => {
            if (!Object.keys(test.err).length) {
                return undefined;
            }
            const err = test.err as Err;

            const message = err.stack;
            const stack = makeStack(err.stack);

            /**
             * Position
             */
            const tipOfStack = stack[0];

            const testError: types.TestError = {
                filePath: cfg.filePath,
                position: tipOfStack.position,
                message: message,
                stack: stack
            }

            return testError;
        }

        const testResult = {
            description: test.title,
            status: testStatus(test),
            durationMs: test.duration,
            error: makeTestError(test)
        }

        suite.tests.push(testResult);

        /** Update suite stats */
        suite.stats = {
            testCount: suite.stats.testCount + 1,
            passCount: testResult.status === types.TestStatus.Success ? suite.stats.passCount + 1 : suite.stats.passCount,
            failCount: testResult.status === types.TestStatus.Fail ? suite.stats.failCount + 1 : suite.stats.failCount,
            skipCount: testResult.status === types.TestStatus.Skipped ? suite.stats.skipCount + 1 : suite.stats.skipCount,
            durationMs: suite.stats.durationMs + (testResult.durationMs || 0),
        }
    });

    // console.log(suites); // DEBUG

    const instrumentationData = readAndDeleteDataFile(cfg.filePath);
    // console.log(JSON.stringify(instrumentationData.logs, null, 2)); // DEBUG

    const result: types.TestModule = {
        filePath: cfg.filePath,
        suites,

        logs: instrumentationData.logs,

        stats: {
            testCount: stats.tests,

            passCount: stats.passes,
            failCount: stats.failures,
            skipCount: stats.pending,

            durationMs: stats.duration,
        }
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
    /** Full title contains the `describe` + (any other)` describe` + ' ' + `it` sections */
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
