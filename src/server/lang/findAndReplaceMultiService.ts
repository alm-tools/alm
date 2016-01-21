/**
 * Find and replace multi. The single file version is client only.
 */

import * as wd from "../disk/workingDir";
import * as cp from "child_process";
import {Types} from "../../socket/socketContract";

interface FarmingState {
    ignore: () => void;
}

let farmState:FarmingState = null;

/**
 * Only allows one active process of farming
 */
const restartFarming = (cfg: Types.FarmConfig) => {
    if (farmState){
        farmState.ignore();
        farmState = null;
    }

    /** Allows us to abort a search */
    let ignored = false;
    const ignore = () => ignored = true;


    let searchTerm = 'foo';
    /**
     * https://git-scm.com/docs/git-grep
     *
     * We don't do `--full-name` as that is relative to `.git` parent.
     * Without that it is relative to cwd which is better for us.
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
    const grep = cp.spawn(`git`, [
        `--no-pager`,
        `grep`,
        `-EIn`,
        searchTerm,
        `--`,  // signals pathspec
        cfg.globs.join(' ')]);

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

/**
 * The exposed service API
 */
export function startFarming(cfg:Types.FarmConfig):Promise<{}>{
    restartFarming(cfg);
    return Promise.resolve({});
}
