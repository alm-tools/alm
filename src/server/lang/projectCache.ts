import fs = require("fs");
import path = require("path");
import tsconfig = require("./core/tsconfig");
import {Project, languageServiceHost} from "./core/project";
import * as fsu from "../utils/fsu";
import {getOpenFiles} from "../disk/fileModelCache";
import {setErrorsForFilePath} from "./errorsCache";

/** utility interface **/
export interface FilePathQuery {
    filePath: string;
}

/** mutate and fix the filePath silently */
export function consistentPath(query: FilePathQuery) {
    if (!query.filePath) return;
    query.filePath = fsu.consistentPath(query.filePath);
}


////////////////////////////////////////////////////////////////////////////////////////
//////////////// MAINTAIN A HOT CACHE TO DECREASE FILE LOOKUPS /////////////////////////
////////////////////////////////////////////////////////////////////////////////////////

/**
 * for project only
 */
var projectByProjectFilePath: { [projectFilePath: string]: Project } = {}

/**
 * filePath is :
 * 	the project file path
 * 	Or any source ts file path
 */
var projectByFilePath: { [filePath: string]: Project } = {}

export interface SoftResetQuery {
    filePath: string;
    text: string;
}
export function resetCache(query: SoftResetQuery) {
    // clear the cache
    projectByProjectFilePath = {}
    projectByFilePath = {}

    if (query.filePath) {
        consistentPath(query);

        // Create cache for this file
        var project = getOrCreateProject(query.filePath);
        project.languageServiceHost.updateScript(query.filePath, query.text);
    }

    // Also update the cache for any other unsaved editors
    // TODO
    // queryParent.getUpdatedTextForUnsavedEditors({})
    //     .then(resp=> {
    //         resp.editors.forEach(e=> {
    //             consistentPath(e);
    //             var proj = getOrCreateProject(e.filePath);
    //             proj.languageServiceHost.updateScript(e.filePath, e.text);
    //         });
    //     });
}


///////////////////////////////////////////////////////////////////////////////////////////////// NEW CODE //////////////////////////////////////////


/** Create a project from a project file */
export function cacheAndCreateProject(projectFile: tsconfig.TypeScriptProjectFileDetails) {
    var project = projectByProjectFilePath[projectFile.projectFilePath] = new Project(projectFile);
    projectFile.project.files.forEach((file) => projectByFilePath[file] = project);

    // Update the language service host for any unsaved changes
    getOpenFiles().forEach(e=> {
        project.languageServiceHost.updateScript(e.config.filePath, e.getContents());
    });

    watchProjectFileIfNotDoingItAlready(projectFile.projectFilePath);

    return project;
}


/** Looks into the cache and if not found caches it */
export function getOrCreateProject(filePath: string) {

    filePath = fsu.consistentPath(filePath);
    if (projectByFilePath[filePath]) {
        // we are in good shape
        return projectByFilePath[filePath];
    }
    else {
        // We are in a bad shape. Why didn't we know of this file before?
        // Even if we find the projectFile we should invalidate it.
        var projectFile = getProjectFileFromDisk(filePath);
        var project = cacheAndCreateProject(projectFile);
        return project;
    }
}

/**
 * Project file error reporting
 */
function reportProjectFileErrors(ex:Error, filePath: string){
    var err: Error = ex;
    if (ex.message === tsconfig.errors.GET_PROJECT_JSON_PARSE_FAILED
        || ex.message === tsconfig.errors.GET_PROJECT_PROJECT_FILE_INVALID_OPTIONS
        || ex.message === tsconfig.errors.GET_PROJECT_GLOB_EXPAND_FAILED) {
        let details:tsconfig.ProjectFileErrorDetails = ex.details;
        setErrorsForFilePath({
            filePath: details.projectFilePath,
            errors: [`${ex.message} : ${ex.details.errorMessage}`]
        });
    }
    else {
        setErrorsForFilePath({
            filePath: filePath,
            errors: [`${ex.message}`]
        });
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
            // if we have a cache for it then clear it
            var project = projectByProjectFilePath[projectFilePath];
            if (project) {
                var files = project.projectFile.project.files;

                delete projectByProjectFilePath[projectFilePath];
                files.forEach((file) => delete projectByFilePath[file]);
            }
            return;
        }

        // Reload the project file from the file system and re cache it
        try {
            var projectFile = getProjectFileFromDisk(projectFilePath);
            cacheAndCreateProject(projectFile);
            setErrorsForFilePath({filePath: projectFile.projectFilePath, errors:[]});
        }
        catch (ex) {
            // Keep failing silently
            reportProjectFileErrors(ex, projectFilePath);
        }
    });
}


/**
 * This explicilty loads the project from the filesystem
 * For (lib.d.ts) and other (.d.ts files where project is not found) creation is done in memory
 */
export function getProjectFileFromDisk(filePath: string): tsconfig.TypeScriptProjectFileDetails {

    try {
        // If we are asked to look at stuff in lib.d.ts create its own project
        if (path.dirname(filePath) == languageServiceHost.typescriptDirectory) {
            return tsconfig.getDefaultInMemoryProject(filePath);
        }

        var projectFile = tsconfig.getProjectSync(filePath);
        setErrorsForFilePath({filePath: projectFile.projectFilePath, errors:[]});
        return projectFile;
    } catch (ex) {
        if (ex.message === tsconfig.errors.GET_PROJECT_NO_PROJECT_FOUND) {
            // If we have a .d.ts file then it is its own project and return
            if (tsconfig.endsWith(filePath.toLowerCase(), '.d.ts')) {
                return tsconfig.getDefaultInMemoryProject(filePath);
            }
            else {
                setErrorsForFilePath({
                    filePath: filePath,
                    errors: [
                        'No project file found'
                    ]
                });
                throw ex;
            }
        }
        else {
            reportProjectFileErrors(ex, filePath);
            throw ex;
        }
    }
}
