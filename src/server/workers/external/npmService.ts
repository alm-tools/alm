/**
 * The stuff that interacts with system git
 */
import * as cp from "child_process";
import * as wd from "../../disk/workingDir";
import * as fmc from "../../disk/fileModelCache";
import * as types from "../../../common/types";
import * as fsu from "../../utils/fsu";

/** TODO: this is just a placeholder as I think about how to do this */
const getPackageJsonFilePath = () => {
    let packageJsonFilePath = wd.getProjectRoot();
    try {
        packageJsonFilePath = fsu.travelUpTheDirectoryTreeTillYouFind(packageJsonFilePath, 'package.json');
    }
    catch (e) { }
    return packageJsonFilePath;
}

/** Main utility function to execute a command */
let npmCmd = (...args: string[]): Promise<string> => {
    return new Promise((resolve, reject) => {
        const cwd = wd.getProjectRoot();
        cp.exec(`npm ${args.join(' ')}`, { cwd: cwd }, (err, stdout, stderr) => {
            if (stderr.toString().trim().length) {
                return resolve(stderr.toString());
            }
            return resolve(stdout);
        });
    });
}

export function npmInfo(args: { packageName: string }): Promise<string> {
    return npmCmd('npm', 'info', args.packageName);
}

import * as fetch from "node-fetch";
export function npmLatest({pack}: { pack: string }): Promise<{ description?: string, version?: string }> {
    const queryUrl = 'http://registry.npmjs.org:80/' + encodeURIComponent(pack) + '/latest';

    return fetch(queryUrl)
        .then(function(response) {
            return response.json()
        })
        .then(function(obj:any) {
            let result: {
                description?: string,
                version?: string
            } = {};
            if (obj.description) {
                result.description = obj.description;
            }
            if (obj.version) {
                result.version = obj.version;
            }
            return result;
        })
        .catch((error) => {
            return {description: `Failed to query info for ${pack}`};
        });
}
