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
import {isFileInTypeScriptDir} from "../lang/core/typeScriptDir";

const linterMessagePrefix = `[LINT]`

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

    /** The tslint linter takes a few configuration options before it can lint a file */
    interface LinterConfig {
        projectData: types.ProjectDataLoaded;
        program: ts.Program;
    }
    let linterConfig: LinterConfig | null = null;

    /** We only do this once per project change */
    let informedUserAboutMissingConfig: boolean = false;

    /**
      * This is the entry point for the linter to start its work
      */
    export function setProjectData(projectData: types.ProjectDataLoaded) {
        informedUserAboutMissingConfig = false;

        /**
         * Create the program
         */
        const languageServiceHost = new LanguageServiceHost(projectData.configFile.project.compilerOptions);

        // Add all the files
        projectData.filePathWithContents.forEach(({filePath, contents}) => {
            languageServiceHost.addScript(filePath, contents);
        });
        // And for incremental ones lint again
        languageServiceHost.incrementallyAddedFile.on((data) => {
            //  console.log(data); // DEBUG
            lintAgain();
        });

        const languageService = ts.createLanguageService(languageServiceHost, ts.createDocumentRegistry());
        const program = languageService.getProgram();

        /**
         * Now create the tslint config
         */
        linterConfig = {
            projectData,
            program
        };

        lintAgain();
    }

    /**
     * Called whenever
     *  - a file is edited
     *  - added to the compilation context
     */
    function lintAgain() {
        const sourceFiles = linterConfig.program.getSourceFiles().filter(x => !isFileInTypeScriptDir(x.fileName));
        if (!sourceFiles.length) return;

        /** Look for tslint.json by findup from the project dir */
        const projectDir = linterConfig.projectData.configFile.projectFileDirectory;
        const configurationPath = Linter.findConfigurationPath(null, projectDir);
        // console.log({configurationPath}); // DEBUG
        /** lint abort if the config is not ready present yet */
        if (!configurationPath) {
            if (!informedUserAboutMissingConfig) {
                informedUserAboutMissingConfig = true;
                console.log(linterMessagePrefix, 'No tslint configuration found.');
            }
            return;
        }

        /** We have our configuration file. Now lets convert it to configuration :) */
        const configuration = Linter.loadConfigurationFromPath(configurationPath);

        /** Now start the lazy lint */
        lintWithCancellationToken(configuration);
    }

    /** TODO: support cancellation token */
    function lintWithCancellationToken(linterConfiguration: any) {
        console.log(linterMessagePrefix, 'About to start linting files: ', linterConfig.program.getSourceFiles().length); // DEBUG

        /**
         * TODO: lint
         *
         * Load the linter config
         * create the Linter for each file and get its output
         *
         */
    }
}
