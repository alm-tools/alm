/**
 * This module is responsible for reading (with error reporting) the tsconfig.json
 * - It will emit the relevant information (configFile) for use by the project service if all good
 * - It will emit the errors in the configFile or ask to clear them if needed
 * - It will emit the available projects
 */

import {TypedEvent} from "../../common/events";
import * as utils from "../../common/utils";
import * as tsconfig from "../workers/lang/core/tsconfig";

/** Disk access / session stuff */
import * as session from "./session";
import * as wd from "./workingDir";
import * as fmc from "./fileModelCache";
import * as flm from "../workers/fileListing/fileListingMaster";
import * as workingDir from "./workingDir";
import * as fsu from "../utils/fsu";

/**
 * Global variables
 */
/** The active project name */
let activeProjectConfigDetails: ActiveProjectConfigDetails = null;
export let activeProjectConfigDetailsUpdated = new TypedEvent<ActiveProjectConfigDetails>();

/** Only if the file is valid will we end up here */
let configFile: tsconfig.TypeScriptConfigFileDetails = null;
export let configFileUpdated = new TypedEvent<tsconfig.TypeScriptConfigFileDetails>();
export let projectFilePathsUpdated = new TypedEvent<{ filePaths: string[] }>();

/**
 * Errors in tsconfig.json
 */
export const errorsInTsconfig = new TypedEvent<ErrorsByFilePath>();
function setErrorsInTsconfig(filePath:string, errors:CodeError[]){
    errorsInTsconfig.emit({[filePath]:errors});
}
function clearErrorsInTsconfig(filePath:string){
    errorsInTsconfig.emit({[filePath]:[]});
}

/** The name used if we don't find a project */
const implicitProjectName = "__auto__";

/**
 * on server start
 */
export function start() {
    // Keep session on disk in sync
    activeProjectConfigDetailsUpdated.on((ap)=>{
        if (ap.tsconfigFilePath) {
            session.setTsconfigPath(ap.tsconfigFilePath);
        }
    });

    // Helps us sync only once in the beginning
    let synced = false;

    // Resume session
    let ses = session.readDiskSessionsFile();
    if (ses.relativePathToTsconfig) {
        let tsconfig = workingDir.makeAbsolute(ses.relativePathToTsconfig);
        if (fsu.existsSync(tsconfig)) {
            activeProjectConfigDetails = Utils.tsconfigToActiveProjectConfigDetails(tsconfig);
            activeProjectConfigDetailsUpdated.emit(activeProjectConfigDetails);
            syncCore(activeProjectConfigDetails);
            synced = true;
        }
    }

    refreshAvailableProjects()
        .then(() => !synced && sync());
}

/** All the available projects */
export const availableProjects = new TypedEvent<ActiveProjectConfigDetails[]>();
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

    try {
        configFile = ConfigFile.getConfigFileFromDiskOrInMemory(projectConfig);
        configFileUpdated.emit(configFile);
        projectFilePathsUpdated.emit({ filePaths: configFile.project.files });

        // If we made it up to here ... means the config file was good :)
        if (!projectConfig.isImplicit) {
            clearErrorsInTsconfig(projectConfig.tsconfigFilePath);
        }

        // Set the active project (the project we get returned might not be the active project name)
        // e.g. on initial load
        if (activeProjectName !== projectConfig.name) {
            activeProjectConfigDetails = projectConfig;
            activeProjectConfigDetailsUpdated.emit(activeProjectConfigDetails);
        }
    }
    catch (ex) {
        // Ignore for now as `ConfigFile.getConfigFileFromDiskOrInMemory` already does the error reporting
    }
}



/**
 * Utility functions to convert a configFilePath into `configFile`
 */
import fs = require("fs");
import path = require("path");
namespace ConfigFile {
    const typescriptDirectory = path.dirname(require.resolve('ntypescript')).split('\\').join('/');

    /**
     * Project file error reporting
     */
    function reportProjectFileErrors(ex: Error, filePath: string) {
        var err: Error = ex;
        if (ex.message === tsconfig.errors.GET_PROJECT_JSON_PARSE_FAILED
            || ex.message === tsconfig.errors.GET_PROJECT_PROJECT_FILE_INVALID_OPTIONS
            || ex.message === tsconfig.errors.GET_PROJECT_GLOB_EXPAND_FAILED) {
            let details: tsconfig.ProjectFileErrorDetails = ex.details;
            setErrorsInTsconfig(filePath,[details.error]);
        }
        else {
            setErrorsInTsconfig(filePath, [utils.makeBlandError(filePath, `${ex.message}`)]);
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

        const filePath = config.tsconfigFilePath;

        try {
            // If we are asked to look at stuff in lib.d.ts create its own project
            if (path.dirname(filePath) == typescriptDirectory) {
                return tsconfig.getDefaultInMemoryProject(filePath);
            }

            const projectFile = tsconfig.getProjectSync(filePath);
            clearErrorsInTsconfig(projectFile.projectFilePath);
            return projectFile;
        } catch (ex) {
            if (ex.message === tsconfig.errors.GET_PROJECT_NO_PROJECT_FOUND) {
                // If we have a .d.ts file then it is its own project and return
                if (tsconfig.endsWith(filePath.toLowerCase(), '.d.ts')) {
                    return tsconfig.getDefaultInMemoryProject(filePath);
                }
                else {
                    setErrorsInTsconfig(filePath, [utils.makeBlandError(filePath, 'No project file found')]);
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

/**
 * As soon as we get a new file listing refresh available projects
 */
flm.filePathsUpdated.on(function(data) {
    refreshAvailableProjects();
});

/**
 * As soon as edit happens on the project file do a sync
 */
fmc.didEdit.on((evt) => {
    let currentConfigFilePath = activeProjectConfigDetails && activeProjectConfigDetails.tsconfigFilePath;
    if (evt.filePath == currentConfigFilePath){
        sync();
    }
});
