#! /usr/bin/env node
import express = require("express");
import http = require('http');
import cookieParser = require('cookie-parser');

import {errorCodes, exit} from "./server/errorCodes";
import path = require('path');
import fs = require("fs");

let port = 3000;
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
import {register} from "./server/socketServer";
register(server);

// Start listening
server.listen(port, function(e) {
    if (e) {
        console.error(e);
        exit(errorCodes.couldNotListen);
    }
    console.log(`Dashboard at http://localhost:${port}`);
});

// import * as fslw from "./server/cache/fileListing/fileListingWorkerParent";
// fslw.processAllFiles({filePath:process.cwd()}).then((res)=>{
//     console.log(res);
// });