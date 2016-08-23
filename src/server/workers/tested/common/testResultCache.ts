import {TypedEvent} from "../../../../common/events";
import {createMapByKey, debounce, selectMany} from "../../../../common/utils";
import equal = require('deep-equal');
import * as types from "../../../../common/types";

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
        // TODO:

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
            moduleMap: Object.create(null),
            initial: this.initial,
        };
        this.initial = false;

        // Added:


        // Removed:

        // Send out the delta

        // Preserve for future delta

    }, 250);

    /** The pased errors are considered *the only current* errors for the filePath */
    public setErrorsByFilePaths = (filePaths: string[], errors: CodeError[]) => {

        // For all found errors add them

        // For not found errors clear them

        if (/*somethingNew*/ true) {
            this.sendDelta();
        }
    }

    /**
     * Clear all errors. Resets the cache.
     *
     * Also good or an initial sync.
     * e.g. when the socket server reboots
     *   it wants to clear any errors that any connected clicks might have
     */
    public clearErrors = () => {
        // this._errorsByFilePath = {};
        this.sendDelta();
    }

    /** Utility to provide a semantic name to *clearing errors*  */
    public clearErrorsForFilePath = (filePath: string) => {
        // this._errorsByFilePath[filePath] = [];
        this.sendDelta();
    }

    /** Utility to query */
    public getErrorsForFilePath = (filePath: string) => {
        // return this._errorsByFilePath[filePath] || [];
    }
}
