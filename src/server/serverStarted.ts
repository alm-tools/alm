import * as flm from "./workers/fileListing/fileListingMaster";
import * as ap from "./lang/activeProject";

export function started() {
    flm.start();
    ap.start();
}
