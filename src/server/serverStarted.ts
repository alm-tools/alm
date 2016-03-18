import * as flm from "./workers/fileListing/fileListingMaster";
import * as ap from "./workers/lang/activeProject";

export function started() {
    flm.start();
    ap.start();
}
