import * as flm from "./workers/fileListing/fileListingMaster";
import * as psm from "./workers/lang/projectServiceMaster";
import * as activeProjectConfig from "./disk/activeProjectConfig";

export function started() {
    flm.start();
    psm.start();
    activeProjectConfig.start();
}
