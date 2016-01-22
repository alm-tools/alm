/**
 * Find and replace multi. The single file version is client only.
 */

import * as wd from "../disk/workingDir";
import * as cp from "child_process";
import {Types} from "../../socket/socketContract";
import * as utils from "../../common/utils";
import {TypedEvent} from "../../common/events";

/**
 * Maintains current farm state
 */
class FarmState {
    /**
     * The found results are collected here
     */
    results: Types.FarmResultDetails[] = [];
    addSearchResults(newResults: Types.FarmResultDetails[]) {
        this.results = this.results.concat(newResults);
        this.throttledSend();
    }
    throttledSend = utils.throttle(() => {
        // console.log(results);
        // TODO: send
    }, 500);


    /** Completion */
    private completed = false;
    complete = () => {
        this.completed = true;
    }

    /** Allows us to dispose any running search */
    disposed = false;
    dispose = () => this.disposed = true;
}

/**
 * The current farm state
 */
let farmState: FarmState = null;


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
    farmState = new FarmState();

    let searchTerm = cfg.query;

    /**
     * https://git-scm.com/docs/git-grep
     *
     * We don't do `--full-name` as that is relative to `.git` parent.
     * Without that it is relative to cwd which is better for us.
     *
     * // General main ones
     * n: line number
     * I: don't match binary files
     *
     * // Useful toggles
     * w: Match the pattern only at word boundary (also takes into account new lines 💟)
     * i: ignore case
     *
     * E: extended regexp
     * F: Don't interpret pattern as regexp
     */
    const grep = cp.spawn(`git`, [
        `--no-pager`,
        `grep`,
        `-In`
        + (cfg.isRegex ? 'E' : 'F')
        + (cfg.isFullWord ? 'w' : '')
        + (cfg.isCaseSensitive ? 'i' : ''),
        searchTerm,
        `--`  // signals pathspec
    ].concat(cfg.globs));

    grep.stdout.on('data', (data) => {
        if (farmState.disposed) return;
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
        farmState.addSearchResults(newResults);
    });

    grep.stderr.on('data', (data) => {
        if (farmState.disposed) return;

        console.log(`Grep stderr: ${data}`);
    });

    grep.on('close', (code) => {
        if (farmState.disposed) return;

        farmState.complete();

        if (!code) {
            // TODO: Search complete!
        }
        if (code) {
            // Also happens if search returned no results
            // console.error(`Grep process exited with code ${code}`);
        }
    });


    return Promise.resolve({});
}

export function stopFarmingIfRunning(args: {}): Promise<{}> {
    if (farmState) {
        farmState.dispose();
        farmState = null;
    }
    return Promise.resolve({});
}
