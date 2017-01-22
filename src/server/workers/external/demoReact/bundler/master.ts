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

        /** Create child.js for dev */
        if (fs.existsSync(`${__dirname}/child.ts`) && !compiledOnceInThisRun) {
            fs.writeFileSync(`${__dirname}/child.js`, ts.transpile(fs.readFileSync(`${__dirname}/child.ts`).toString()));
            compiledOnceInThisRun = true;
        }

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
