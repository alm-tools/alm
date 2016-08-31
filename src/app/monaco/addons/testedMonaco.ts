/**
 * Renders tested stuff in monaco
 */
import {testResultsCache} from "../../clientTestResultsCache";
import * as events from "../../../common/events";
import * as utils from "../../../common/utils";
type IDisposable = events.Disposable;
type Editor = monaco.editor.ICodeEditor;


export function setup(editor: Editor): { dispose: () => void } {
    // if (editor) return { dispose: () => null }; // DEBUG : while the feature isn't complete used to disable it

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
        if (!thisModule) return;

        /** Update logs for this file */
        console.log(thisModule.logs);
    }, 500);

    // Perform an initial lint
    performLogRefresh();
    const disposible = new events.CompositeDisposible();
    // Subscribe for future updates
    disposible.add(testResultsCache.testResultsDelta.on(performLogRefresh));

    return disposible;
}
