/** Imports */
import * as commands from "../../commands/commands";
import * as React from "react";
import * as ReactDOM from "react-dom";
import * as utils from "../../../common/utils";
import * as events from "../../../common/events";
import * as monacoUtils from "../monacoUtils";

/** Load jumpy css */
require('./jumpy.css');

/** Editor type */
type Editor = monaco.editor.ICodeEditor;
import Range = monaco.Range;

/**
 * Where we store out state
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
    const key = String.fromCharCode(i)
    lowerCharacters.push(key);
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
    disposible: events.CompositeDisposible;
    widgets?: JumpyWidget[];
    key1?: string;
    key2?: string;
}

/** Gets or creates a state */
export function getState(editor: Editor): JumpyState {
    return editor._jumpyState || (editor._jumpyState = { widgets: [], shown: false, disposible: new events.CompositeDisposible() });
}

/**
 *
 * The bulk of the logic
 *
 */
function addOverlay(editor: Editor) {
    clearAnyOverlay(editor);

    /** Create the overlays */
    const state = createOverlays(editor);

    /** A clear overlay function just for this editor 🌹 */
    const clearOverlay = () => clearAnyOverlay(editor);

    // Subscribe to esc to clear
    state.disposible.add(commands.esc.on(clearOverlay));

    /** Subscribe to jump */
    state.disposible.add(editor.onKeyDown((e: monaco.IKeyboardEvent) => {

        if (e.keyCode >= monaco.KeyCode.KEY_A && e.keyCode <= monaco.KeyCode.KEY_Z) {
            // We always prevent ascii chars as the user might have mistyped some keystroke
            e.preventDefault();
            e.stopPropagation();

            // The character representation
            const char = String.fromCharCode(e.browserEvent.which).toLowerCase();
            // console.log({char}); // DEBUG

            let state = getState(editor);
            if (!state.key1) {
                state.key1 = char;

                // remove not matched
                state.widgets.filter(wg=>!wg.keys.startsWith(state.key1)).forEach(wg => editor.removeContentWidget(wg.monacoWiget));

                // only keep matched
                state.widgets = state.widgets.filter(wg=>wg.keys.startsWith(state.key1));

                // remove all if nothing matched
                if (state.widgets.length == 0){
                    clearOverlay();
                }
            }
            else {
                let total = state.key1 + char;
                let matched = state.widgets.find(wg=>wg.keys == total);
                if (matched) {
                    const position = {lineNumber: matched.line + 1, column: matched.ch + 1};
                    editor.setPosition(position);
                    // We actually allow them to jump one line before / one line after
                    // So calling this isn't a bad idea. No-op if the line is in view ;)
                    editor.revealLine(position.lineNumber);
                }
                clearOverlay();
            }
        }
        else {
            clearOverlay();
        }
    }));

    /** Best to exit on these conditions too */
    state.disposible.add(editor.onDidScrollChange(clearOverlay));
    state.disposible.add(editor.onDidChangeCursorSelection(clearOverlay));
    state.disposible.add(editor.onDidBlurEditor(clearOverlay));
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
        state.disposible.dispose();
    }
}

/**
 * Renders the overlays on the editor
 */
function createOverlays(editor: Editor) {
    // The model
    let doc = editor.getModel();

    // DEBUG
    // console.log(editor);
    // window.foo = editor;

    // The text in viewport
    const range: Range = monacoUtils.getVisibleLines(editor);
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
        while (pos < string.length) {
            var matches = splitRegex.exec(string.substr(pos));
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
                // we want some minimum space between matches
                pos += Math.max(matched.length,2);
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

    // Setup state and return
    let state = getState(editor);
    state.widgets = overlayByLines;
    state.shown = true;
    state.disposible = new events.CompositeDisposible();
    return state;
}

import CommonEditorRegistry = monaco.CommonEditorRegistry;
import IEditorActionDescriptorData = monaco.IEditorActionDescriptorData;
import ICommonCodeEditor = monaco.ICommonCodeEditor;
import TPromise = monaco.Promise;
import EditorAction = monaco.EditorAction;
import KeyMod = monaco.KeyMod;
import KeyCode = monaco.KeyCode;
import ServicesAccessor = monaco.ServicesAccessor;
import IActionOptions = monaco.IActionOptions;
import EditorContextKeys = monaco.EditorContextKeys;

class JumpyAction extends EditorAction {

	constructor() {
        super({
            id: 'editor.action.jumpy',
            label: 'Jumpy',
            alias: 'Jumpy',
            precondition: EditorContextKeys.Focus,
            kbOpts: {
                kbExpr: EditorContextKeys.TextFocus,
                primary: KeyMod.CtrlCmd | KeyCode.Enter
            }
        });

	}

	public run(accessor:ServicesAccessor, editor:ICommonCodeEditor): void | TPromise<void> {
        addOverlay(editor as any);
	}
}

CommonEditorRegistry.registerEditorAction(new JumpyAction());
