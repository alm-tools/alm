/**
 * Find and replace multi. The single file version is client only.
 */

import * as wd from "../../disk/workingDir";
import * as cp from "child_process";

interface FarmConfig {
    pattern: string;
    globs: string[];
}

/**
 * TODO: move to observables that can be:
 * - cancelled
 * - streamed
 * - collected to give initial value
 */
let farmCommand = (cfg: FarmConfig): Promise<string> => {
    return new Promise((resolve, reject) => {
        /**
         * n: line number
         * E: extended regexp
         */
        cp.exec(`git grep -En -- ${cfg.globs.join(' ')}`, { cwd: wd.getProjectRoot() }, (err, stdout, stderr) => {
            if (stderr.toString().trim().length) {
                return resolve(stderr.toString());
            }
            return resolve(stdout);
        });
    });
}
