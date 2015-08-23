#! /usr/bin/env node
import express = require("express");
import cookieParser = require('cookie-parser');

import {errorCodes, exit} from "./server/errorCodes";
import path = require('path');
import fs = require("fs");

let port = 3000;
var publicPath = path.resolve(__dirname, 'public');

var app = express();

// Everything uses cookies
app.use(cookieParser());

// Optionally setup a dev time server
import {setup} from './server/devtime';
setup(app);

// After dev setup forward to static server
app.use(express.static(publicPath, {}));

var server = app.listen(port, function(e) {
    if (e) {
        console.error(e);
        exit(errorCodes.couldNotListen);
    }
    console.log(`Dashboard at http://localhost:${port}`);
});
