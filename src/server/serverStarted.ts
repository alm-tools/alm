import * as flm from "./workers/fileListing/fileListingMaster";
import * as ps from "./lang/projectService";
import * as cc from "./lang/currentConfigs";

export function started() {
    flm.start();
    ps.start();

    cc.startWatchingIfNotDoingAlready();
}
