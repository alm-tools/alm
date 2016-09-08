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
import Position = monaco.Position;
type ICodeEditor = monaco.editor.ICodeEditor;


const keyForMonacoDifferentiation = "alm_tested"
const lineSeperator = '\n———————————————\n';

namespace TestedMonacoStyles {
    const overlayCommon = {
        whiteSpace: 'pre',
        pointerEvents: 'none',

        /**
         * This is to match the line height for a line in monaco
         * Inspected a line in monaco to figure this out
         * On mac it was 24px
         * On windows it was 22px.
         * Going with the small value globally instead of trying to figure it out
         */
        lineHeight: '22px',
    }

    export const logOverlayClassName = fstyle.style(
        overlayCommon,
        {
            color: styles.highlightColor,
        }
    );

    export const errorStackOverlayClassName = fstyle.style(
        overlayCommon,
        {
            color: styles.errorColor,
        }
    );
}

export function setup(editor: Editor): { dispose: () => void } {
    // if (editor) return { dispose: () => null }; // DEBUG : while the feature isn't complete used to disable it

    let hadSomeTestsResults = false;

    type WidgetDispose = { dispose(): void };
    const deltaLogWidgets = new DeltaList<types.TestLog, WidgetDispose>({
        getId: (log: types.TestLog) => {
            return `${keyForMonacoDifferentiation} - ${JSON.stringify(log)}`;
        },
        onAdd:(log) => {
            const argsStringifiedAndJoined =
                log.args.map((a) => json.stringify(a).trim())
                    .join(lineSeperator);

            let nodeRendered =
                <div className={TestedMonacoStyles.logOverlayClassName}>
                    {argsStringifiedAndJoined}
                </div>;
            let node = document.createElement('div');
            ReactDOM.render(nodeRendered, node);

            const widgetDispose = MonacoInlineWidget.add({
                editor,
                frameColor: styles.highlightColor,
                domNode: node,
                position: log.testLogPosition.lastPositionInFile,
                heightInLines: argsStringifiedAndJoined.split('\n').length + 1,
            });
            return widgetDispose;
        },
        onRemove: (log, state) => state.dispose(),
    });

    const deltaTestResultsWidgets = new DeltaList<types.TestResult, WidgetDispose>({
        getId: (result: types.TestResult) => {
            return `${keyForMonacoDifferentiation} - ${JSON.stringify(result)}`;
        },
        onAdd: (result) => {
            const disposible = new events.CompositeDisposible();
            /**
             * Show pass fail in the editor.
             * Would prefer in gutter but monaco doesn't allow multiple gutters.
             * So adding them inline as circles.
             * They move to the gutter based on our column setting ;)
             */
            let dotRendered =
                <div className={`hint--right ${
                    result.status === types.TestStatus.Success ? "hint--success"
                    : result.status === types.TestStatus.Fail ? "hint--error"
                    : "hint--info"
                }`}
                style={{
                    cursor: 'pointer',
                    padding: '0px 5px',
                    color:
                        result.status === types.TestStatus.Success ? styles.successColor
                        : result.status === types.TestStatus.Fail ? styles.errorColor
                        : styles.highlightColor
                }}
                data-hint={
                    result.status === types.TestStatus.Success ? "Test Success"
                    : result.status === types.TestStatus.Fail ? `Test Fail: ${result.error.message}`
                    : "Test Skipped"
                }>
                    ●
                </div>;
            let dotNode = document.createElement('div');
            ReactDOM.render(dotRendered, dotNode);
            const widget: monaco.editor.IContentWidget = {
                allowEditorOverflow: true,
                getId: () => `${keyForMonacoDifferentiation} - dot - ${JSON.stringify(result)}`,
                getDomNode: () => dotNode,
                getPosition: () => {
                    return {
                        position: {
                            lineNumber: result.testLogPostion.lastPositionInFile.line + 1,
                            column: /** Show in start of line to keep it easier to scan with eye */ 1
                        },
                        preference: [
                            monaco.editor.ContentWidgetPositionPreference.EXACT
                        ]
                    }
                }
            }
            editor.addContentWidget(widget);
            disposible.add({
                dispose: () => editor.removeContentWidget(widget)
            })

            /**
             * Show stacks for error ones
             */
            if (!result.error) { // No stack for passing ones :)
                return disposible;
            }

            let detailsStringifiedAndJoined =
                result.error.stack
                    /** Remove the first one as that is where we will show the error */
                    .slice(1)
                    .map((a) => `${a.filePath}:${a.position.line + 1}:${a.position.ch + 1}`)
                    .join(lineSeperator);
            detailsStringifiedAndJoined = `${result.error.message}${lineSeperator}${detailsStringifiedAndJoined}`

            let nodeRendered =
                <div className={TestedMonacoStyles.errorStackOverlayClassName}>
                    {detailsStringifiedAndJoined}
                </div>;
            let node = document.createElement('div');
            ReactDOM.render(nodeRendered, node);

            const widgetDispose = MonacoInlineWidget.add({
                editor,
                frameColor: styles.errorColor,
                domNode: node,
                position: result.error.testLogPosition.lastPositionInFile,
                heightInLines: detailsStringifiedAndJoined.split('\n').length + 1,
            });
            disposible.add(widgetDispose);
            return disposible;
        },
        onRemove: (result, state) => state.dispose(),
    });

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
                deltaLogWidgets.delta([]);
                deltaTestResultsWidgets.delta([]);
            }
            hadSomeTestsResults = false;
            return;
        }

        hadSomeTestsResults = true;

        /**
         * Update logs for this file
         * For those found update them
         * For those not found delete them
         * For those new add them.
         */
        deltaLogWidgets.delta(thisModule.logs);

        /** Also show the test results */
        deltaTestResultsWidgets.delta(thisModule.testResults);

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
 * Imagine a data structure that takes `T[]`
 * and given `getId(): T`
 *
 * Calls these on delta for `T[]`
 *
 * onAdd => do stuff and give me some state I will call for onRemove
 * onRemove => do stuff
 */
class DeltaList<T,State> {
    constructor(private config: {
        getId: (item: T) => string;
        onAdd: (item: T) => State;
        onRemove: (item: T, state: State) => void;
    }) { }

    private map: {
        [id: string]: {
            item: T,
            state: State,
        }
    } = Object.create(null);

    delta(items: T[]) {
        /** for quick lookup */
        const quickNewItemLookup = utils.createMap(items.map(this.config.getId));

        /** New dict */
        let newDict = this.map;
        newDict = Object.create(null);

        /** old dict */
        const oldDict = this.map;

        items.forEach(item => {
            const id = this.config.getId(item);
            /** Added? */
            if (!oldDict[id]) {
                const state = this.config.onAdd(item);
                newDict[id] = {
                    item,
                    state
                }
            }
            /** Just copy over */
            else {
                newDict[id] = oldDict[id];
            }
        });

        /** Removed? */
        Object.keys(oldDict).forEach(id => {
            if (!quickNewItemLookup[id]){
                this.config.onRemove(oldDict[id].item, oldDict[id].state);
            }
        });

        this.map = newDict;
    }
}

namespace MonacoInlineWidget {
    declare class _ZoneWidget {
        constructor(...args: any[]);
        create(): void;
        show(pos: Position, heightInLines: number): void;
        dispose(): void;
    };
    const ZoneWidget: typeof _ZoneWidget = monacoRequire('vs/editor/contrib/zoneWidget/browser/zoneWidget').ZoneWidget;

    type Config = {
        editor: Editor,
        frameColor: string,
        domNode: HTMLDivElement,
        position: { line: number, ch: number },

        /**
         * Consider removing this and using height measuring
         * e.g. https://github.com/wnr/element-resize-detector
         * which is used by https://github.com/souporserious/react-measure/blob/db00f18922a0934544751c56c536689f675da9fa/src/Measure.jsx#L38
         */
        heightInLines: number,
    }

    /** For reference see `gotoError.ts` in monaco source code */
    class MyMarkerWidget extends ZoneWidget {
        private _editor: ICodeEditor;
        private _parentContainer: HTMLElement;

        constructor(private config: Config) {
            super(config.editor, {
                frameColor: config.frameColor,
            });
            this.create();
            const position = new Position(config.position.line + 1, config.position.ch + 1);
            this.show(position, config.heightInLines);
        }
        protected _fillContainer(container: HTMLElement): void {
            this._parentContainer = container;
            this._parentContainer.tabIndex = 0;
            this._parentContainer.setAttribute('role', 'tooltip');
            this._parentContainer.appendChild(this.config.domNode);
        }

        public dispose() {
            super.dispose();
        }
    }

    export function add(config: Config): { dispose: () => void } {
        /**
         * Store some stuff before adding
         */
        /** The widget jumps the cursor position. Don't do that */
        const position = config.editor.getPosition();

        /** Add  */
        const widget = new MyMarkerWidget(config);

        /**
         * Restore stuff after adding
         */
        config.editor.setPosition(position);

        return widget;
    }
}