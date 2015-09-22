import * as flm from "./workers/fileListing/fileListingMaster";
import * as ps from "./lang/projectService";

export function started() {
    flm.start();
    ps.start();
}