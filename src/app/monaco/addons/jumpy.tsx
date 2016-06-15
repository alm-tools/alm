/** Imports */
import * as commands from "../../commands/commands";
import * as React from "react";
import * as ReactDOM from "react-dom";
import * as utils from "../../../common/utils";

/** Load jumpy css */
require('./jumpy.css');

/** Editor type */
type Editor = monaco.editor.ICodeEditor;
import Range = monaco.Range;

/**
 * Where we store out state. Stuff like this is conventional CodeMirror code
 * Don't judge me :P
 */
declare global {
    namespace monaco {
        namespace editor {
            export interface ICommonCodeEditor {
                _jumpyState?: JumpyState | null;
            }
        }
    }
}

/**
 * Setup key characters used for jumpy points
 */
let lowerCharacters = [];
for (let i = 'a'.charCodeAt(0); i <= 'z'.charCodeAt(0); i++) {
    lowerCharacters.push(String.fromCharCode(i));
}
export let keys: string[] = []
for (let c1 of lowerCharacters) {
    for (let c2 of lowerCharacters) {
        keys.push(c1 + c2);
    }
}

/** information about a jump point */
interface JumpyWidget {
    node: HTMLDivElement;
    line: number;
    ch: number;
    keys: string;

    monacoWiget: monaco.editor.IContentWidget | null;
}

function getWidgetId(wg: JumpyWidget) {
    return `jumpy:${wg.line}:${wg.ch}`;
}

/** needs no comment */
interface JumpyState {
    shown: boolean;
    widgets?: JumpyWidget[];
    key1?: string;
    key2?: string;
}

/** Gets or creates a state */
export function getState(editor: Editor): JumpyState {
    return editor._jumpyState || (editor._jumpyState = { widgets: [], shown: false });
}

/**
 *
 * The bulk of the logic
 *
 */
function addOverlay(editor: Editor) {
    clearAnyOverlay(editor);
    createOverlays(editor);

    // Subscribe to esc *once* to clear
    commands.esc.once(() => {
        clearAnyOverlay(editor);
    });

    // editor.onKeyDown((e:monaco.IKeyboardEvent)=>{
    //     console.log(e);
    //     if (alphanumeric and in range){
    //      e.preventDefault();
    //      e.stopPropagation();
    //     }
    //     else {
    //       clearAnyOverlay(editor);
    //     }
    // })

    // TODO: mon
    // (cm as any).on('beforeChange', handleBeforeChange);
    // (cm as any).on('scroll', clearAnyOverlay);
}

/**
 * Clears previous overlays if any
 */
function clearAnyOverlay(editor: Editor) {
    let state = getState(editor);
    if (state.shown) {
        state.widgets.forEach(wg => editor.removeContentWidget(wg.monacoWiget));
        state.widgets = [];
        state.key1 = null;
        state.key2 = null;
        state.shown = false;
        // TODO: mon
        // (cm as any).off('beforeChange', handleBeforeChange);
        // (cm as any).off('scroll', clearAnyOverlay);
    }
}

/**
 * Renders the overlays on the editor
 */
function createOverlays(editor: Editor) {
    // Set as showing
    getState(editor).shown = true;

    // The model
    let doc = editor.getModel();

    // DEBUG
    // console.log(editor);
    // window.foo = editor;

    // The text in viewport
    // HACK: The current lines visible api
    const range: Range = (editor as any)._view.layoutProvider.getLinesViewportData().visibleRange;
    let text = doc.getValueInRange(range);

    /** What we use to split the text */
    let splitRegex = /^[A-Z]?[0-9a-z]+|^[\{\};]+/;

    let lineNumbers:number[] = [];
    for (let i = range.startLineNumber; i <= range.endLineNumber; i++) {
        lineNumbers.push(i);
    }

    // keeps track of the next jump point key we can use
    let keysIndex = 0;

    let overlayByLines = utils.selectMany(lineNumbers.map((lineNumber, i) => {
        const string = doc.getLineContent(lineNumber);

        let pos = 0;
        let lineOverlays: JumpyWidget[] = [];
        while (pos !== string.length) {
            var matches = /^[A-Z]?[0-9a-z]+|^[\{\};]+/.exec(string.substr(pos));
            if (matches && matches.length) {
                let matched = matches[0];
                let name = keys[keysIndex++];
                let nodeRendered = <div key={i + ':' + pos} className="monaco-jumpy" style={{ }}>{name}</div>;
                let node = document.createElement('div'); ReactDOM.render(nodeRendered, node);

                let widget: JumpyWidget = {
                    node,
                    line: lineNumber - 1,
                    ch: pos,
                    keys: name,
                    // This is setup later
                    monacoWiget: null,
                }

                lineOverlays.push(widget);
                pos += matched.length;
            } else {
                pos++;
            }
        }

        return lineOverlays;
    }));

    // Add to dom + State
    overlayByLines.forEach(wg => {
        wg.monacoWiget = {
            allowEditorOverflow: true,
            getId: () => getWidgetId(wg),
            getDomNode: () => wg.node,
            getPosition: () => {
                return {
                    position: { lineNumber: wg.line + 1, column: wg.ch + 1 },
                    preference: [
                        monaco.editor.ContentWidgetPositionPreference.ABOVE,
                        monaco.editor.ContentWidgetPositionPreference.BELOW,
                    ]
                }
            }
        }
        editor.addContentWidget(wg.monacoWiget);
    });
    let state = getState(editor);
    state.widgets = overlayByLines;
    state.shown = true;
}

import CommonEditorRegistry = monaco.CommonEditorRegistry;
import EditorActionDescriptor = monaco.EditorActionDescriptor;
import IEditorActionDescriptorData = monaco.IEditorActionDescriptorData;
import ICommonCodeEditor = monaco.ICommonCodeEditor;
import TPromise = monaco.Promise;
import EditorAction = monaco.EditorAction;
import ContextKey = monaco.ContextKey;
import KeyMod = monaco.KeyMod;
import KeyCode = monaco.KeyCode;

class JumpyAction extends EditorAction {

    static ID = 'editor.action.jumpy';

	constructor(descriptor:IEditorActionDescriptorData, editor:ICommonCodeEditor) {
		super(descriptor, editor);
	}

	public run():TPromise<boolean> {
        addOverlay(this.editor as any);
		return TPromise.as(true);
	}
}

CommonEditorRegistry.registerEditorAction(new EditorActionDescriptor(JumpyAction, JumpyAction.ID, 'Jumpy', {
	context: ContextKey.EditorTextFocus,
	primary: KeyMod.CtrlCmd | KeyCode.Enter
}, 'Jumpy'));
