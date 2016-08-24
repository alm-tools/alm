import * as sw from "../../utils/simpleWorker";
import * as types from "../../../common/types";
import * as contract from "./testedContract";
import {resolve} from "../../../common/utils";
import * as fsu from "../../utils/fsu";
import {parse, parseErrorToCodeError} from "../../../common/json";

namespace Worker {
    export const fileSaved: typeof contract.worker.fileSaved = (data) => {
        /** TODO: tested file saved */
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
const errorCache = new ErrorsCache();
errorCache.errorsDelta.on(master.receiveErrorCacheDelta);

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

    const globalState = {
        started: false,

    }
    function reinit() {
        globalState.started = false;
        errorCache.clearErrors();
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
        const parsed = parse<TestedJsonRaw>(testedJsonFilePath);
        if (parsed.error){
            errorCache.setErrorsByFilePaths(
                [testedJsonFilePath],
                [parseErrorToCodeError(testedJsonFilePath,parsed.error)]
            );
            return;
        }

        const rawData = parsed.data;
        /** TODO: tested expand raw data into real data */
    }
}
