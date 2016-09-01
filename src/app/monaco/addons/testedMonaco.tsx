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


declare class _ZoneWidget {
    constructor(...args: any[]);
    create(): void;
    show(pos: Position, heightInLines: number): void;
    dispose(): void;
};
const ZoneWidget: typeof _ZoneWidget = monacoRequire('vs/editor/contrib/zoneWidget/browser/zoneWidget').ZoneWidget;
const dom = monacoRequire('vs/base/browser/dom');

/** For reference see `gotoError.ts` in monaco source code */
class MyMarkerWidget extends ZoneWidget {
    private _editor: ICodeEditor;
    private _parentContainer: HTMLElement;
    private _container: HTMLElement;
    private _title: HTMLElement;

    constructor(private config: {
        editor: Editor,
        frameColor: string,
        domNode: HTMLDivElement,
        position: { line: number, ch: number },
        heightInLines: number,
    }) {
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
        dom.addClass(container, 'marker-widget');
        this._parentContainer.tabIndex = 0;
        this._parentContainer.setAttribute('role', 'tooltip');

        this._parentContainer.appendChild(this.config.domNode);
    }

    public dispose() {
        super.dispose();
    }
}

const keyForMonacoDifferentiation = "alm_tested"

namespace TestedMonacoStyles {
    export const logOverlayClassName = fstyle.style({
        whiteSpace: 'pre',
        color: styles.highlightColor,
        pointerEvents: 'none'
    })
}

export function setup(editor: Editor): { dispose: () => void } {
    // if (editor) return { dispose: () => null }; // DEBUG : while the feature isn't complete used to disable it

    let hadSomeTestsResults = false;

    type Widget = {
        widget: MyMarkerWidget,
        log: types.TestLog,
        node: HTMLDivElement;
    }
    const widgets: Widget[] = [];
    const getWidgetId = (log: types.TestLog) => {
        return `${keyForMonacoDifferentiation} - ${log.position.position.line} - ${log.position.position.ch}`;
    }
    const addContentWidget = (log: types.TestLog) => {
        const argsStringifiedAndJoined = log.args.map((a) => json.stringify(a).trim()).join('\n-----\n');

        let nodeRendered =
            <div className={TestedMonacoStyles.logOverlayClassName}>
                {argsStringifiedAndJoined}
            </div>;
        let node = document.createElement('div');
        ReactDOM.render(nodeRendered, node);

        const line = log.position.position.line;
        const ch = log.position.position.ch;

        const widget = new MyMarkerWidget({
            editor,
            frameColor: styles.highlightColor,
            domNode: node,
            position: { line, ch },
            heightInLines: argsStringifiedAndJoined.split('\n').length + 1,
        });

        widgets.push({
            widget,
            log,
            node
        });
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
 * Imagine a data structure that takes `T[]`
 * and given `getId(): T`
 *
 * Calls these on delta for `T[]`
 *
 * onAdd => do stuff
 * onRemove => do stuff
 */
class DeltaList<T> {
    constructor(private config: {
        getId: (item: T) => string;
        onAdd: (item: T) => any;
        onRemove: (item: T) => any;
    }) { }

    private map: { [id: string]: T } = Object.create(null);

    delta(items: T[]) {
        /** new dict */
        const newDict = Object.create(null);
        items.forEach(item => newDict[this.config.getId(item)] = item);

        /** old dict */
        const oldDict = this.map;

        /** Added? */
        items.forEach(item => {
            const id = this.config.getId(item);
            if (!oldDict[id]) {
                this.config.onAdd(item);
            }
        });

        /** Removed? */
        Object.keys(oldDict).forEach(id => {
            if (!newDict[id]){
                this.config.onRemove(oldDict[id]);
            }
        });

        this.map = newDict;
    }
}
