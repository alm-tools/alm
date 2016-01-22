/**
 * Find and replace multi. The single file version is client only.
 */

import * as wd from "../disk/workingDir";
import * as cp from "child_process";
import {Types} from "../../socket/socketContract";
import * as utils from "../../common/utils";

/**
 * Singleton current farm state
 */
interface FarmingState {
    ignore: () => void;
}
let farmState: FarmingState = null;

/**
 * The found results are collected here
 */
let results: Types.FarmResultDetails[] = [];
const throttledSend = utils.throttle(() => {
    // console.log(results);
    // TODO: send
}, 500);
function addSearchResults(newResults: Types.FarmResultDetails[]) {
    results = results.concat(newResults);
    throttledSend();
}


/**
 *
 *
 * The exposed service API
 *
 *
 */

/** Also safely stops any previous running farming */
export function startFarming(cfg: Types.FarmConfig): Promise<{}> {
    stopFarmingIfRunning({});


    /** Allows us to abort a search */
    let ignored = false;
    const ignore = () => ignored = true;


    let searchTerm = cfg.query;
    console.log(cfg.query);

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
        `--`  // signals pathspec
    ].concat(cfg.globs));

    grep.stdout.on('data', (data) => {
        if (ignored) return;
        // console.log(`Grep stdout: ${data}`);

        // Sample :
        // src/typings/express/express.d.ts:907:                app.enable('foo')
        // src/typings/express/express.d.ts:908:                app.disabled('foo')

        // String
        data = data.toString();

        // Split by \n and trim each to get lines
        let lines: string[] =
            data.split('\n')
                .map(x => x.trim())
                .filter(x => x);

        const newResults: Types.FarmResultDetails[] = lines.map(line => {
            let originalLine = line;

            // Split line by `:\d:` to get relativeName as first
            let relativeFilePath = line.split(/:\d+:/)[0];
            line = line.substr(relativeFilePath.length);

            // :123:  some preview
            // =>
            // 123:  some preview
            line = line.substr(1);

            // line number!
            let lineNumber = line.split(':')[0];
            line = line.substr(lineNumber.length);

            // :      some preview
            // =>
            // some preview
            let preview =
                line.split(':').slice(1).join(':')
                    .trim();

            let result: Types.FarmResultDetails = {
                filePath: wd.makeAbsolute(relativeFilePath),
                line: +lineNumber,
                preview: preview
            };

            /* Debug
            console.log(originalLine);
            console.log('\n')
            console.log(result);
            console.log('------------------------------------------\n')
            /* */

            return result;
        });

        // Send them through
        addSearchResults(newResults);
    });

    grep.stderr.on('data', (data) => {
        if (ignored) return;
        console.log(`Grep stderr: ${data}`);
    });

    grep.on('close', (code) => {
        if (ignored) return;

        if (!code) {
            // TODO: Search complete!
        }
        if (code) {
            // Also happens if search returned no results
            console.error(`Grep process exited with code ${code}`);
        }
    });

    farmState = { ignore };


    return Promise.resolve({});
}

export function stopFarmingIfRunning(args: {}): Promise<{}> {
    if (farmState) {
        farmState.ignore();
        farmState = null;
    }
    return Promise.resolve({});
}
