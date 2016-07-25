/**
 * Load up TypeScript
 */
import * as byots  from "byots";
const ensureImport = byots;

import * as sw from "../../utils/simpleWorker";
import * as contract from "./lintContract";

import {resolve} from "../../../common/utils";
import * as types from "../../../common/types";
import * as Linter from "tslint";
import {LanguageServiceHost} from "../../../languageServiceHost/languageServiceHost";

namespace Worker {
    export const setProjectData: typeof contract.worker.setProjectData = (data) => {
        LinterImplementation.setProjectData(data);
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

/**
 * The actual linter stuff lives in this namespace
 */
namespace LinterImplementation {
    let projectData: types.ProjectDataLoaded | null = null;

    export function setProjectData(_projectData: types.ProjectDataLoaded) {
        projectData = _projectData;
        lintAgain();
    }

    function lintAgain() {
        console.log('About to start linting files: ', projectData.filePathWithContents.length); // DEBUG

        /**
         * Create the program
         */
         const languageServiceHost = new LanguageServiceHost(projectData.configFile.project.compilerOptions);

         // Add all the files
         projectData.filePathWithContents.forEach(({filePath,contents}) => {
             languageServiceHost.addScript(filePath, contents);
         });
         // And for incremental ones lint again
         languageServiceHost.incrementallyAddedFile.on((data)=>{
             // console.log(data); // DEBUG
             // TODO: lint : lint these files
         });

         const languageService = ts.createLanguageService(languageServiceHost, ts.createDocumentRegistry());
         const program = languageService.getProgram();


        /**
         * TODO: lint
         *
         * Load the linter config
         * create the Linter for each file and get its output
         *
         */
    }
}
