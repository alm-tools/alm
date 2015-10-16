import * as flm from "./workers/fileListing/fileListingMaster";
import * as ps from "./lang/projectService";
import * as ap from "./lang/activeProject";

export function started() {
    flm.start();
    ps.start();

    ap.startWatchingIfNotDoingAlready();
}
