/**
 * Tracks tsb.json and the active project within that
 */
import * as json from "../../common/json";
import * as fsu from "../utils/fsu";
import * as flm from "../workers/fileListing/fileListingMaster";
import * as wd from "../disk/workingDir";
import * as fmc from "../disk/fileModelCache";
import * as tsconfig from "./core/tsconfig";
import * as project from "./core/project";
import {setErrorsForFilePath, clearErrors} from "./errorsCache";

import equal = require('deep-equal');

import simpleValidator = require('./core/simpleValidator');
var types = simpleValidator.types;

interface TsbJson {
    projects: ProjectJson[];
}

export const errors = {
    ReadErrorTsb: "Failed to read file tsb.json",
}

/** Utility function so that I don't need to keep passing this around */
function getTsbPath() {
    return fsu.resolve(process.cwd(), "tsb.json");
}

/** The active project name */
let activeProjectName = '';

/**
  * Chages the active project.
  * Clear any previously reported errors and recalculate the errors
  * This is what the user should call if they want to manually sync as well
  */
export function setActiveProjectName(name: string) {
    activeProjectName = name;
    clearErrors();
    sync();
}

/** A simple wrapper around json parse for strong typing + relative path soring */
function readTsb(): json.ParsedData<TsbJson> {
    let expectedLocation = getTsbPath();

    try {
        var contents = fsu.readFile(expectedLocation);
    }
    catch (e) {
        return {
            error: {
                message: errors.ReadErrorTsb,
                at: {
                    line: 0,
                    ch: 0
                }
            }
        };
    }

    let parsed = json.parse<TsbJson>(contents);
    if (parsed.data && parsed.data.projects) {
        parsed.data.projects = parsed.data.projects.map(p=> {
            if (p.tsconfig) {
                p.tsconfig = wd.makeAbsolute(p.tsconfig);
            }
            return p;
        });
    }
    return parsed;
}

/**
 * Wraps up read tsb into something that returns the current project (if found)
 * or creates one from tsconfig.json (if found)
 * or errors
 */
export function getCurrentOrDefaultProjectDetails(): Promise<ProjectJson> {

    // if there is a tsb.json
    // use it!
    let tsbContents = readTsb();

    // If tsb has valid projects, return active (or first)
    if (tsbContents.data && tsbContents.data.projects && tsbContents.data.projects.length) {
        let first = tsbContents.data.projects[0];
        let foundActive = tsbContents.data.projects.filter(p=> p.name == activeProjectName)[0];

        return Promise.resolve(foundActive ? foundActive : first);
    }

    // otherwise create some from tsconfig
    return flm.filePathsUpdated.current().then((list) => {
        // Detect some tsconfig.json
        let tsconfigs = list.filePaths.filter(t=> t.endsWith('tsconfig.json'));
        // exclude node_modules
        tsconfigs = tsconfigs.filter(t=> !t.includes('node_modules'));
        // sort by shortest lenght first:
        tsconfigs = tsconfigs.sort(function(a, b) {
            return a.length - b.length;
        });

        if (tsconfigs.length) {
            let tsconfig = tsconfigs[0];

            return {
                name: '__auto__',
                tsconfig
            };
        }

        // If no tsconfig.json ... abort for now!
        throw new Error('No tsconfig.json found!');
    });
}

/**
 * The currently active project
 */
let currentProject: project.Project = null;

/**
 * As soon as we get a new file listing ... check if tsb.json is there. If it is start watching / parsing it
 */
flm.filePathsUpdated.on(function(data) {
    let expectedLocation = getTsbPath();
    startWatchingIfNotDoingAlready();
});

/**
  * Note: If there are any errors we do not cast the bad project list
  * But we always report the correct errors (or clear them)
  */
function parseAndCastTsb(contents: string) {
    let parsed = json.parse<TsbJson>(contents);

    if (parsed.error) {
        reportTsbErrors([parsed.error.message]);
        return;
    }
    reportTsbErrors([]);

    if (parsed.data && parsed.data.projects) {
        parsed.data.projects = parsed.data.projects.map(p=> {
            if (p.tsconfig) {
                p.tsconfig = wd.makeAbsolute(p.tsconfig);
            }
            return p;
        });
    }
    currentTsbContents.emit(parsed.data);

    function reportTsbErrors(errors: string[]) {
        let expectedLocation = getTsbPath();
        setErrorsForFilePath({
            filePath: expectedLocation,
            errors: errors
        });
    }
}

/** convert active tsb project name to current project */
function sync() {
    getCurrentOrDefaultProjectDetails().then((projectJson) => {
        currentProject = null;
        let configFileDetails = ConfigFile.getConfigFileFromDisk(projectJson.tsconfig)
        currentProject = ConfigFile.createProjectFromConfigFile(configFileDetails);
    });
}


import {cast} from "../../socket/socketServer";
import {TypedEvent} from "../../common/events";
export let currentTsbContents = new TypedEvent<TsbJson>();
/**
 * As soon as the server boots up we need to do an initial attempt
 */
export function startWatchingIfNotDoingAlready() {
    // Load up the tsb
    sync();
    let expectedLocation = getTsbPath();

    if (fsu.existsSync(expectedLocation) && !fmc.isFileOpen(expectedLocation)) {
        let tsbFile = fmc.getOrCreateOpenFile(expectedLocation);
        tsbFile.onSavedFileChangedOnDisk.on((evt) => {
            let contents = evt.contents;
            parseAndCastTsb(contents);

            /// If you change tsb.json
            /// This is enough to justify a full sync
            sync();
        });
        parseAndCastTsb(tsbFile.getContents());
    }
}


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
        getOpenFiles().forEach(e=> {
            project.languageServiceHost.updateScript(e.config.filePath, e.getContents());
        });

        watchProjectFileIfNotDoingItAlready(configFile.projectFilePath);

        return project;
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
                return;
            }

            // if not the active project
            if (!currentProject || !currentProject.projectFile || !currentProject.projectFile.projectFilePath) {
                return;
            }
            if (projectFilePath !== currentProject.projectFile.projectFilePath){
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
    export function getConfigFileFromDisk(filePath: string): tsconfig.TypeScriptConfigFileDetails {

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
}
