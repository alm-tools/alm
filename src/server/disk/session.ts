/**
 * The session manages the state associated with a user connection
 * This allows us to restore tabs + userconfiguration etc.
 */

import * as flm from "../workers/fileListing/fileListingMaster";
import * as types from "../../common/types";

import * as json from "../../common/json";
import * as fsu from "../utils/fsu";
import * as utils from "../../common/utils";

const sessionFile = types.cacheDir + '/sessionsV1.json'

/**
 * If there is no session then a default one will be created for you and sent over
 * // TODO: support process arguments for session or adding a file to a session
 */
export function getDefaultOrNewSession(): Promise<types.SessionOnDisk> {
    if (fsu.existsSync(sessionFile)) {
        let contents = json.parse<types.SessionsOnDisk>(fsu.readFile(sessionFile));
        if (contents.data && contents.data.sessions && contents.data.sessions.length) {
            let newestFirst = contents.data.sessions.sort((s1, s2) => s1.lastUsed - s2.lastUsed);
            return Promise.resolve(newestFirst[0]);
        }
    }

    // Create a new one
    let session: types.SessionOnDisk = {
        sessionId: utils.createId(),
        openTabs: [],
        lastUsed: new Date().getTime(),
    };

    return Promise.resolve(session);
}

export function storeSession(session: types.SessionInUI) {
    let uiToDiskTab = (uiTab: types.SessionTabInUI): types.SessionTabOnDisk => {
        // TODO:
        let url = uiTab.url;

        return null;
    }

    let diskSession: types.SessionOnDisk = {
        sessionId: session.sessionId,
        openTabs: session.openTabs.map(uiToDiskTab),
        lastUsed: new Date().getTime(),
    }

    // TODO: write to disk
}
