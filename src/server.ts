/**
 * The location of this file is important as its our main backend entry point
 * It is used by:
 * - our `bin/alm`
 * - extenal users invoking `node <this file>`
 * So don't move it :)
 */

/**
 * Load up TypeScript
 */
import * as byots  from "byots";
const ensureImport = byots;

/** Other imports */
import express = require("express");
import http = require('http');
import https = require('https');
import cookieParser = require('cookie-parser');

import {errorCodes, exit} from "./server/errorCodes";
import path = require('path');
import fs = require("fs");
import open = require('open');
import serverStarted = require('./server/serverStarted');
import {TypedEvent} from "./common/events";
import cl = require('./server/commandLine');
import workingDir = require('./server/disk/workingDir');
import * as session from "./server/disk/session";
import * as chalk from "chalk";
import * as utils from "./common/utils";
import * as fsu from "./server/utils/fsu";
import { liveDemoFolder } from './server/workers/external/demoReact/bundler/bundlerMaster';
import * as types from './common/types';

// `Where` to statically serve `what`
const staticServing = {
    '': path.resolve(__dirname, 'public'),
    // Monaco works best with its own loader,
    // We will serve it up from node_modules
    '/vs':  utils.getDirectory(fsu.consistentPath(require.resolve('monaco/build/vs/loader'))),
    // Note:
    // - the names of these modules come from the `define` call in the `contribution` file ;)
    // - the path is ofcourse to the contribution file.
    '/vs/language/css': utils.getDirectory(fsu.consistentPath(require.resolve('monaco-css/release/min/monaco.contribution'))),
    '/vs/basic-languages/src': utils.getDirectory(fsu.consistentPath(require.resolve('monaco-languages/release/src/monaco.contribution'))),

    /**
     * Live demo
     */
    [types.liveDemoMountUrl]: liveDemoFolder,
}

/**
 * To use official monaco:
 * npm install monaco-editor-core --save-dev
 */
// monacoSourceDir = fsu.travelUpTheDirectoryTreeTillYouFind(__dirname, 'node_modules') + '/monaco-editor-core/dev/vs'; // DEBUG

const clOptions = cl.getOptions();
/** If the cl options favor early exit (e.g. -i) do that */
if (clOptions.init) {
    session.readDiskSessionsFile();
    console.log('[TSCONFIG] Initialized');
    process.exit(0);
}
/** Build server */
if (clOptions.build) {
    const sessionFileContents = session.readDiskSessionsFile();
    const tsconfig = sessionFileContents.relativePathToTsconfig;
    const {doBuild} = require('./build');
    const doBuildTyped: {(tsconfigFilePath:string):void} = doBuild;
    doBuildTyped(tsconfig);
}

/** Enable HTTPS if all options are passed in */
const useHttps = clOptions.httpskey && clOptions.httpscert;

// Create express app and http|https server
const app = express();
const server = useHttps
    ? https.createServer({ key: fs.readFileSync(clOptions.httpskey), cert: fs.readFileSync(clOptions.httpscert) }, app)
    : http.createServer(app);

// Basic auth
if (clOptions.auth) {
    const basicAuth = require('basic-auth-connect');
    const [user,pass] = clOptions.auth.split(':');
    app.use(basicAuth(user, pass));
}

// Everything uses cookies
app.use(cookieParser());

// Optionally setup a dev time server
import {setup} from './server/devtime';
setup(app);

// After dev setup forward to static server
Object.keys(staticServing).map(where => {
    const what = staticServing[where];
    if (where) {
        app.use(where, express.static(what, {}));
    }
    else {
        app.use(express.static(what, {}));
    }
});

// Setup a socket server
import {register} from "./socket/socketServer";
register(server);

/** Register an image server */
import {registerImgServerWithExpress} from "./server/imgServer";
registerImgServerWithExpress(app);

/**
 * Emitted once the server starts listening
 */
export const listeningAtUrl = new TypedEvent<{url:string}>();

// Start listening
import {getPort} from './server/utils/getPort';
getPort(clOptions.port).then((port) => {
    /** If the user *did* specify a port and we end up not using it */
    if (clOptions.port !== cl.defaultPort
        && port !== clOptions.port) {
        console.log(chalk.magenta(`[WEB] WARNING: Desired port is not available so using port ${port}`));
    }
    // Also setup in clOptions for future use.
    clOptions.port = port;

    server.listen(port, clOptions.host, function(err) {
        if (err) {
            console.error(err);
            exit(errorCodes.couldNotListen);
        }
        const host = clOptions.host in {'localhost':true,'127.0.0.1':true,'0.0.0.0': true} ? 'localhost' : clOptions.host;
        const url = `http://${host}:${port}`;
        if (clOptions.open) {
            open(url);
        }
        console.log(`DASHBOARD:`, (clOptions.open) ? "(launched in browser)" : chalk.magenta("(Please open in chrome)"), chalk.green(url));
        listeningAtUrl.emit({ url });
        serverStarted.started();
    });
});

/**
 * Notify user of updates
 */
import * as serverState from "./serverState";
serverState.addRoute(app);
/** Does not exist when we run from `./node_modules/alm_src` */
if (fs.existsSync(__dirname + '/../package.json')) {
    const pkg = require('../package.json');
    const version = pkg.version;
    const typescriptVersion = pkg.dependencies.typescript;
    console.log(`Version: ${version}, TypeScript version: ${typescriptVersion}`)
    serverState.setServerState({ version, typescriptVersion });
    const notifier = require('update-notifier')({
      pkg,
      // updateCheckInterval: 0 // DEBUG
    });
    notifier.notify({
        defer: false
    });
    if (notifier.update) {
        const update: {
            latest: string;
            current: string;
            type: 'latest' | 'major' | 'minor' | 'patch' | 'prerelease' | 'build';
            name: string;
        } = notifier.update;
        serverState.setServerState({ update, version, typescriptVersion });
    }
}
