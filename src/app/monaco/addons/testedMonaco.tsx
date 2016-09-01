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

namespace TestedMonacoStyles {
    export const logOverlayClassName = fstyle.style({
        whiteSpace: 'pre',
        color: styles.highlightColor,
        pointerEvents: 'none',

        /**
         * This is to match the line height for a line in monaco
         * Inspected a line in monaco to figure this out
         */
        lineHeight: '24px',
    })
}

export function setup(editor: Editor): { dispose: () => void } {
    // if (editor) return { dispose: () => null }; // DEBUG : while the feature isn't complete used to disable it

    let hadSomeTestsResults = false;

    type Widget = {
        widgetDispose: {dispose():void},
    }
    const deltaWidgets = new DeltaList<types.TestLog, Widget>({
        getId: (log: types.TestLog) => {
            return `${keyForMonacoDifferentiation} - ${JSON.stringify(log)}`;
        },
        onAdd:(log) => {
            const argsStringifiedAndJoined =
                log.args.map((a) => json.stringify(a).trim())
                    .join('\n———————————————\n');

            let nodeRendered =
                <div className={TestedMonacoStyles.logOverlayClassName}>
                    {argsStringifiedAndJoined}
                </div>;
            let node = document.createElement('div');
            ReactDOM.render(nodeRendered, node);

            const line = log.position.position.line;
            const ch = log.position.position.ch;

            const widgetDispose = MonacoInlineWidget.add({
                editor,
                frameColor: styles.highlightColor,
                domNode: node,
                position: { line, ch },
                heightInLines: argsStringifiedAndJoined.split('\n').length + 1,
            });
            return {widgetDispose};
        },
        onRemove: (log, state) => state.widgetDispose.dispose(),
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
                deltaWidgets.delta([]);
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

        deltaWidgets.delta(thisModule.logs);

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
        heightInLines: number,
    }

    /** For reference see `gotoError.ts` in monaco source code */
    class MyMarkerWidget extends ZoneWidget {
        private _editor: ICodeEditor;
        private _parentContainer: HTMLElement;

        constructor(private config: Config) {
            super(config.editor, {
                showArrow: true,
                showFrame: true,
                isAccessible: false,
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
        return new MyMarkerWidget(config);
    }
}
