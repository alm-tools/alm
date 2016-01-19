/**
 * Find and replace multi. The single file version is client only.
 */

import * as wd from "../../disk/workingDir";
import * as cp from "child_process";

interface FarmConfig {
    pattern: string;
    globs: string[];
}

interface FarmingState {
    ignore: () => void;
}

let farmState:FarmingState = null;

/**
 * Only allows one active process of farming
 */
let restartFarming = (cfg: FarmConfig) => {
    if (farmState){
        farmState.ignore();
        farmState = null;
    }

    /** Allows us to abort a search */
    let ignored = false;
    const ignore = () => ignored = true;

    /**
     * https://git-scm.com/docs/git-grep
     *
     * // General main ones
     * n: line number
     * E: extended regexp
     * I: don't match binary files
     *
     * // Useful toggles
     * w: Match the pattern only at word boundary (also takes into account new lines 💟)
     * i: ignore case
     */
    const grep = cp.spawn(`git grep -EIn -- ${cfg.globs.join(' ')}`);

    grep.stdout.on('data', (data) => {
        if (ignored) return;
        console.log(`stdout: ${data}`);
    });

    grep.stderr.on('data', (data) => {
        if (ignored) return;
        console.log(`stderr: ${data}`);
    });

    grep.on('close', (code) => {
        if (ignored) return;
        console.log(`child process exited with code ${code}`);
    });

    farmState = {ignore};
}
