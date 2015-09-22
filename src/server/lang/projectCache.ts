import fs = require("fs");
import path = require("path");
import tsconfig = require("./core/tsconfig");
import {Project, languageServiceHost} from "./core/project";
import * as fsu from "../utils/fsu";
import {getOpenFile} from "../disk/fileModelCache";

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

var projectByProjectFilePath: { [projectFilePath: string]: Project } = {}

/**
 * filePath is :
 * 	the project file path
 * 	Or any source ts file path
 */
var projectByFilePath: { [filePath: string]: Project } = {}

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
            var projectFile = getOrCreateProjectFile(projectFilePath);
            cacheAndCreateProject(projectFile);
            // TODO
            // queryParent.setConfigurationError({ projectFilePath: projectFile.projectFilePath, error: null });
        }
        catch (ex) {
            // Keep failing silently
            // TODO: reuse reporting logic
        }
    });
}

/** We are loading the project from file system.
    This might not match what we have in the editor memory, so query those as well
*/
export function cacheAndCreateProject(projectFile: tsconfig.TypeScriptProjectFileDetails) {
    var project = projectByProjectFilePath[projectFile.projectFilePath] = new Project(projectFile);
    projectFile.project.files.forEach((file) => projectByFilePath[file] = project);

    // query the parent for unsaved changes
    // We do this lazily
    // TODO
    // queryParent.getUpdatedTextForUnsavedEditors({})
    //     .then(resp=> {
    //         resp.editors.forEach(e=> {
    //             consistentPath(e);
    //             project.languageServiceHost.updateScript(e.filePath, e.text);
    //         });
    //     });

    watchProjectFileIfNotDoingItAlready(projectFile.projectFilePath);

    return project;
}

/**
 * This explicilty loads the project from the filesystem
 * For (lib.d.ts) and other (.d.ts files where project is not found) creation is done in memory
 */
export function getOrCreateProjectFile(filePath: string): tsconfig.TypeScriptProjectFileDetails {

    try {
        // If we are asked to look at stuff in lib.d.ts create its own project
        if (path.dirname(filePath) == languageServiceHost.typescriptDirectory) {
            return tsconfig.getDefaultInMemoryProject(filePath);
        }

        var projectFile = tsconfig.getProjectSync(filePath);
        // TODO
        // queryParent.setConfigurationError({ projectFilePath: projectFile.projectFilePath, error: null });
        return projectFile;
    } catch (ex) {
        var err: Error = ex;
        if (err.message === tsconfig.errors.GET_PROJECT_NO_PROJECT_FOUND) {
            // If we have a .d.ts file then it is its own project and return
            if (tsconfig.endsWith(filePath.toLowerCase(), '.d.ts')) {
                return tsconfig.getDefaultInMemoryProject(filePath);
            }
            // Otherwise report error
            else {
                // var projectFile = tsconfig.createProjectRootSync(filePath);
                // queryParent.notifySuccess({ message: 'AtomTS: tsconfig.json file created: <br/>' + projectFile.projectFilePath });
                // queryParent.setConfigurationError({ projectFilePath: projectFile.projectFilePath, error: null });
                // return projectFile;
                let details: tsconfig.GET_PROJECT_NO_PROJECT_FOUND_Details = ex.details;
                // TODO
                // queryParent.setConfigurationError({
                //     projectFilePath: details.projectFilePath,
                //     error: {
                //         message: ex.message,
                //         details: ex.details
                //     }
                // });
            }
        }
        if (ex.message === tsconfig.errors.GET_PROJECT_JSON_PARSE_FAILED) {
            var details0: tsconfig.GET_PROJECT_JSON_PARSE_FAILED_Details = ex.details;
            // TODO
            // queryParent.setConfigurationError({
            //     projectFilePath: details0.projectFilePath,
            //     error: {
            //         message: ex.message,
            //         details: ex.details
            //     }
            // });
            // Watch this project file to see if user fixes errors
            watchProjectFileIfNotDoingItAlready(details0.projectFilePath);
        }
        if (ex.message === tsconfig.errors.GET_PROJECT_PROJECT_FILE_INVALID_OPTIONS) {
            var details1: tsconfig.GET_PROJECT_PROJECT_FILE_INVALID_OPTIONS_Details = ex.details;
            // TODO
            // queryParent.setConfigurationError({
            //     projectFilePath: details1.projectFilePath,
            //     error: {
            //         message: ex.message,
            //         details: ex.details
            //     }
            // });
            // Watch this project file to see if user fixes errors
            watchProjectFileIfNotDoingItAlready(details1.projectFilePath);
        }
        if (ex.message === tsconfig.errors.GET_PROJECT_GLOB_EXPAND_FAILED) {
            var details2: tsconfig.GET_PROJECT_GLOB_EXPAND_FAILED_Details = ex.details;
            // TODO
            // queryParent.setConfigurationError({
            //     projectFilePath: details2.projectFilePath,
            //     error: {
            //         message: ex.message,
            //         details: ex.details
            //     }
            // });
            // Watch this project file to see if user fixes errors
            watchProjectFileIfNotDoingItAlready(details2.projectFilePath);
        }
        throw ex;
    }
}

/** Looks into the cache and if not found caches it */
export function getOrCreateProject(filePath: string) {

    // For transform files we check for the file with .ts extension in cache
    if (tsconfig.endsWith(filePath, '.tst')) {
        filePath = filePath + '.ts';
    }

    filePath = fsu.consistentPath(filePath);
    if (projectByFilePath[filePath]) {
        // we are in good shape
        return projectByFilePath[filePath];
    }
    else {
        // We are in a bad shape. Why didn't we know of this file before?
        // Even if we find the projectFile we should invalidate it.
        var projectFile = getOrCreateProjectFile(filePath);
        var project = cacheAndCreateProject(projectFile);
        return project;
    }
}


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


// also let the project cache check for updates
import * as flm from "../workers/fileListing/fileListingMaster";
flm.filePathsUpdated.on(function (data) {
    let tsconfigs = data.filePaths.filter(t=> t.endsWith('tsconfig.json'));
    let local = tsconfigs.filter(t=> !t.includes('node_modules'));
    local.forEach(fig => {
        if (!projectByProjectFilePath[fig]){
            getOrCreateProjectFile(fig);
        }
    });
})