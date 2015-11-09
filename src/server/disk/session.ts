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
import * as commandLine from "../commandLine";

const sessionFile = types.cacheDir + '/sessionV2.json'

/**
 * If there is no session then a default one will be created for you and sent over
 */
export function getDefaultOrNewSession(): types.SessionOnDisk {
    let session: types.SessionOnDisk = null;
    let commandLineTabs = getCommandLineTabs();

    if (fsu.existsSync(sessionFile)) {
        let contents = json.parse<types.SessionOnDisk>(fsu.readFile(sessionFile));
        if (contents.data && contents.data.lastUsed) {
            session = contents.data;
        }
    }

    if (!session) { // Create a new one
        session = {
            openTabs: [],
            lastUsed: new Date().getTime(),
        };
    }

    // Update the session on disk for future calls to be stable
    if (commandLineTabs) {
        session.openTabs = session.openTabs.concat(commandLineTabs);
        writeDiskSession(session);
    }

    return session;
}

/**
 * Only returns the command line tabs once
 * Means you can call it as many times as you like
 */
function getCommandLineTabs(): types.SessionTabOnDisk[] {
    /** Add any command line files to the session */
    let files = commandLine.getOptions().filePaths;
    let tabs = files
        .map((file) => utils.getUrlFromFilePathAndProtocol({ protocol: 'file', filePath: file }))
        .map((url) => workingDir.makeRelativeUrl(url))
        .map((relativeUrl) => ({ relativeUrl }));
    // clear for future
    // Doing it multiple times would mean that we would polute the user session on each new tab opening
    commandLine.getOptions().filePaths = [];
    return tabs;
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

function writeDiskSession(session: types.SessionOnDisk) {
    session.lastUsed = new Date().getTime();
    fsu.writeFile(sessionFile, json.stringify(session));
}

export function setTsconfigPath(tsconfigFilePath: string) {
    let session = getDefaultOrNewSession();
    session.relativePathToTsconfig = workingDir.makeRelative(tsconfigFilePath);
    writeDiskSession(session);
}
export function setOpenUITabs(tabs: types.SessionTabInUI[]) {
    let session = getDefaultOrNewSession();
    session.openTabs = tabs.map(uiToDiskTab);
    writeDiskSession(session);
}

export function getOpenUITabs() {
    let session = getDefaultOrNewSession();
    return { openTabs: session.openTabs.map(diskTabToUITab) }
}
