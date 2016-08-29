/**
 * Make typescript available globally
 */
import * as byots  from "byots";
const ensureImport = byots;

import * as sw from "../../utils/simpleWorker";
import * as types from "../../../common/types";
import * as contract from "./testedContract";
import {resolve} from "../../../common/utils";
import * as fsu from "../../utils/fsu";
import {parse, parseErrorToCodeError} from "../../../common/json";
import * as utils from "../../../common/utils";
import * as mochaRunner from "./runners/mochaRunner";

import {TypedEvent} from "../../../common/events";
/** On working */
export const working = new TypedEvent<types.Working>();

const testedMessagePrefix = `[TESTED]`;

/**
 * TIP if other workers start using this file we will move its parsing / handling
 * to the main web worker.
 */
const configFileName = 'alm.json';

namespace Worker {
    export const init: typeof contract.worker.init = (data) => {
        TestedWorkerImplementation.init(data.workingDir);
        TestedWorkerImplementation.restart();
        return resolve({});
    }

    export const fileSaved: typeof contract.worker.fileSaved = (data) => {
        /** TODO: tested new test file added to the directory */

        if (data.filePath.toLowerCase().endsWith(configFileName)){
            TestedWorkerImplementation.restart();
        }

        if (TestedWorkerImplementation.globalState.started) {
            if (TestedWorkerImplementation.globalState.testedJson.filePaths.some(x => data.filePath === x)) {
                TestedWorkerImplementation.globalState.filePathsToRun.push(data.filePath);
                TestedWorkerImplementation.runNext();
            }
        }

        return resolve({});
    }
}

// Ensure that the namespace follows the contract
const _checkTypes: typeof contract.worker = Worker;
// run worker
export const {master} = sw.runWorker({
    workerImplementation: Worker,
    masterContract: contract.master
});

import {ErrorsCache} from "../../utils/errorsCache";
import {TestResultCache} from "./common/testResultCache";

namespace TestedWorkerImplementation {
    type TestedJsonRaw = {
        tests: {
            include?: string[],
            exclude?: string[],
        }
    }

    type TestedJson = {
        filePaths: string[];
    }

    /** Init errors */
    const errorCache = new ErrorsCache();
    errorCache.errorsDelta.on(master.receiveErrorCacheDelta);

    /** Init test result cache */
    const testResultCache = new TestResultCache();
    testResultCache.testResultsDelta.on(master.receiveTestResultsDelta);

    /** Init global state */
    export let globalState = {
        started: false,
        workingDir: '',
        testedJson: {
            filePaths: []
        },
        filePathsToRun: []
    }

    /**
     * Reinit the global state + errors
     */
    export function init(workingDir = '') {
        errorCache.clearErrors();
        testResultCache.clearResults();
        globalState = {
            started: false,
            workingDir,
            testedJson: {
                filePaths: []
            },
            filePathsToRun: []
        }
    }

    function reinit() {
        init(globalState.workingDir);
    }

    /**
     * Restart if:
     * - config file changes
     * - working directory changes
     */
    export function restart() {
        reinit();
        let testedJsonFilePath: string;
        try {
            testedJsonFilePath = fsu.travelUpTheDirectoryTreeTillYouFind(globalState.workingDir, configFileName);
        }
        catch (err) {
            // Leave disabled
            return;
        }

        // Validate configFile
        const parsed = parse<TestedJsonRaw>(fsu.readFile(testedJsonFilePath));
        if (parsed.error){
            errorCache.setErrorsByFilePaths(
                [testedJsonFilePath],
                [parseErrorToCodeError(testedJsonFilePath,parsed.error)]
            );
            return;
        }

        const rawData = parsed.data;

        /** This config file may or may not be valid. But its definitely not for `testing` */
        if (!rawData.tests) {
            return;
        }

        /** Sanitize raw data */
        rawData.tests.include = rawData.tests.include || ["./**/*.ts", "./**/*.tsx"],
        rawData.tests.exclude = rawData.tests.exclude || ["node_modules"];

        /** Expand the filePaths */
        const filePaths = expandIncludeExclude(utils.getDirectory(testedJsonFilePath),rawData.tests);

        /** Good to go */
        globalState.started = true;
        globalState.testedJson = {
            filePaths
        };

        console.log(testedMessagePrefix, "File count:", filePaths.length);

        /** Kick off */
        globalState.filePathsToRun = filePaths;
        runNext();
    }

    let runningSomeTest = false;
    export function runNext() {
        if (runningSomeTest) return;

        if (globalState.filePathsToRun.length) {
            const next = globalState.filePathsToRun.shift();
            globalState.filePathsToRun = utils.uniq(globalState.filePathsToRun);

            runningSomeTest = true;
            working.emit({working: true});
            mochaRunner.runTest(next).then(res=>{
                /**
                 * Add result
                 */
                testResultCache.addResult(res);

                /** No longer running */
                runningSomeTest = false;

                /** Try and run the next one if any */
                runNext();
            });
        }
        else {
            working.emit({working: false});
            console.log(testedMessagePrefix, "Done");
        }
    }
}

/** Utility: include / exclude expansion */
function expandIncludeExclude(rootDir: string, cfg: { include?: string[], exclude?: string[] }): string[] {
    const tsResult = ts.parseJsonConfigFileContent(
        {
            compilerOptions: {
                allowJs: true
            },
            include: cfg.include,
            exclude: cfg.exclude
        },
        ts.sys,
        rootDir
    );
    // console.log(tsResult); // DEBUG
    return tsResult.fileNames || [];
}
