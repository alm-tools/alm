import * as flm from "./workers/fileListing/fileListingMaster";
import * as psm from "./workers/lang/projectServiceMaster";

export function started() {
    flm.start();
    psm.start();
}
