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
import * as constants from "../../common/constants";

const sessionFile = types.cacheDir + '/sessionsV1.json'

/**
 * Only If there is a session file :)
 */
export function getRelativePathToTsconfig(): string {
    return
}

/**
 * If there is no session then a default one will be created for you and sent over
 */
export function getDefaultOrNewSession(sessionId: string): types.SessionOnDisk {
    let sessions: types.SessionOnDisk[] = readDiskSessionsFile().sessions;
    if (sessions.length && sessionId === constants.urlHashNewSession) {
        const session: types.SessionOnDisk = {
            id: utils.createId(),
            openTabs: sessions[0].openTabs,
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

export function readDiskSessionsFile() {
    let sessionFileContents: types.SessionsFileContents = {
        sessions: []
    };
    if (fsu.existsSync(sessionFile) && !commandLine.getOptions().safe) {
        let contents = json.parse<types.SessionsFileContents>(fsu.readFile(sessionFile));
        if (contents.data) {
            sessionFileContents = contents.data;
        }
    }

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
        sessionFileContents.relativePathToTsconfig = workingDir.makeRelative(commandLine.getOptions().project);
        writeDiskSessionFile(sessionFileContents);
    } else if (!sessionFileContents.relativePathToTsconfig) {
        let found = commonTsconfigLocations.find(cl => fsu.existsSync(cl));
        if (found) {
            sessionFileContents.relativePathToTsconfig = found;
            writeDiskSessionFile(sessionFileContents);
        }
    }

    return sessionFileContents;
}

function writeDiskSession(session: types.SessionOnDisk) {
    // Update last used time
    session.lastUsed = new Date().getTime();

    const sessionFileContents = readDiskSessionsFile();

    // Merge with what is on disk by id
    const sessions = sessionFileContents.sessions
        .filter(sesh => sesh.id !== session.id);
    sessions.unshift(session);

    writeDiskSessionFile(sessionFileContents);
}

function writeDiskSessionFile(sessionFileContents: types.SessionsFileContents){
    fsu.writeFile(sessionFile, json.stringify(sessionFileContents));
}

export function setTsconfigPath(tsconfigFilePath: string) {
    let sessionFileContents = readDiskSessionsFile();
    sessionFileContents.relativePathToTsconfig = workingDir.makeRelative(tsconfigFilePath);
    writeDiskSessionFile(sessionFileContents);
}
export function setOpenUITabs(sessionId: string, tabs: types.SessionTabInUI[]) {
    let session = getDefaultOrNewSession(sessionId);
    session.openTabs = tabs.map(uiToDiskTab);
    writeDiskSession(session);
}

export function getOpenUITabs(sessionId: string) {
    let session = getDefaultOrNewSession(sessionId);
    return { openTabs: session.openTabs.map(diskTabToUITab) }
}
