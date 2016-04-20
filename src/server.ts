import express = require("express");
import http = require('http');
import https = require('https');
import cookieParser = require('cookie-parser');

import {errorCodes, exit} from "./server/errorCodes";
import path = require('path');
import fs = require("fs");
import open = require('open');
import serverStarted = require('./server/serverStarted');
import cl = require('./server/commandLine');
import workingDir = require('./server/disk/workingDir');
import * as session from "./server/disk/session";
import * as chalk from "chalk";

const publicPath = path.resolve(__dirname, 'public');

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
    ? https.createServer({ key: clOptions.httpskey, cert: clOptions.httpscert }, app)
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
app.use(express.static(publicPath, {}));

// Setup a socket server
import {register} from "./socket/socketServer";
register(server);

// Start listening
const portfinder = require('portfinder');
portfinder.basePort = clOptions.port;
portfinder.getPort(function (err, port) {
    if (err) {
        console.error(err);
        exit(errorCodes.couldNotListen);
    }
    /** If the user *did* specify a port and we end up not using it */
    if (clOptions.port !== cl.defaultPort
        && port !== clOptions.port) {
        console.log(chalk.magenta(`[WEB] WARNING: Desired port is not available so using port ${port}`));
    }
    server.listen(port, clOptions.host, function(err) {
        if (err) {
            console.error(err);
            exit(errorCodes.couldNotListen);
        }
        const host = clOptions.host in {'localhost':true,'127.0.0.1':true,'0.0.0.0': true} ? 'localhost' : clOptions.host
        console.log(`DASHBOARD:`, chalk.green(`http://${host}:${port}`));
        if (clOptions.open) {
            open(`http://${host}:${port}`);
        }
        serverStarted.started();
    });
});

/**
 * Notify user of updates
 */
const pkg = require('../package.json');
require('update-notifier')({
  pkg,
}).notify();
