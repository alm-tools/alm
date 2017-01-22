/**
 * @module Runs the bundler
 */
import * as webpack from 'webpack';
import * as fs from 'fs';
import * as cp from 'child_process';
import * as ts from 'typescript';

let compiledOnceInThisRun = false;

/** Main utility function to execute a command */
let bundleCmd = (args: any): Promise<string> => {
    return new Promise((resolve, reject) => {
        const cwd = __dirname;

        cp.execFile(process.execPath, [`${__dirname}/child.js`].concat([JSON.stringify(args)]), { cwd: cwd }, (err, stdout, stderr) => {
            if (stderr.toString().trim().length) {
                return reject(stderr.toString());
            }
            return resolve(stdout);
        });
    });
}

/**
 * Creates a webpack bundle
 */
export function bundle(args: {
    entryPointName: string,
    outputFileName: string,
    prod: boolean
}) {
    return bundleCmd(args);
}
