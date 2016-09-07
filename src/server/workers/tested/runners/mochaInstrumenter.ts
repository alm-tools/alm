/**
 * Instruments a spec file so we know what's happening
 * Reasons:
 * - console.log() : breaks mocha built in json reporter
 * - figuring out `describe` / `it` lines is easiest with instrumentation
 */

/** Our only import */
import * as common from "./instrumenterCommon";
import {TestLog, TestSuitePosition, TestItPosition} from "./instrumenterCommon";
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
    common.writeDataFile(filePath, {logs,suites,its})
})


/**
 * Intercept all calls to describe and it
 */
/** The positions */
const suites: TestSuitePosition[] = [];
const its: TestItPosition[] = [];
/** The interceptor */
var Mocha = require('mocha');
const origBDD = Mocha.interfaces["bdd"];
Mocha.interfaces["bdd"] = function(suite) {
    // Still do what the original one did to let its `pre-require` pass
    origBDD(suite);

    const addToDescribe = function() {
        const stack = stackFromCaller().slice(1);
        const args = ((Array as any).from(arguments));
        const testLogPosition = makeTestLogPosition(filePath, stack);
    }

    // And attach our own custom pre-require to fixup context watchers
    suite.on('pre-require', function(context, file, mocha) {
        const origDescribe = context.describe;
        const origDescribeOnly = context.describe.only;
        const origDescribeSkip = context.describe.skip;
        context.describe = function(title) {
            return origDescribe.apply(context,arguments);
        }
        context.describe.only = function(title){
            return origDescribeOnly.apply(origDescribe,arguments);
        }
        context.describe.skip = function(title){
            return origDescribeSkip.apply(origDescribe,arguments);
        }

        const origIt = context.it;
        const origItOnly = context.it.only;
        const origItSkip = context.it.skip;
        context.it = function(title){
            return origIt.apply(context,arguments);
        }
        context.it.only = function(title){
            return origItOnly.apply(origIt,arguments);
        }
        context.it.skip = function(title){
            return origItSkip.apply(origIt,arguments);
        }
    });
}
