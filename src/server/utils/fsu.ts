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
    return filePath.substr(0, filePath.lastIndexOf('.'));
}

export function readFile(filePath: string): string {
    return fs.readFileSync(filePath, 'utf8');
}
export function writeFile(filePath: string, content: string) {
    mkdirp.sync(path.dirname(filePath));
    fs.writeFileSync(filePath, content, 'utf8');
}

export var existsSync = (filePath: string) => fs.existsSync(filePath);
