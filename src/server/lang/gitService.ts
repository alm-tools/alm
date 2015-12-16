/**
 * The stuff that interacts with system git
 */
import * as cp from "child_process";
import * as wd from "../disk/workingDir";
import * as fmc from "../disk/fileModelCache";

/** Main utility function to execute a command */
let gitCmd = (...args: string[]):Promise<string> => {
    return new Promise((resolve,reject)=>{
        cp.exec(`git ${args.join(' ')}`, { cwd: wd.getProjectRoot() }, (err, stdout, stderr) => {
            if (stderr.toString().trim().length) {
                return resolve(stderr.toString());
            }
            return resolve(stdout);
        });
    });
}

export function gitStatus(args:{}): Promise<string> {
    return gitCmd('status');
}

export function gitReset(args:{filePath:string}): Promise<string> {
    fmc.saveOpenFile(args.filePath);
    return gitCmd('reset',args.filePath);
}
