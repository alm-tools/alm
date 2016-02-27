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

const sessionFile = types.cacheDir + '/sessionsV1.json'

/**
 * If there is no session then a default one will be created for you and sent over
 */
export function getDefaultOrNewSession(duplicate = false): types.SessionOnDisk {
    let sessions: types.SessionOnDisk[] = readDiskSessions();
    if (sessions.length && duplicate) {
        const session: types.SessionOnDisk = {
            id: utils.createId(),
            openTabs: sessions[0].openTabs,
            relativePathToTsconfig: sessions[0].relativePathToTsconfig,
            lastUsed: new Date().getTime(),
        };
        writeDiskSession(session);
        sessions.unshift(session);
    }
    if (!sessions.length) { // Create a new one
        sessions = [
            {
                id: utils.createId(),
                openTabs: [],
                lastUsed: new Date().getTime(),
            }
        ]
    }

    const session = sessions[0];

    /**
     * Active project setup logic. In decreasing order
     * - If there is an active project in the command line
     * - If there is an active project in the last session
     * - Common locations
     */
    let commonTsconfigLocations = [
        '.',
        './src',
        './ts',
        './App-UI/src'
    ].map(x => x + '/tsconfig.json');
    if (commandLine.getOptions().project) {
        session.relativePathToTsconfig = workingDir.makeRelative(commandLine.getOptions().project);
    } else if (!session.relativePathToTsconfig) {
        let found = commonTsconfigLocations.find(cl => fsu.existsSync(cl));
        if (found) {
            session.relativePathToTsconfig = found;
        }
    }

    /**
     * Update the session on disk for future calls to be stable
     */
    let commandLineTabs = getCommandLineTabs();
    if (commandLineTabs.length) {
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

function readDiskSessions() {
    let sessions: types.SessionOnDisk[] = [];
    if (fsu.existsSync(sessionFile) && !commandLine.getOptions().safe) {
        let contents = json.parse<types.SessionsFileContents>(fsu.readFile(sessionFile));
        if (contents.data && contents.data.sessions && contents.data.sessions.length) {
            sessions = contents.data.sessions;
        }
    }
    return sessions;
}

function writeDiskSession(session: types.SessionOnDisk) {
    // Update last used time
    session.lastUsed = new Date().getTime();

    // Merge with what is on disk by id
    const sessions = readDiskSessions()
        .filter(sesh => sesh.id !== session.id);
    sessions.unshift(session);

    fsu.writeFile(sessionFile, json.stringify({ sessions: sessions }));
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

export function getOpenUITabs(duplicate?: boolean) {
    let session = getDefaultOrNewSession(duplicate);
    return { openTabs: session.openTabs.map(diskTabToUITab) }
}
