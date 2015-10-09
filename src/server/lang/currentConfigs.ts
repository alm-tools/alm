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

interface ProjectJson {
    name?: string;
    /**
     * Full path to tsconfig.json (including file name)
     */
    tsconfig: string;
}

interface TsbJson {
    projects: ProjectJson[];
}

export const errors = {
    ReadErrorTsb: "Failed to read file tsb.json",
}

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

function getTsbPath() {
    return fsu.resolve(process.cwd(), "tsb.json");
}

export function getDefaultProject(): Promise<ProjectJson> {

    // if there is a tsb.json
    // use it!
    let found = readTsb();

    if (found.data && found.data.projects && found.data.projects[0]) {
        let first = found.data.projects[0];
        return Promise.resolve(found.data.projects[0]);
    }

    // otherwise :
    return flm.filePathsUpdated.current().then((list) => {
        // Detect some tsconfig.json
        // Return!
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
                name: 'auto',
                tsconfig
            };
        }

        // If no tsconfig.json ... Abort for now!
        throw new Error('No tsconfig.json found!');
    });
}

/**
 * The currently active project
 */
let currentProject: project.Project;
let currentProjectJson: ProjectJson;

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

/** Check if tsb.json did indeed change  */
function reloadTsb() {
    getDefaultProject().then((projectJson) => {
        if (equal(currentProjectJson, projectJson)) {
            return;
        }

        /// If you change tsb.json
        /// This is enough to justify a full sync
        sync(projectJson);
    });
}


import * as projectCache from "./projectCache";
/** All bets are off! */
function sync(projectJson: ProjectJson) {
    currentProject = projectCache.cacheAndCreateProject(projectCache.getProjectFileFromDisk(projectJson.tsconfig));
}
