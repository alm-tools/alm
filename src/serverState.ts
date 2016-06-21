/**
 * Server static global state info (shared by client).
 */
export interface ServerState {
    update?: {
        latest: string;
        current: string;
        type: 'latest' | 'major' | 'minor' | 'patch' | 'prerelease' | 'build';
        name: string;
    },
    version: string
}
export let serverState: ServerState = {
    version: '0.0.0'
};
export function setServerState(state: ServerState) {
    serverState = state;
}

/**
 * Exposed on client
 * <script src="/serverState.js"></script>
 */
declare global {
    var serverState: ServerState;
}
import * as express from "express";
export function addRoute(app:express.Express){
    app.use('/serverState.js', (req,res) => res.send('window.serverState = ' + JSON.stringify(serverState)));
}
