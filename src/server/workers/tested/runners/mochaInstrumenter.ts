/**
 * Instruments a spec file so we know what's happening
 * Reasons:
 * - console.log() : breaks mocha built in json reporter
 * - figuring out `describe` / `it` lines is easiest with instrumentation
 */

/** Our only import */
import * as common from "./instrumenterCommon";
import {TestLog} from "./instrumenterCommon";
const {stringify, makeStack, makeTestLogPosition, stackFromCaller} = common;

/**
 * Collects all our logs
 */
const logs: TestLog[] = [];
const addToLogs = function() {
    const stack = stackFromCaller();
    const args = ((Array as any).from(arguments));
    const testLogPosition = makeTestLogPosition(filePath, stack);
    logs.push({ testLogPosition, args });
}

/**
 * Mock out console
 * NOTE: we mock out individual functions because
 * the whole `console` is actually readonly in nodejs and cannot be set.
 */
const log = console.log.bind(console);
console.log = addToLogs;
console.warn = addToLogs;
console.error = addToLogs;


/**
 * Get the filePath from the arguments ;)
 */
const filePath = process.argv[process.argv.length - 1];
/* Send logs to the data file */
process.on('exit', ()=> {
    common.writeDataFile(filePath, {logs})
})
