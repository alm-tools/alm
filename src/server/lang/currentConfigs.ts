/**
 * Reader for tsconfig.json
 */
import * as json from "../../common/json";
import * as path from "path";
import * as fsu from "../utils/fsu";
import * as flm from "../workers/fileListing/fileListingMaster";
import * as wd from "../disk/workingDir";

import simpleValidator = require('./core/simpleValidator');
var types = simpleValidator.types;

interface Project {
    name?: string;
    /**
     * Full path to tsconfig.json (including file name)
     */
    tsconfig: string;
}

interface Parsed {
    projects: Project[];
}

export const errors = {
    ReadErrorTsb: "Failed to read file tsb.json",
}

function readTsb(): json.ParsedData<Parsed> {
    let expectedLocation = path.resolve(process.cwd(), "tsb.json");

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

    let parsed = json.parse<Parsed>(contents);
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


export function getDefaultProject(): Promise<Project> {

    // if there is a tsb.json
    // use it!
    let found = readTsb();

    if (found.data && found.data.projects && found.data.projects[0]) {
        let first = found.data.projects[0];

        return Promise.resolve(found.data.projects[0]);
    }

    // otherwise :
    return flm.filePathsUpdated.current().then((list)=>{
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
                name:'auto',
                tsconfig
            };
        }

        // If no tsconfig.json ... Abort for now!
        throw new Error('No tsconfig.json found!');
    });
}
