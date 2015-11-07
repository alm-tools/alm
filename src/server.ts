#! /usr/bin/env node
import express = require("express");
import http = require('http');
import cookieParser = require('cookie-parser');

import {errorCodes, exit} from "./server/errorCodes";
import path = require('path');
import fs = require("fs");
import open = require('open');
import serverStarted = require('./server/serverStarted');
import cl = require('./server/commandLine');
import workingDir = require('./server/disk/workingDir');

var publicPath = path.resolve(__dirname, 'public');

// Create express app and http server
var app = express();
let server = http.createServer(app);

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
let clOptions = cl.getOptions();
workingDir.setProjectRoot(clOptions.dir);
var portfinder = require('portfinder');
portfinder.basePort = clOptions.port;
portfinder.getPort(function (err, port) {
    if (err) {
        console.error(err);
        exit(errorCodes.couldNotListen);
    }
    server.listen(port, function(err) {
        if (err) {
            console.error(err);
            exit(errorCodes.couldNotListen);
        }
        console.log(`Dashboard at http://localhost:${port}`);
        if (clOptions.open) {
            open(`http://localhost:${port}`);
        }
        serverStarted.started();
    });
});

/**
 * Notify user of updates
 */
var pkg = require('../package.json');
require('update-notifier')({
  pkg,
}).notify();
