/**
 * This module is responsible for reading (with error reporting) the tsconfig.json
 *
 * - It will emit the relevant information (configFile) for use by the project service if all good
 * - It will emit the errors in the configFile or ask to clear them if needed
 * - It will emit the available projects
 *
 * Note: When the app starts the active project is determined by `session.ts`
 */

import {TypedEvent} from "../../common/events";
import * as utils from "../../common/utils";
import * as tsconfig from "../workers/lang/core/tsconfig";
import * as types from "../../common/types";
import {AvailableProjectConfig} from "../../common/types";
import multimatch = require("multimatch");

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
let activeProjectConfigDetails: AvailableProjectConfig = null;
export let activeProjectConfigDetailsUpdated = new TypedEvent<AvailableProjectConfig>();

/** Only if the file is valid will we end up here */
let configFile: types.TypeScriptConfigFileDetails = null;
export let configFileUpdated = new TypedEvent<types.TypeScriptConfigFileDetails>();
export let projectFilePathsUpdated = new TypedEvent<{ filePaths: string[] }>();

/**
 * Errors in tsconfig.json
 */
import {ErrorsCache} from "../utils/errorsCache";
export const errorsInTsconfig = new ErrorsCache();
function setErrorsInTsconfig(filePath:string, errors:CodeError[]){
    console.log('TSCONFIG: Error', errors[0].message);
    errorsInTsconfig.setErrorsByFilePaths([filePath], errors);
}
function clearErrorsInTsconfig(filePath:string){
    console.log('TSCONFIG: All Good!', filePath);
    errorsInTsconfig.clearErrors();
}

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
            // Needs to be set so that we watch it even in case of errors
            activeProjectConfigDetails = Utils.tsconfigToActiveProjectConfigDetails(tsconfig);
            // Try and sync with these details
            syncCore(activeProjectConfigDetails);
            synced = true;
        }
    }

    refreshAvailableProjects()
        .then(() => !synced && sync());
}

/** All the available projects */
export const availableProjects = new TypedEvent<AvailableProjectConfig[]>();
function refreshAvailableProjects() {
    return flm.filePathsCompleted.current().then((list) => {
        // Detect some tsconfig.json
        let tsconfigs = list.filePaths.map(t=> t.filePath).filter(t=> t.endsWith('tsconfig.json'));
        // sort by shortest length first (with extra big weight for node_modules):
        let weightConfig = (config: string) => config.includes('node_modules') ? config.length + 100 : config.length;
        tsconfigs = tsconfigs.sort(function(a, b) {
            return weightConfig(a) - weightConfig(b);
        });

        let projectConfigs: AvailableProjectConfig[] = tsconfigs.map(Utils.tsconfigToActiveProjectConfigDetails);

        availableProjects.emit(projectConfigs);
    });
}

/** General purpose utility functions specific to this file */
namespace Utils {
    /**
     * Used to
     * - convert a filePath found in directory indexing into a project that is selectable
     * - thaw last session active project filePath
     */
    export function tsconfigToActiveProjectConfigDetails(filePath: string): AvailableProjectConfig {
        let relative = workingDir.makeRelative(filePath);
        let isNodeModule = relative.includes('node_modules');
        const isVirtual = utils.isJsOrTs(filePath) ? true : false;
        return {
            name: isNodeModule ? relative : utils.getDirectoryAndFileName(filePath),
            isVirtual,
            tsconfigFilePath: filePath
        };
    }
}

/** convert project name to current project */
export function sync() {
    availableProjects.current().then((projectConfigs) => {
        let activeProjectName = (activeProjectConfigDetails && activeProjectConfigDetails.tsconfigFilePath);
        let projectConfig = projectConfigs.find(x=>x.tsconfigFilePath == activeProjectName);
        if (!projectConfig) {
            console.log('[TSCONFIG]: No active project')
            return;
        }
        syncCore(projectConfig);
    });
}

/** ensures that the `projectConfig` can actually be parsed. If so propogates the set event. */
export function syncCore(projectConfig:AvailableProjectConfig){
    let activeProjectName = (activeProjectConfigDetails && activeProjectConfigDetails.name);
    configFile = ConfigFile.getConfigFileFromDiskOrInMemory(projectConfig);

    // In case of error we exit as `ConfigFile.getConfigFileFromDiskOrInMemory` already does the error reporting
    if (!configFile) return;

    configFileUpdated.emit(configFile);
    projectFilePathsUpdated.emit({ filePaths: configFile.project.files });

    // Set the active project (the project we get returned might not be the active project name)
    activeProjectConfigDetails = projectConfig;
    activeProjectConfigDetailsUpdated.emit(activeProjectConfigDetails);
}

const syncDebounced = utils.debounce(sync, 1000);

/**
 * Files changing on disk
 */
export function fileListingDelta(delta: types.FileListingDelta) {
    // Check if we have a current project
    // If we have a current project does it have a `filesGlob`
    // If so check if some files need to be *removed* or *added*
    if (!configFile) return;
    if (!configFile.project.toExpand) return;

    const projectDir = configFile.projectFileDirectory;
    let toExpand = configFile.project.toExpand;

    // HEURISTIC : if some delta file path is *under* the `tsconfig.json` path
    if (
        delta.addedFilePaths.some(({filePath}) => filePath.startsWith(projectDir))
        || delta.removedFilePaths.some(({filePath}) => filePath.startsWith(projectDir))
    ) {
        /**
         * Does something match the glob
         */
        const fullPaths = delta.addedFilePaths.concat(delta.removedFilePaths).map(c=>c.filePath);

        /** Mutlimatch eccentricity */
        //multimatch(['test/foo.ts.ts'],['**/*.ts']) OKAY
        //multimatch(['/test/foo.ts.ts'],['**/*.ts']) OKAY
        //multimatch(['./test/foo.ts.ts'],['**/*.ts']) NOT OKAY
        //multimatch(['test/foo.ts.ts'],['./**/*.ts']) NOT OKAY
        // So remove . and .. from both paths and toExpand

        toExpand = toExpand.map(t => t.replace(/^\.|(\.\.)/, ''));

        const makeRelativeForMultiMatch =
            (path:string) =>
                fsu.makeRelativePath(projectDir,path)
                    .replace(/^\.|(\.\.)/, '');

        const relativePaths = fullPaths.map(makeRelativeForMultiMatch);
        const matched = !!multimatch(relativePaths,toExpand).length;

        if (matched) {
            syncDebounced()
        }
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
     * This explicilty loads the project from the filesystem to check it for errors
     * For Virtual projects it just returns the in memory project
     */
    export function getConfigFileFromDiskOrInMemory(config: AvailableProjectConfig): types.TypeScriptConfigFileDetails {
        if (config.isVirtual) {
            return tsconfig.getDefaultInMemoryProject(config.tsconfigFilePath);
        }

        const filePath = config.tsconfigFilePath;

        const {result:projectFile, error} = tsconfig.getProjectSync(filePath);
        if (!error){
            clearErrorsInTsconfig(projectFile.projectFilePath);
            return projectFile;
        }
        else {
            setErrorsInTsconfig(filePath, [error]);
            return undefined;
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
function checkProjectFileChanges(evt: { filePath: string }) {
    let currentConfigFilePath = activeProjectConfigDetails && activeProjectConfigDetails.tsconfigFilePath;
    if (evt.filePath == currentConfigFilePath) {
        sync();
    }
}
const checkProjectFileChangesDebounced = utils.debounce(checkProjectFileChanges, 1000);
fmc.didEdits.on(checkProjectFileChangesDebounced);
fmc.savedFileChangedOnDisk.on(checkProjectFileChangesDebounced);
