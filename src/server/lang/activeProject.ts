/**
 * Manages active project.
 * Also pushes errors out to clients + keeps the language service + fileModelCache in sync
 */

import utils = require("../../common/utils");
import * as json from "../../common/json";
import * as fsu from "../utils/fsu";
import * as flm from "../workers/fileListing/fileListingMaster";
import * as wd from "../disk/workingDir";
import * as fmc from "../disk/fileModelCache";
import * as tsconfig from "./core/tsconfig";
import * as project from "./core/project";
import * as types from "../../common/types";
import {setErrorsByFilePaths, clearErrors, clearErrorsForFilePath} from "./errorsCache";
import {diagnosticToCodeError} from "./building";
import {makeBlandError} from "../../common/utils";
import {TypedEvent} from "../../common/events";
import equal = require('deep-equal');
import * as session from "../disk/session";
import * as workingDir from "../disk/workingDir";


/** The active project name */
// TODO:
// replace this with ActiveProjectConfigDetails
// Wire it up all the way to sending it to the client
// Then in the client show the longer name (node_modules if present)
// And on clicking it open the file from disk
let activeProjectConfigDetails: ActiveProjectConfigDetails = null;
export let activeProjectConfigDetailsUpdated = new TypedEvent<ActiveProjectConfigDetails>();
export let activeProjectFilePathsUpdated = new TypedEvent<{filePaths:string[]}>();

/** The name used if we don't find a project */
let implicitProjectName = "__auto__";

/** The currently active project */
let currentProject: project.Project = null;

/** All the available projects */
export let availableProjects = new TypedEvent<ActiveProjectConfigDetails[]>();
function refreshAvailableProjects() {
    return flm.filePathsCompleted.current().then((list) => {
        // Detect some tsconfig.json
        let tsconfigs = list.filePaths.map(t=> t.filePath).filter(t=> t.endsWith('tsconfig.json'));
        // sort by shortest length first (with extra big weight for node_modules):
        let weightConfig = (config: string) => config.includes('node_modules') ? config.length + 100 : config.length;
        tsconfigs = tsconfigs.sort(function(a, b) {
            return weightConfig(a) - weightConfig(b);
        });

        let projectConfigs: ActiveProjectConfigDetails[] = tsconfigs.map(Utils.tsconfigToActiveProjectConfigDetails);

        // If no tsconfigs add an implicit one!
        if (projectConfigs.length == 0) {
            projectConfigs.push({
                name: implicitProjectName,
                isImplicit: true,
            });
        };

        availableProjects.emit(projectConfigs);
    });
}

/** on server start */
export function start() {

    // Keep session on disk in sync
    activeProjectConfigDetailsUpdated.on((ap)=>{
        if (ap.tsconfigFilePath) {
            session.setTsconfigPath(ap.tsconfigFilePath);
        }
    });

    // Resume session
    let ses = session.getDefaultOrNewSession()
    if (ses.relativePathToTsconfig) {
        let tsconfig = workingDir.makeAbsolute(ses.relativePathToTsconfig);
        if (fs.existsSync(tsconfig)) {
            activeProjectConfigDetails = Utils.tsconfigToActiveProjectConfigDetails(tsconfig);
            activeProjectConfigDetailsUpdated.emit(activeProjectConfigDetails);
            syncCore(activeProjectConfigDetails);
        }
    }

    refreshAvailableProjects()
        .then(() => sync());
}


/**
  * Changes the active project.
  * Clear any previously reported errors and recalculate the errors
  * This is what the user should call if they want to manually sync as well
  */
export function setActiveProjectConfigDetails(_activeProjectConfigDetails: ActiveProjectConfigDetails) {
    activeProjectConfigDetails = _activeProjectConfigDetails;
    activeProjectConfigDetailsUpdated.emit(activeProjectConfigDetails);
    clearErrors();
    sync();
}

/** convert project name to current project */
export function sync() {
    availableProjects.current().then((projectConfigs) => {
        let activeProjectName = (activeProjectConfigDetails && activeProjectConfigDetails.name);
        // we are guaranteed as least one project config (which just might be the implicit one)
        let projectConfig = projectConfigs.filter(x=>x.name == activeProjectName)[0] || projectConfigs[0];
        syncCore(projectConfig);
    });
}

/** call this after we have some verified project config */
function syncCore(projectConfig:ActiveProjectConfigDetails){
    let activeProjectName = (activeProjectConfigDetails && activeProjectConfigDetails.name);
    currentProject = null;

    let configFileDetails = ConfigFile.getConfigFileFromDiskOrInMemory(projectConfig)
    currentProject = ConfigFile.createProjectFromConfigFile(configFileDetails);
    activeProjectFilePathsUpdated.emit({filePaths:currentProject.getProjectSourceFiles().map(x=> x.fileName)});

    // If we made it up to here ... means the config file was good :)
    if (!projectConfig.isImplicit) {
        clearErrorsForFilePath(projectConfig.tsconfigFilePath);
    }

    // Set the active project (the project we get returned might not be the active project name)
    // e.g. on initial load
    if (activeProjectName !== projectConfig.name) {
        activeProjectConfigDetails = projectConfig;
        activeProjectConfigDetailsUpdated.emit(activeProjectConfigDetails);
    }

    refreshAllProjectDiagnostics();
}

/**
 * As soon as we get a new file listing refresh available projects
 */
flm.filePathsCompleted.on(function(data) {
    refreshAvailableProjects();
});

/**
 * As soon as file changes on disk do a full reconcile ....
 */
fmc.savedFileChangedOnDisk.on((evt) => {
    // Check if its a part of the current project .... if not ignore :)
    let proj = GetProject.ifCurrent(evt.filePath)
    if (proj) {
        proj.languageServiceHost.updateScript(evt.filePath, evt.contents);
        refreshAllProjectDiagnostics();
    }
});
/**
 * As soon as edit happens apply to current project
 */
fmc.didEdit.on((evt) => {
    let proj = GetProject.ifCurrent(evt.filePath)
    if (proj) {
        proj.languageServiceHost.editScript(evt.filePath, evt.edit.from, evt.edit.to, evt.edit.newText);
        // For debugging
        // console.log(proj.languageService.getSourceFile(evt.filePath).text);

        // update errors for this file if its *heuristically* small
        if (evt.edit.from.line < 1000)
        {
            refreshFileDiagnostics(evt.filePath);
        }

        // After a while update all project diagnostics as well
        refreshAllProjectDiagnostics();
    }

    // Also watch edits to the current config file
    let currentConfigFilePath = activeProjectConfigDetails && activeProjectConfigDetails.tsconfigFilePath;
    if (evt.filePath == currentConfigFilePath){
        sync();
    }
});

/**
 * If there hasn't been a request for a while then we refresh
 * As its a bit slow to get *all* the errors
 */
var refreshAllProjectDiagnostics = utils.debounce(() => {
    if (currentProject) {
        // Send all the errors from the project files:
        let diagnostics = currentProject.getDiagnostics();
        let errors = diagnostics.map(diagnosticToCodeError);
        let filePaths = currentProject.getProjectSourceFiles().map(x=> x.fileName);
        setErrorsByFilePaths(filePaths, errors);
    }
}, 3000);

/**
 * Constantly streaming this is slow for large files so this is debounced as well
 */
var refreshFileDiagnostics = utils.debounce((filePath:string) => {
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
import fs = require("fs");
import path = require("path");
import {Project, languageServiceHost} from "./core/project";
import {getOpenFiles} from "../disk/fileModelCache";
namespace ConfigFile {

    /** Create a project from a project file */
    export function createProjectFromConfigFile(configFile: tsconfig.TypeScriptConfigFileDetails) {
        var project = new Project(configFile);

        // Update the language service host for any unsaved changes
        getOpenFiles().forEach(fileModel=> {
            if (project.includesSourceFile(fileModel.config.filePath)) {
                project.languageServiceHost.updateScript(fileModel.config.filePath, fileModel.getContents());
            }
        });

        return project;
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
    export function getConfigFileFromDiskOrInMemory(config: ActiveProjectConfigDetails): tsconfig.TypeScriptConfigFileDetails {
        if (!config.tsconfigFilePath) {
            // TODO: THIS isn't RIGHT ...
            // as this function is designed to work *from a single source file*.
            // we need one thats designed to work from *all source files*.
            return tsconfig.getDefaultInMemoryProject(process.cwd());
        }
        else {
            var filePath = config.tsconfigFilePath;
        }

        try {
            // If we are asked to look at stuff in lib.d.ts create its own project
            if (path.dirname(filePath) == languageServiceHost.typescriptDirectory) {
                return tsconfig.getDefaultInMemoryProject(filePath);
            }

            var projectFile = tsconfig.getProjectSync(filePath);
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
            console.error(types.errors.CALLED_WHEN_NO_ACTIVE_PROJECT_FOR_FILE_PATH, "Global active project");
            throw new Error(types.errors.CALLED_WHEN_NO_ACTIVE_PROJECT_FOR_FILE_PATH);
        }
        return currentProject;
    }
}

/** General purpose utility functions specific to this file */
namespace Utils {
    export function tsconfigToActiveProjectConfigDetails(tsconfig: string): ActiveProjectConfigDetails {
        let relative = workingDir.makeRelative(tsconfig);
        let isNodeModule = relative.includes('node_modules');
        return {
            name: isNodeModule ? relative : utils.getDirectoryAndFileName(tsconfig),
            isImplicit: false,
            tsconfigFilePath: tsconfig
        };
    }
}
