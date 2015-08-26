/**
 * This file will start working as soon as you import it
 * 
 * It will list out all the files into listings.txt
 * 
 * It will watch the file system for changes, and if there are any changes, 
 * it will list the files again, writing only at the end...and only if something changed
 */

import chokidar = require('chokidar');
import glob = require('glob');
import * as fsu from "../utils/fsu";
import * as constants from "../../common/constants";
import {EOL} from "os";

function processAllFiles() {
    let listing: string[] = [];
    function updateFileListing() {
        fsu.writeFile(constants.cacheDir + '/listing.txt',listing.join(EOL));
    }
    
    listing = glob.sync('**');
    updateFileListing();
}

// other research 
// https://github.com/coolaj86/node-walk
// https://github.com/isaacs/node-glob