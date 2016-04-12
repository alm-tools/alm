import * as flm from "./workers/fileListing/fileListingMaster";
import * as psm from "./workers/lang/projectServiceMaster";
import * as activeProjectConfig from "./disk/activeProjectConfig";
import * as watchEditorConfig from "./disk/watchEditorConfig";

export function started() {
    flm.start();
    psm.start();
    activeProjectConfig.start();
    watchEditorConfig.start();
}
