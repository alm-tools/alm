import {TypedEvent} from "../../../../common/events";
import {createMapByKey, debounce, selectMany} from "../../../../common/utils";
import equal = require('deep-equal');
import * as types from "../../../../common/types";

// What we use to identify a unique test
const same = (a: types.TestModule, b: types.TestModule): boolean => {
    return equal(a, b);
}


/**
 * Maintains the list of tests that have been encountered,
 * and notifies anyone who is concerned of updated values
 */
export class TestResultCache {
    /**
     * When a cache boots up (e.g. server restart). Its good to know if its an initial test run
     * If so the client might want to clear all previous results
     */
    initial = true;

    /**
     * Event that can be wired up to sync one cache with another
     */
    public testDelta = new TypedEvent<types.TestDelta>();

    /**
     * You can wire up an errors Delta from one cache to this one.
     */
    public applyDelta = (delta:types.TestDelta) => {
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
        const delta: types.TestDelta = {
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

        // Send out the delta
        this.testDelta.emit(delta);

        // Preserve for future delta
        this.last = Object.create(null);
        Object.keys(this.current).map(fp => this.last[fp] = this.current[fp]);
    }, 250);

    /** The passed results are considered the only ones. All else is cleared */
    public setResults = (results: types.TestModule[]) => {
        this.current = Object.create(null);
        results.forEach(res => {
            this.current[res.filePath] = res;
        });

        this.sendDelta();
    }

    /**
     * Clear all errors. Resets the cache.
     *
     * Also good or an initial sync.
     * e.g. when the socket server reboots
     *   it wants to clear any errors that any connected clicks might have
     */
    public clearErrors = () => {
        this.current = Object.create(null);
        this.sendDelta();
    }
}
