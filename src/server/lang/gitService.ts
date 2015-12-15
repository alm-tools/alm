/**
 * The stuff that interacts with system git
 */
import * as cp from "child_process";
import * as wd from "../disk/workingDir";

/** Main utility function to execute a command */
let gitCmd = (...args: string[]):Promise<string> => {
    cp.exec(`git ${args.join(' ')}`, { cwd: wd.getProjectRoot() }, (err, stdout, stderr) => {
                    console.log(stdout);
                    if (stderr.toString().trim().length) {
                        console.error(stderr);
                    }
                });

    return Promise.resolve({});
}

export function getStatus(args:{}): Promise<string> {
    return gitCmd('log');
}
