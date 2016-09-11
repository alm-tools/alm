/**
 * Wraps fs and path into a nice "consistentPath" API
 */

/** we work with "/" for all paths (so does the typescript language service) */
export function consistentPath(filePath: string): string {
    return filePath.split('\\').join('/');
}

import * as path from "path";
import * as fs from "fs";
import mkdirp = require('mkdirp');
import * as rimraf from "rimraf";

/**
 * Resolves to to an absolute path.
 * @param from,to,to,to...
 */
export function resolve(...args: string[]) {
    return consistentPath(path.resolve(...args));
}

/**
 * Could be called ends with :)
 */
export function isExt(path: string, ext: string): boolean {
    return path && ext && path.indexOf(ext, path.length - ext.length) !== -1;
}

/**
 * Converts "C:\boo" , "C:\boo\foo.ts" => "./foo.ts"; Works on unix as well.
 */
export function makeRelativePath(relativeFolder: string, filePath: string) {
    var relativePath = path.relative(relativeFolder, filePath).split('\\').join('/');
    if (relativePath[0] !== '.') {
        relativePath = './' + relativePath;
    }
    return relativePath;
}

export function removeExt(filePath: string) {
    const lastIndex = filePath.lastIndexOf('.');
    if (lastIndex == -1 /** Didn't find `.` */
        /** Found `.` in case `./` || `../` */
        || (lastIndex === 0 && (filePath[1] === '/' || filePath[2] === '/'))) {
        return filePath;
    }
    return filePath.substr(0, lastIndex);
}

export function readFile(filePath: string): string {
    return fs.readFileSync(filePath, 'utf8');
}

/** Will write the file and even make directories if needed */
export function writeFile(filePath: string, content: string) {
    mkdirp.sync(path.dirname(filePath));
    fs.writeFileSync(filePath, content, 'utf8');
}

export function deleteFile(filePath:string) {
    fs.unlinkSync(filePath);
}

export function deleteDir(dirPath:string):Promise<{}> {
    return new Promise(resolve => {
        rimraf(dirPath,{glob: false,maxBusyTries: 10},(e)=>{
            if (e) {
                console.error('Failed to delete Dir: ', dirPath);
            }
            resolve({});
        });
    })
}

/** see if a file exists */
export var existsSync = (filePath: string) => fs.existsSync(filePath);

/** see if path is absolute */
export var isAbsolute = (filePath: string) => path.isAbsolute(filePath);

/** is the filePath a directory? */
export var isDir = (filePath: string): boolean => fs.lstatSync(filePath).isDirectory();

/**
 * See if path is relative.
 */
//  Not particularly awesome e.g. '/..foo' will be not relative ,
//  but it shouldn't matter as the significance is really about if `cwd` matters
export function isRelative(str: string) {
    if (!str.length) return false;
    return str[0] == '.' || str.substring(0, 2) == "./" || str.substring(0, 3) == "../";
}


/**
  * returns the path if found
  * @throws an error "not found" if not found */
export function travelUpTheDirectoryTreeTillYouFind(startDir: string, fileOrDirectory: string,
    /** This is useful if we don't want to file `node_modules from inside node_modules` */
    abortIfInside = false): string {
    while (fs.existsSync(startDir)) { // while directory exists

        var potentialFile = startDir + '/' + fileOrDirectory;

        /** This means that we were *just* in this directory */
        if (before == potentialFile) {
            if (abortIfInside) {
                throw new Error("not found")
            }
        }

        if (fs.existsSync(potentialFile)) { // found it
            return consistentPath(potentialFile);
        }
        else { // go up
            var before = startDir;
            startDir = path.dirname(startDir);
            // At root:
            if (startDir == before) throw new Error("not found");
        }
    }
}

/**
 * Gets the sub directories of a directory
 */
export function getDirs(rootDir: string): string[] {
    var files = fs.readdirSync(rootDir)
    var dirs = []

    for (var file of files) {
        if (file[0] != '.') {
            var filePath = `${rootDir}/${file}`
            var stat = fs.statSync(filePath);

            if (stat.isDirectory()) {
                dirs.push(filePath)
            }
        }
    }
    return dirs;
}
