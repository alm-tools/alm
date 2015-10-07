/**
 * Reader for tsconfig.json
 */
import * as json from "../../../common/json";
import * as path from "path";

interface Project {
    name?: string;
    /**
     * Full path to tsconfig.json (including file name)
     */
    tsconfig?: string;
}

interface Parsed {
    projects: Project[];
}

export function getProjects(): Parsed {
    let expectedLocation = path.resolve(process.cwd(),"tsb.json");

    try {
        let parsed = json.parse<Parsed>(expectedLocation);
        return parsed.data;
    }
    catch(e){
        // TODO: Error reporting
    }
}
