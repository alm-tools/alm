import * as flm from "./workers/fileListing/fileListingMaster";
import * as psm from "./workers/lang/projectServiceMaster";
import * as lm from "./workers/lint/lintMaster";
import * as tm from "./workers/tested/testedMaster";
import * as activeProjectConfig from "./disk/activeProjectConfig";
import * as watchEditorConfig from "./disk/watchEditorConfig";

export function started() {
    flm.start();
    psm.start();
    lm.start();
    tm.start();
    activeProjectConfig.start();
    watchEditorConfig.start();
}
