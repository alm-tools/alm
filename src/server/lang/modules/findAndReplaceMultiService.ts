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
         * https://git-scm.com/docs/git-grep
         * 
         * n: line number
         * E: extended regexp
         * w: Match the pattern only at word boundary (also takes into account new lines 💟)
         */
        cp.exec(`git grep -En -- ${cfg.globs.join(' ')}`, { cwd: wd.getProjectRoot() }, (err, stdout, stderr) => {
            if (stderr.toString().trim().length) {
                return resolve(stderr.toString());
            }
            return resolve(stdout);
        });
    });
}
