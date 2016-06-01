/**
 * Find and replace multi. The single file version is client only.
 */

import * as wd from "../../disk/workingDir";
import * as cp from "child_process";
import {Types} from "../../../socket/socketContract";
import * as utils from "../../../common/utils";
import {TypedEvent} from "../../../common/events";
import * as types from "../../../common/types";

/**
 * Maintains current farm state
 */
class FarmState {
    constructor(public config: Types.FarmConfig) {
        let searchTerm = config.query;

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
            + (config.isRegex ? 'E' : 'F')
            + (config.isFullWord ? 'w' : '')
            + (config.isCaseSensitive ? '' : 'i'),
            searchTerm,
            `--`  // signals pathspec
        ].concat(config.globs));

        grep.stdout.on('data', (data) => {
            // console.log(`Grep stdout: ${data}`);

            /** If no one cares anymore */
            if (farmState.disposed) {
                grep.kill();
                return;
            }

            /**
             * Don't want to run out of memory
             */
            if (this.results.length > types.maxCountFindAndReplaceMultiResults) {
                grep.kill();
                return;
            }

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

                if (!result.preview) {
                    // TODO: this is probably because the line boundries are wrong as data comes in.
                    // We should store the line remainder and prepend to new data.
                    return null;
                }

                return result;
            }).filter(x=>!!x);

            // Add to results
            this.results = this.results.concat(newResults);
            this.notifyUpdate();
        });

        grep.stderr.on('data', (data) => {
            if (farmState.disposed) return;

            console.log(`Grep stderr: ${data}`);
        });

        grep.on('close', (code) => {
            if (farmState.disposed) return;

            this.completed = true;
            this.notifyUpdate();

            if (!code) {
                // TODO: Search complete!
            }
            if (code) {
                // Also happens if search returned no results
                // console.error(`Grep process exited with code ${code}`);
            }
        });
    }

    /**
     * Key search state variables
     */
    private results: Types.FarmResultDetails[] = [];
    private completed = false;

    /** Exposed event */
    resultsUpdated = new TypedEvent<Types.FarmNotification>();
    private notifyUpdate = utils.throttle(() => {
        let {results, completed, config} = this;
        this.resultsUpdated.emit({ results, completed, config });
    }, 500);

    /** Allows us to dispose any running search */
    private disposed = false;
    dispose = () => {
        this.disposed = true;
        this.completed = true;
        this.notifyUpdate();
    }
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

/**
 * Subscribe to this if you want notifications about any current farming
 */
export const farmResultsUpdated = new TypedEvent<Types.FarmNotification>();
// initiate as completed with no results
farmResultsUpdated.emit({ completed: true, results: [], config: null });

/** Also safely stops any previous running farming */
export function startFarming(cfg: Types.FarmConfig): Promise<{}> {
    stopFarmingIfRunning({});

    farmState = new FarmState(cfg);
    farmResultsUpdated.emit({ completed: false, results: [], config:cfg });
    farmState.resultsUpdated.pipe(farmResultsUpdated);

    return Promise.resolve({});
}

export function stopFarmingIfRunning(args: {}): Promise<{}> {
    if (farmState) {
        farmState.dispose();
        farmState = null;
    }
    return Promise.resolve({});
}
