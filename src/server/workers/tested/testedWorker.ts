import * as sw from "../../utils/simpleWorker";
import * as types from "../../../common/types";
import * as contract from "./testedContract";
import {resolve} from "../../../common/utils";
import * as fsu from "../../utils/fsu";
import {parse, parseErrorToCodeError} from "../../../common/json";

namespace Worker {
    export const fileSaved: typeof contract.worker.fileSaved = (data) => {
        /** TODO: tested file saved */

        if (data.filePath.toLowerCase().endsWith('tested.json')){
            TestedWorkerImplementation.restart();
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


namespace TestedWorkerImplementation {
    type TestedJsonRaw = {
        tests: {
            include: string[],
            exclude: string[],
        }
    }

    type TestedJson = {
        filePaths: string[];
    }

    /** Init errors */
    const errorCache = new ErrorsCache();
    errorCache.errorsDelta.on(master.receiveErrorCacheDelta);

    /** Init global state */
    let globalState = {
        started: false,
        testedJson: {
            filePath: []
        }
    }

    /**
     * Reinit the global state + errors
     */
    function reinit() {
        errorCache.clearErrors();
        globalState = {
            started: false,
            testedJson: {
                filePath: []
            }
        }
    }

    /**
     * Restart if:
     * - tested.json changes
     * - working directory changes
     */
    export function restart() {
        reinit();
        let testedJsonFilePath: string;
        try {
            testedJsonFilePath = fsu.travelUpTheDirectoryTreeTillYouFind(process.cwd(), 'tested.json');
        }
        catch (err) {
            // Leave disabled
            return;
        }

        // Validate tested.json
        const parsed = parse<TestedJsonRaw>(fsu.readFile(testedJsonFilePath));
        if (parsed.error){
            errorCache.setErrorsByFilePaths(
                [testedJsonFilePath],
                [parseErrorToCodeError(testedJsonFilePath,parsed.error)]
            );
            return;
        }

        const rawData = parsed.data;


    }
}


/** Utility: include / exclude expansion */
import * as byots from "byots";
function expandIncludeExclude(rootDir: string, cfg: { include: string[], exclude: string[] }): string[] {
    const tsResult = ts.parseJsonConfigFileContent(JSON.stringify({
        compilerOptions: {
            allowJs: true
        },
        include: cfg.include,
        exclude: cfg.exclude
    }),
        ts.sys,
        rootDir,
        null,
        rootDir + '/tsconfig.json');
    console.log(tsResult); // DEBUG
    return tsResult.fileNames || [];
}
