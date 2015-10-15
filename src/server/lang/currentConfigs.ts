/**
 * Reader for tsconfig.json
 */
import * as json from "../../common/json";
import * as fsu from "../utils/fsu";
import * as flm from "../workers/fileListing/fileListingMaster";
import * as wd from "../disk/workingDir";
import * as fmc from "../disk/fileModelCache";
import * as tsconfig from "./core/tsconfig";
import * as project from "./core/project";

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
export function setActiveProjectName(name:string){
    activeProjectName = name;
    reloadTsb();
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

export function getDefaultProject(): Promise<ProjectJson> {

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
let currentProject: project.Project;

/**
 * As soon as we get a new file listing ... check if tsb.json is there. If it is start watching / parsing it
 */
flm.filePathsUpdated.on(function(data) {
    let expectedLocation = getTsbPath();

    if (fsu.existsSync(expectedLocation) && !fmc.isFileOpen(expectedLocation)) {
        let tsbFile = fmc.getOpenFile(expectedLocation);
        tsbFile.onSavedFileChangedOnDisk.on(() => {
            reloadTsb();
        });
    }
});

import * as projectCache from "./projectCache";

/** convert active tsb project name to current project */
function reloadTsb() {
    getDefaultProject().then((projectJson) => {
        /// If you change tsb.json
        /// This is enough to justify a full sync
        let projectFileDetails = projectCache.getProjectFileFromDisk(projectJson.tsconfig)
        currentProject = projectCache.cacheAndCreateProject(projectFileDetails);
    });
}


import {cast} from "../../socket/socketServer";
import {setErrorsForFilePath} from "./errorsCache";
import {TypedEvent} from "../../common/events";
export let currentTsbContents = new TypedEvent<TsbJson>();
/**
 * As soon as the server boots up we need to start watching tsb for details
 * and report any errors ... or provide the project details
 * TODO: if file doesn't exist on disk we are screwed
 */
export function start() {
    // Load up the tsb
    reloadTsb();

    // Start watching / reporting tsb + its errors
    let expectedLocation = getTsbPath();
    let file = fmc.getOrCreateOpenFile(expectedLocation);
    file.onSavedFileChangedOnDisk.on((evt) => {
        let contents = evt.contents;
        parseAndCastTsb(contents);
    });
    parseAndCastTsb(file.getContents());

    /**
      * If there are any errors we do not cast the bad project list
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
    }

    function reportTsbErrors(errors: string[]) {
        setErrorsForFilePath({
            filePath: expectedLocation,
            errors: errors
        });
    }
}
