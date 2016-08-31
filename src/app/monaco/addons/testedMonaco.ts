/**
 * Renders tested stuff in monaco
 */
import {testResultsCache} from "../../clientTestResultsCache";
import * as events from "../../../common/events";
import * as utils from "../../../common/utils";
import * as types from "../../../common/types";
import * as json from "../../../common/json";
type IDisposable = events.Disposable;
type Editor = monaco.editor.ICodeEditor;


const markerSource = 'alm-tested';

function logToMonacoMarker(log: types.TestLog): monaco.editor.IMarkerData {
    return {
        severity: monaco.Severity.Info,
        message: log.args.map(a=>json.stringify(a).trim()).join('\n'),

        startLineNumber: log.position.position.line + 1,
        startColumn: log.position.position.ch + 1,
        endLineNumber: log.position.position.line + 1,
        endColumn: log.position.position.ch + 1,
    };
}

export function setup(editor: Editor): { dispose: () => void } {
    // if (editor) return { dispose: () => null }; // DEBUG : while the feature isn't complete used to disable it

    let hadSomeTestsResults = false;

    const performLogRefresh = utils.debounce((): void => {
        let filePath: string = editor.filePath;
        let model: monaco.editor.IModel = editor.getModel();

        /**
         * TODO: tested
         * show logs in this file inline
         * show logs in external files still inline but also show the *trailing* stack
         */
        const allResults = testResultsCache.getResults();
        const thisModule = allResults[filePath];
        if (!thisModule) {
            if (hadSomeTestsResults) {
                /** TODO: tested clear them */
                monaco.editor.setModelMarkers(model, markerSource, []);
            }
            hadSomeTestsResults = false;
            return;
        }

        hadSomeTestsResults = true;

        /** Update logs for this file */
        const markers = thisModule.logs.map(log=>logToMonacoMarker(log));
        monaco.editor.setModelMarkers(model, markerSource, markers);

        /**
         * TODO: tested. Consider adding inline widgets. Find the last character in the line
         * and add a widget there?
         * Or maybe a complete line widget? 
         */

        /** TODO: tested update inline `error` (failed test) for this file in error pink */
        // console.log(thisModule.logs); // DEBUG
    }, 500);

    // Perform an initial lint
    performLogRefresh();
    const disposible = new events.CompositeDisposible();
    // Subscribe for future updates
    disposible.add(testResultsCache.testResultsDelta.on(performLogRefresh));

    return disposible;
}
