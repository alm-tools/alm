/**
 * Tracks tsb.json and the active project within that
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


/** The active project name */
let activeProjectName = '';
export let activeProjectNameUpdated = new TypedEvent<{ activeProjectName: string }>();

/** The name used if we don't find a project */
let implicitProjectName = "__auto__";

/** The currently active project */
let currentProject: project.Project = null;

/** All the available projects */
export let availableProjects = new TypedEvent<ProjectConfigDetails[]>();
function refreshAvailableProjects() {
    return flm.filePathsUpdated.current().then((list) => {
        // Detect some tsconfig.json
        let tsconfigs = list.filePaths.filter(t=> t.endsWith('tsconfig.json'));
        // exclude node_modules
        tsconfigs = tsconfigs.filter(t=> !t.includes('node_modules'));
        // sort by shortest lenght first:
        tsconfigs = tsconfigs.sort(function(a, b) {
            return a.length - b.length;
        });

        let projectConfigs: ProjectConfigDetails[] = tsconfigs.map(tsconfig=> {
            return {
                name: utils.getFolderAndFileName(tsconfig),
                tsconfigFilePath: tsconfig
            };
        });

        // If no tsconfigs add an implicit one!
        if (projectConfigs.length == 0) {
            projectConfigs.push({
                name: implicitProjectName
            });
        };

        availableProjects.emit(projectConfigs);
    });
}

/** on server start */
export function start() {
    refreshAvailableProjects();
    sync();
}


/**
  * Changes the active project.
  * Clear any previously reported errors and recalculate the errors
  * This is what the user should call if they want to manually sync as well
  */
export function setActiveProjectName(name: string) {
    activeProjectName = name;
    activeProjectNameUpdated.emit({ activeProjectName });
    clearErrors();
    sync();
}

/** convert project name to current project */
export function sync() {
    availableProjects.current().then((projectConfigs) => {
        let projectConfig = projectConfigs.filter(x=>x.name == activeProjectName)[0] || projectConfigs[0];

        currentProject = null;
        let configFileDetails = ConfigFile.getConfigFileFromDiskOrInMemory(projectConfig)
        currentProject = ConfigFile.createProjectFromConfigFile(configFileDetails);

        // Set the active project (the project we get returned might not be from the active project name)
        if (activeProjectName !== projectConfig.name) {
            activeProjectName = projectConfig.name;
            activeProjectNameUpdated.emit({ activeProjectName });
        }

        refreshAllProjectDiagnostics();
    });
}

/**
 * As soon as we get a new file listing refresh available projects
 */
flm.filePathsUpdated.on(function(data) {
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

        // update errors for this file
        let diagnostics = proj.getDiagnosticsForFile(evt.filePath);
        let errors = diagnostics.map(diagnosticToCodeError);
        setErrorsByFilePaths([evt.filePath], errors);

        // After a while update all project diagnostics as well
        refreshAllProjectDiagnostics();
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
}, 2000);


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

        watchProjectFileIfNotDoingItAlready(configFile.projectFilePath);

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
        // Watch this project file to see if user fixes errors
        watchProjectFileIfNotDoingItAlready(filePath);
    }

    /**
     * Project file watching
     */
    var watchingProjectFile: { [projectFilePath: string]: boolean } = {}
    function watchProjectFileIfNotDoingItAlready(projectFilePath: string) {

        // Don't watch lib.d.ts and other
        // projects that are "in memory" only
        if (!fs.existsSync(projectFilePath)) {
            return;
        }

        if (watchingProjectFile[projectFilePath]) return; // Only watch once
        watchingProjectFile[projectFilePath] = true;

        fs.watch(projectFilePath, { persistent: false }, () => {
            // if file no longer exists
            if (!fs.existsSync(projectFilePath)) {
                return;
            }

            // if not the active project
            if (!currentProject || !currentProject.configFile || !currentProject.configFile.projectFilePath) {
                return;
            }
            if (projectFilePath !== currentProject.configFile.projectFilePath) {
                return;
            }

            // Reload the project file from the file system and re cache it
            setActiveProjectName(activeProjectName);
        });
    }


    /**
     * This explicilty loads the project from the filesystem
     * For (lib.d.ts) and other (.d.ts files where project is not found) creation is done in memory
     */
    export function getConfigFileFromDiskOrInMemory(config: ProjectConfigDetails): tsconfig.TypeScriptConfigFileDetails {
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
}
