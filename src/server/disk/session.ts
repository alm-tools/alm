/**
 * The session manages the state associated with a user connection
 * This allows us to restore tabs + userconfiguration etc.
 */

import * as flm from "../workers/fileListing/fileListingMaster";
import * as types from "../../common/types";

import * as json from "../../common/json";
import * as fsu from "../utils/fsu";
import * as utils from "../../common/utils";
import * as workingDir from "./workingDir";

const sessionFile = types.cacheDir + '/sessionV2.json'

/**
 * If there is no session then a default one will be created for you and sent over
 * // TODO: support process arguments for session or adding a file to a session
 */
export function getDefaultOrNewSession(): Promise<types.SessionOnDisk> {
    if (fsu.existsSync(sessionFile)) {
        let contents = json.parse<types.SessionOnDisk>(fsu.readFile(sessionFile));
        if (contents.data && contents.data.lastUsed) {
            return Promise.resolve(contents.data);
        }
    }

    // Create a new one
    let session: types.SessionOnDisk = {
        openTabs: [],
        lastUsed: new Date().getTime(),
    };

    return Promise.resolve(session);
}

function uiToDiskTab(uiTab: types.SessionTabInUI): types.SessionTabOnDisk {
    let relativeUrl = workingDir.makeRelativeUrl(uiTab.url);

    return {
        relativeUrl
    };
}

function diskTabToUITab(diskTab: types.SessionTabOnDisk): types.SessionTabInUI {
    let url = workingDir.makeAbsoluteUrl(diskTab.relativeUrl);
    return {
        url
    };
}

function writeDiskSession(session: types.SessionOnDisk){
    session.lastUsed = new Date().getTime();
    fsu.writeFile(sessionFile, json.stringify(session));
}

export function setTsconfigPath(tsconfigFilePath: string) {
    let session = getDefaultOrNewSession();
    session.then((ses)=>{
        ses.relativePathToTsconfig = workingDir.makeRelative(tsconfigFilePath);
        writeDiskSession(ses);
    });
}
export function setOpenUITabs(tabs: types.SessionTabInUI[]) {
    let session = getDefaultOrNewSession();
    session.then((ses)=>{
        ses.openTabs = tabs.map(uiToDiskTab);
        writeDiskSession(ses);
    });
}

export function getOpenUITabs() {
    let session = getDefaultOrNewSession();
    return session
        .then((ses) => {
            return { openTabs: ses.openTabs.map(diskTabToUITab) }
        });
}
