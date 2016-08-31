/**
 * Instruments a spec file so we know what's happening
 * Reasons:
 * - console.log() : breaks mocha built in json reporter
 * - figuring out `describe` / `it` lines is easiest with instrumentation
 */

/** Our only import */
import * as common from "./instrumenterCommon";
import {TestLog} from "./instrumenterCommon";
const {stringify, makeStack} = common;

/**
 * Collects all our logs
 */
const logs: TestLog[] = [];
const addToLogs = (theArgs: IArguments) => {
    /** 0 is our caller. 1 is *our* caller's caller */
    const position = stackFromCaller()[1];
    const args = ((Array as any).from(theArgs));
    logs.push({ position, args });
}

/**
 * Mock out console
 * NOTE: we mock out individual functions because
 * the whole `console` is actually readonly in nodejs and cannot be set.
 */
const log = console.log.bind(console);
console.log = function() {
    addToLogs(arguments);
}

/**
 * Get the filePath from the arguments ;)
 */
const filePath = process.argv[process.argv.length - 3];
/* TODO: tested send logs to the data file */
process.on('exit', ()=> {
    common.writeDataFile(filePath, {logs})
})

/** Utility to get stack */
const stackFromCaller = () => makeStack((new Error() as any).stack)
    /**
     * Skip 1 as its this function
     * Skip another as its the function calling us
     */
    .slice(2);
