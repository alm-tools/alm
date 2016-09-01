/**
 * Renders tested stuff in monaco
 */
import {testResultsCache} from "../../clientTestResultsCache";
import * as events from "../../../common/events";
import * as utils from "../../../common/utils";
import * as types from "../../../common/types";
import * as json from "../../../common/json";
import * as fstyle from "../../base/fstyle";
import * as styles from "../../styles/styles";
import * as React from "react";
import * as ReactDOM from "react-dom";
type IDisposable = events.Disposable;
type Editor = monaco.editor.ICodeEditor;

const keyForMonacoDifferentiation = "alm_tested"

namespace TestedMonacoStyles {
    export const logOverlayClassName = fstyle.style({
        fontSize: '.7em',
        color: styles.highlightColor,
        pointerEvents: 'none'
    })
}

export function setup(editor: Editor): { dispose: () => void } {
    // if (editor) return { dispose: () => null }; // DEBUG : while the feature isn't complete used to disable it

    let hadSomeTestsResults = false;

    type Widget = {
        monacoWidget: monaco.editor.IContentWidget,
        log: types.TestLog,
        node: HTMLDivElement;
    }
    const widgets: Widget[] = [];
    const getWidgetId = (log: types.TestLog) => {
        return `${keyForMonacoDifferentiation} - ${log.position.position.line} - ${log.position.position.ch}`;
    }
    const addContentWidget = (log: types.TestLog) => {
        let nodeRendered = <div className={TestedMonacoStyles.logOverlayClassName}>{
            log.args.map((a,i)=><div key={i}>{json.stringify(a).trim()}</div>)
        }</div>;
        let node = document.createElement('div'); ReactDOM.render(nodeRendered, node);

        const lineNumber = log.position.position.line + 1;
        const column = editor.getModel().getLineContent(lineNumber).length;

        const monacoWidget = {
            allowEditorOverflow: true,
            getId: () => getWidgetId(log),
            getDomNode: () => node,
            getPosition: () => {
                return {
                    position: { lineNumber, column},
                    preference: [
                        monaco.editor.ContentWidgetPositionPreference.ABOVE,
                        monaco.editor.ContentWidgetPositionPreference.EXACT,
                        monaco.editor.ContentWidgetPositionPreference.BELOW,
                    ]
                }
            }
        }
        editor.addContentWidget(monacoWidget);
        widgets.push({
            monacoWidget,
            log,
            node
        })
    }


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

            }
            hadSomeTestsResults = false;
            return;
        }

        hadSomeTestsResults = true;

        /**
         * TODO: tested
         * Update logs for this file
         * For those found update them
         * For those not found delete them
         * For those new add them.
         */

        thisModule.logs.map(addContentWidget);

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


/**
 * Imagine a data structure that has
 * List<T>
 * getId()T
 * onAdd => do stuff
 * onRemove => do stuff
 */
