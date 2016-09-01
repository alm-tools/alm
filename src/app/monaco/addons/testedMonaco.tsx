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
    constructor(...args:any[]);
    create():void;
    show(pos:Position, heightInLines: number): void;
    dispose(): void;
};
const ZoneWidget:typeof _ZoneWidget = monacoRequire('vs/editor/contrib/zoneWidget/browser/zoneWidget').ZoneWidget;
const dom = monacoRequire('vs/base/browser/dom');

/** For reference see `gotoError.ts` in monaco source code */
class MyMarkerWidget extends ZoneWidget {
    private _editor: ICodeEditor;
	private _parentContainer: HTMLElement;
    private _container: HTMLElement;
    private _title: HTMLElement;

    constructor(editor: Editor){
        super(editor, { showArrow: true, showFrame: true, isAccessible: false, frameColor: styles.highlightColor });
        this.create();
    }
    protected _fillContainer(container: HTMLElement): void {
		this._parentContainer = container;
		dom.addClass(container, 'marker-widget');
		this._parentContainer.tabIndex = 0;
		this._parentContainer.setAttribute('role', 'tooltip');

		this._container = document.createElement('div');
		container.appendChild(this._container);

		this._title = document.createElement('div');
		this._title.className = 'block title';
		this._container.appendChild(this._title);

        this._title.innerHTML = "Hello World";
	}

    public show(where: Position, heightInLines: number): void {
		super.show(where, heightInLines);
		this._parentContainer.focus();
	}

    public dispose() {
        super.dispose();
    }
}

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

        const widget = new MyMarkerWidget(editor);
        widget.show(new Position(lineNumber, column), 10);
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
