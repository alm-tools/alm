import {TypedEvent} from "../../../../common/events";
import {createMapByKey, debounce, selectMany} from "../../../../common/utils";
import equal = require('deep-equal');
import * as types from "../../../../common/types";
import * as utils from "../../../../common/utils";

// What we use to identify a unique test
const same = (a: types.TestModule, b: types.TestModule): boolean => {
    return equal(a, b);
}


/**
 * Maintains the list of tests that have been encountered,
 * and notifies anyone who is concerned of updated values
 */
export class TestResultsCache {
    /**
     * When a cache boots up (e.g. server restart). Its good to know if its an initial test run
     * If so the client might want to clear all previous results
     */
    initial = true;

    /**
     * Event that can be wired up to sync one cache with another
     */
    public testResultsDelta = new TypedEvent<types.TestResultsDelta>();

    /**
     * You can wire up an errors Delta from one cache to this one.
     */
    public applyTestResultsDelta = (delta:types.TestResultsDelta) => {
        if (delta.initial) {
            this.current = delta.updatedModuleMap;
        }
        else {
            Object.keys(delta.updatedModuleMap).forEach(filePath => {
                this.current[filePath] = delta.updatedModuleMap[filePath];
            });
            delta.clearedModules.forEach(fp => {
                delete this.current[fp];
            });
        }
        this.sendDelta();
    }

    /**
     *  DELTA MAINTAINANCE
     */
    private last: types.TestSuitesByFilePath = Object.create(null);

    /**
     * current errors
     */
    private current: types.TestSuitesByFilePath = Object.create(null);

    /**
     * debounced as constantly sending updates quickly degrades the web experience
     */
    private sendDelta = debounce(() => {
        // TODO Create a delta
        const last = this.last;
        const current = this.current;
        const delta: types.TestResultsDelta = {
            updatedModuleMap: Object.create(null),
            clearedModules: [],
            initial: this.initial,
        };
        this.initial = false;

        Object.keys(current).forEach(fp => {
            // Added
            if (!last[fp]) {
                delta.updatedModuleMap[fp] = current[fp];
            }
            // Diff
            else if (!same(current[fp], last[fp])) {
                delta.updatedModuleMap[fp] = current[fp];
            }
        });

        /** Removed */
        Object.keys(last).forEach(fp => {
            if (!this.current[fp]){
                delta.clearedModules.push(fp);
            }
        });

        // Preserve for future delta
        this.last = Object.create(null);
        Object.keys(this.current).map(fp => this.last[fp] = this.current[fp]);

        // Send out the delta
        this.testResultsDelta.emit(delta);
    }, 250);

    /** The passed results are considered the only ones. All else is cleared */
    public setResultsTotal = (results: types.TestModule[]) => {
        this.current = Object.create(null);
        results.forEach(res => {
            this.current[res.filePath] = res;
        });

        this.sendDelta();
    }

    /** Only for one file */
    public addResult = (result: types.TestModule) => {
        this.current[result.filePath] = result;
        this.sendDelta();
    }

    /**
     * Clear all results. Resets the cache.
     *
     * Also good or an initial sync.
     * e.g. when the socket server reboots
     *   it wants to clear any errors that any connected clicks might have
     */
    public clearResults = () => {
        this.current = Object.create(null);
        this.sendDelta();
    }

    /**
     * Get the last results so you can start listening to new deltas
     */
    public getResults = () => this.last;
    /** set after initial sync */
    public setResults = (results: types.TestSuitesByFilePath) => {
        this.current = results;
        this.sendDelta();
    }

    /**
     * Collects overall stats
     */
    public getStats = (): types.TestContainerStats => {
        const allModules = Object.keys(this.current).map(k=>this.current[k]);

        const sumReducer = (arr: number[]) => arr.reduce((i, acc) => acc + i, 0);

        const result: types.TestContainerStats = {
            testCount: sumReducer(allModules.map(x=>x.stats.testCount)),

            passCount: sumReducer(allModules.map(x=>x.stats.passCount)),
            failCount: sumReducer(allModules.map(x=>x.stats.failCount)),
            skipCount: sumReducer(allModules.map(x=>x.stats.skipCount)),

            durationMs: sumReducer(allModules.map(x=>x.stats.durationMs)),
        }

        return result;
    }
}
