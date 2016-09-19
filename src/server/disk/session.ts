/**
 * The session manages the state associated with a browser window connection.
 * This allows us to restore tabs + userconfiguration etc.
 * We just drive the session id from the browser url
 */

/** Imports */
import * as flm from "../workers/fileListing/fileListingMaster";
import * as types from "../../common/types";

import * as json from "../../common/json";
import * as fsu from "../utils/fsu";
import * as utils from "../../common/utils";
import * as workingDir from "./workingDir";
import * as commandLine from "../commandLine";
import * as tsconfig from "../workers/lang/core/tsconfig";

const sessionFile = types.cacheDir + '/sessionsV2.json'

/**
 * If there is no session then a default one will be created for you and sent over
 */
export function getDefaultOrNewSession(sessionId: string): types.SessionOnDisk {
    let sessions: types.SessionOnDisk[] = readDiskSessionsFile().sessions;
    /**
     * Cases to handle
     * if default select first (but if none create)
     * if duplicate then duplicate (but if none create and use that one)
     * if session id then search (but if none create)
     */
    // if none create
    const ifNoneCreate = (session: types.SessionOnDisk) => {
        if (!session){
            session = {
                id: utils.createId(),
                tabLayout: {
                    type: 'stack',
                    width: 100,
                    height: 100,
                    tabs: [],
                    subItems: [],
                    activeItemIndex: 0,
                },
                lastUsed: new Date().getTime(),
                selectedTabId: null,
            }
            writeDiskSession(session);
            return session;
        } else {
            return session;
        }
    }
    let session: types.SessionOnDisk;
    if (!sessionId || sessionId === types.urlHashNormal) {
        session = ifNoneCreate(sessions[0]);
    }
    else if (sessionId === types.urlHashNewSession) {
        session = sessions[0]; // last used is always on top
        if (session) {
            session = {
                id: utils.createId(),
                tabLayout: session.tabLayout,
                lastUsed: new Date().getTime(),
                selectedTabId: session.selectedTabId,
            }
            writeDiskSession(session);
        }
        else {
            session = ifNoneCreate(session);
        }
    }
    else {
        session = ifNoneCreate(sessions.find(session=>session.id === sessionId));
    }

    /**
     * Update the session on disk for future calls to be stable
     */
    let commandLineTabs = getCommandLineTabs();
    if (commandLineTabs.length) {
        // Utility to find first `stack` and just add to its tabs
        let done = false;
        const tryAddingToStack = (layout: types.TabLayoutOnDisk) => {
            if (done) return;
            if (layout.type === 'stack') {
                layout.tabs = layout.tabs.concat(commandLineTabs);
                done = true;
            }
            else {
                layout.subItems.forEach(tryAddingToStack)
            }
        }

        // Start at root
        tryAddingToStack(session.tabLayout);

        /** Write it out */
        writeDiskSession(session);
    }

    return session;
}

/**
 * Only returns the command line tabs once
 * Means you can call it as many times as you like
 */
function getCommandLineTabs(): types.TabInstanceOnDisk[] {
    /** Add any command line files to the session */
    let files = commandLine.getOptions().filePaths;
    let tabs = files
        .map((file) => utils.getUrlFromFilePathAndProtocol({ protocol: 'file', filePath: file }))
        .map((url) => workingDir.makeRelativeUrl(url))
        .map((relativeUrl) => ({ id: utils.createId(), relativeUrl, additionalData: null }));
    // clear for future
    // Doing it multiple times would mean that we would polute the user session on each new tab opening
    commandLine.getOptions().filePaths = [];
    return tabs;
}

/**
 * UI to disk and Disk to UI helpers
 */
function uiToDiskTab(uiTab: types.TabInstance): types.TabInstanceOnDisk {
    let relativeUrl = workingDir.makeRelativeUrl(uiTab.url);

    return {
        id: uiTab.id,
        relativeUrl,
        additionalData: uiTab.additionalData,
    };
}
function diskToUITab(diskTab: types.TabInstanceOnDisk): types.TabInstance {
    let url = workingDir.makeAbsoluteUrl(diskTab.relativeUrl);
    return {
        id: diskTab.id,
        url,
        additionalData: diskTab.additionalData,
    };
}
function uiToDiskTabLayout(uiLayout: types.TabLayout): types.TabLayoutOnDisk {
    return {
        type: uiLayout.type,
        width: uiLayout.width,
        height: uiLayout.height,
        tabs: uiLayout.tabs.map(uiToDiskTab),
        subItems: uiLayout.subItems.map(uiToDiskTabLayout),
        activeItemIndex: uiLayout.activeItemIndex,
    }
}
function diskToUITabLayout(diskLayout: types.TabLayoutOnDisk): types.TabLayout {
    return {
        type: diskLayout.type,
        width: diskLayout.width,
        height: diskLayout.height,
        tabs: diskLayout.tabs.map(diskToUITab),
        subItems: diskLayout.subItems.map(diskToUITabLayout),
        activeItemIndex: diskLayout.activeItemIndex,
    }
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
        './lib',
        './App-UI/src'
    ].map(x => x + '/tsconfig.json');
    if (commandLine.getOptions().init) {
        sessionFileContents.relativePathToTsconfig = './tsconfig.json';
        // Write the tsconfig.json file
        tsconfig.createProjectRootSync(workingDir.getProjectRoot());
        writeDiskSessionFile(sessionFileContents);
        // Clear so we don't keep creating
        commandLine.getOptions().init = false;
    }
    else if (commandLine.getOptions().project) {
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
    sessions.unshift(session); // last used is always on top
    sessionFileContents.sessions = sessions;

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
export function setOpenUITabs(sessionId: string, layout: types.TabLayout, selectedTabId: string|null) {
    let session = getDefaultOrNewSession(sessionId);
    session.tabLayout = uiToDiskTabLayout(layout);
    session.selectedTabId = selectedTabId;
    writeDiskSession(session);
}
export function getOpenUITabs(sessionId: string) {
    let session = getDefaultOrNewSession(sessionId);
    return { tabLayout: diskToUITabLayout(session.tabLayout), selectedTabId: session.selectedTabId }
}

export function getValidSessionId(sessionId: string) {
    let session = getDefaultOrNewSession(sessionId);
    return { sessionId: session.id }
}

/**
 * For various simple settings
 * setter
 */
export function setSetting(config: { sessionId: string, settingId: string, value: any }) {
    let session = getDefaultOrNewSession(config.sessionId);
    session[config.settingId] = config.value;
    writeDiskSession(session);
}

/**
 * For various simple settings
 * getter
 */
export function getSetting(config: { sessionId: string, settingId: string }): any {
    let session = getDefaultOrNewSession(config.sessionId);
    return session[config.settingId];
}
