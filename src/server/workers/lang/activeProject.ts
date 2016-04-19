/**
 * Manages active project.
 * Also pushes errors out to clients + keeps the language service in sync
 */

import utils = require("../../../common/utils");
import * as json from "../../../common/json";
import * as tsconfig from "./core/tsconfig";
import * as project from "./core/project";
import {typescriptDirectory} from "./core/typeScriptDir";
import * as types from "../../../common/types";
import {errorsCache} from "./cache/tsErrorsCache";
const {setErrorsByFilePaths, clearErrors, clearErrorsForFilePath} = errorsCache;
import {diagnosticToCodeError} from "./modules/building";
import {makeBlandError} from "../../../common/utils";
import {TypedEvent} from "../../../common/events";
import equal = require('deep-equal');
import * as chalk from "chalk";

import {master as masterType} from "./projectServiceContract";
let master: typeof masterType;
export function setMaster(m: typeof masterType) {
    master = m;
}

/** The active project name */
let activeProjectConfigDetails: types.ProjectDataLoaded = null;
/** The currently active project */
let currentProject: project.Project = null;

/**
  * Changes the active project.
  * Clear any previously reported errors and recalculate the errors
  * This is what the user should call if they want to manually sync as well
  */
export function setActiveProjectConfigDetails(projectData: types.ProjectDataLoaded) {
    initialSync = true;
    activeProjectConfigDetails = projectData;
    return ConfigFile.createProjectFromConfigFile(projectData).then((project)=>{
        currentProject = project;
        clearErrors();
        refreshAllProjectDiagnostics();
        return project;
    });
}

function sync() {
    setActiveProjectConfigDetails(activeProjectConfigDetails);
}

/**
 * File changing on disk
 */
export function filePathsUpdated() {
    // We should do a full sync. As the file paths from `tsconfig` might have changed
    // But lets hold off on that idea as it might be slow
}
export function fileEdited(evt: { filePath: string, edit: CodeEdit }) {
    let proj = GetProject.ifCurrent(evt.filePath)
    if (proj) {
        proj.languageServiceHost.applyCodeEdit(evt.filePath, evt.edit.from, evt.edit.to, evt.edit.newText);
        // For debugging
        // console.log(proj.languageService.getSourceFile(evt.filePath).text);

        // update errors for this file if its *heuristically* small
        if (evt.edit.from.line < 1000) {
            refreshFileDiagnostics(evt.filePath);
        }

        // After a while update all project diagnostics as well
        refreshAllProjectDiagnosticsDebounced();
    }

    // Also watch edits to the current config file
    let currentConfigFilePath = activeProjectConfigDetails && activeProjectConfigDetails.configFile.projectFilePath;
    if (evt.filePath == currentConfigFilePath) {
        sync();
    }
}
export function fileChangedOnDisk(evt: { filePath: string; contents: string }) {
    // Check if its a part of the current project .... if not ignore :)
    let proj = GetProject.ifCurrent(evt.filePath)
    if (proj) {
        proj.languageServiceHost.setContents(evt.filePath, evt.contents);
        refreshAllProjectDiagnosticsDebounced();
    }
}

/**
 * If there hasn't been a request for a while then we refresh
 * As its a bit slow to get *all* the errors
 */
let initialSync = false;
const refreshAllProjectDiagnostics = () => {
    if (currentProject) {
        const timeStart = new Date().getTime();
        if (initialSync) {
            console.error(`[TSC] Started Initial Error Analysis: ${currentProject.configFile.projectFilePath}`);
        }
        else {
            console.log(`[TSC] Incremental Error Analysis ${currentProject.configFile.projectFilePath}`);
            console.time('[TSC] Incremental Error Analysis');
        }

        // Get all the errors from the project files:
        let diagnostics = currentProject.getDiagnostics();
        let errors = diagnostics.map(diagnosticToCodeError);
        let filePaths = currentProject.getFilePaths();

        setErrorsByFilePaths(filePaths, errors);


        console.error('[TSC] Error Analysis Duration:', Math.ceil((new Date().getTime() - timeStart)/1000) + 's');
        console.log(`[TSC] FileCount: ${filePaths.length} `, errors.length? chalk.red(`Errors: ${errors.length}`): chalk.green(`Errors: ${errors.length}`));
        initialSync = false;
    }
};
const refreshAllProjectDiagnosticsDebounced = utils.debounce(refreshAllProjectDiagnostics, 3000);

/**
 * Constantly streaming this is slow for large files so this is debounced as well
 */
const refreshFileDiagnostics = utils.debounce((filePath:string) => {
    let proj = GetProject.ifCurrent(filePath)
    if (proj) {
        let diagnostics = proj.getDiagnosticsForFile(filePath);
        let errors = diagnostics.map(diagnosticToCodeError);
        setErrorsByFilePaths([filePath], errors);
    }
}, 1000);

/**
 * Utility functions to convert a `configFile` to a `project`
 */
import path = require("path");
import {Project} from "./core/project";
namespace ConfigFile {

    /** Create a project from a project file */
    export function createProjectFromConfigFile(projectData: types.ProjectDataLoaded) {
        var project = new Project();
        return project.init(projectData).then(()=>project);
    }

    /**
     * Project file error reporting
     */
    function reportProjectFileErrors(ex: Error, filePath: string) {
        var err: Error = ex;
        if (ex.message === tsconfig.errors.GET_PROJECT_JSON_PARSE_FAILED
            || ex.message === tsconfig.errors.GET_PROJECT_PROJECT_FILE_INVALID_OPTIONS
            || ex.message === tsconfig.errors.GET_PROJECT_GLOB_EXPAND_FAILED) {
            let details: tsconfig.ProjectFileErrorDetails = ex.details;
            setErrorsByFilePaths([filePath], [details.error]);
        }
        else {
            setErrorsByFilePaths([filePath], [makeBlandError(filePath, `${ex.message}`)]);
        }
    }


    /**
     * This explicilty loads the project from the filesystem
     * For (lib.d.ts) and other (.d.ts files where project is not found) creation is done in memory
     */
    export function getConfigFileFromDiskOrInMemory(config: ActiveProjectConfigDetails): types.TypeScriptConfigFileDetails {
        if (!config.tsconfigFilePath) {
            // TODO: THIS isn't RIGHT ...
            // as this function is designed to work *from a single source file*.
            // we need one thats designed to work from *all source files*.
            return tsconfig.getDefaultInMemoryProject(process.cwd());
        }

        const filePath = config.tsconfigFilePath;

        try {
            // If we are asked to look at stuff in lib.d.ts create its own project
            if (path.dirname(filePath) == typescriptDirectory) {
                return tsconfig.getDefaultInMemoryProject(filePath);
            }

            const projectFile = tsconfig.getProjectSync(filePath);
            clearErrorsForFilePath(projectFile.projectFilePath);
            return projectFile;
        } catch (ex) {
            if (ex.message === tsconfig.errors.GET_PROJECT_NO_PROJECT_FOUND) {
                // If we have a .d.ts file then it is its own project and return
                if (tsconfig.endsWith(filePath.toLowerCase(), '.d.ts')) {
                    return tsconfig.getDefaultInMemoryProject(filePath);
                }
                else {
                    setErrorsByFilePaths([filePath], [makeBlandError(filePath, 'No project file found')]);
                    throw ex;
                }
            }
            else {
                reportProjectFileErrors(ex, filePath);
                throw ex;
            }
        }
    }
}


/** Get project functions */
export namespace GetProject {
    /**
     * Utility function used all the time
     */
    export function ifCurrent(filePath: string): project.Project {
        if (currentProject && currentProject.includesSourceFile(filePath)) {
            return currentProject;
        }
    }

    /**
     * Sometimes (e.g in the projectService) you want to error out
     * because these functions should not be called if there is no active project
     */
    export function ifCurrentOrErrorOut(filePath: string): project.Project {
        let proj = ifCurrent(filePath);

        if (!proj) {
            console.error(types.errors.CALLED_WHEN_NO_ACTIVE_PROJECT_FOR_FILE_PATH, filePath);
            throw new Error(types.errors.CALLED_WHEN_NO_ACTIVE_PROJECT_FOR_FILE_PATH);
        }

        return proj;
    }

    /**
     * Get current if any
     */
    export function getCurrentIfAny(): project.Project {
        if (!currentProject) {
            console.error(types.errors.CALLED_WHEN_NO_ACTIVE_PROJECT_GLOBAL);
            throw new Error(types.errors.CALLED_WHEN_NO_ACTIVE_PROJECT_GLOBAL);
        }
        return currentProject;
    }
}
