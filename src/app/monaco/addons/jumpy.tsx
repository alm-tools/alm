/** Imports */
import * as commands from "../../commands/commands";
/** Load jumpy css */
require('./jumpy.css');

/** Editor type */
type Editor = monaco.editor.ICommonCodeEditor;

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
    // TODO:
    // clearAnyOverlay(editor);
    createOverlays(editor);

    // Subscribe to esc *once* to clear
    commands.esc.once(() => {
        // TODO:
        // clearAnyOverlay(cm);
    });
    // TODO:
    // (cm as any).on('beforeChange', handleBeforeChange);
    // (cm as any).on('scroll', clearAnyOverlay);
}

/**
 * Renders the overlays on the editor
 */
function createOverlays(editor: Editor) {
    // Set as showing
    getState(editor).shown = true;

    // The model
    let doc = editor.getModel();

    /* TODO
    // The text in viewport
    let {from, to} = editor;
    let text = editor.getDoc().getRange({ line: from, ch: 0 }, { line: to, ch: 0 });


    let splitRegex = /^[A-Z]?[0-9a-z]+|^[\{\};]+/;

    let scrollInfo = editor.getScrollInfo();
    let topLine = editor.coordsChar({ top: scrollInfo.top, left: scrollInfo.left }, 'local').line;
    let bottomLine = editor.coordsChar({ top: scrollInfo.top + scrollInfo.clientHeight, left: scrollInfo.left }, 'local').line + 1;
    // console.log(scrollInfo,bottomLine-topLine);
    let lines = [];
    for (let i = 0; i < bottomLine - topLine; i++) {
        lines.push(i);
    }

    let keysIndex = 0;

    let overlayByLines = utils.selectMany(lines.map((x) => {
        let trueLine = x + topLine;
        let string = doc.getLine(trueLine);

        let pos = 0;
        let lineOverlays: JumpyWidget[] = [];
        while (pos !== string.length) {
            var matches = /^[A-Z]?[0-9a-z]+|^[\{\};]+/.exec(string.substr(pos));
            if (matches && matches.length) {
                let matched = matches[0];
                let name = keys[keysIndex++];
                let nodeRendered = <div key={x + ':' + pos} className="cm-jumpy" style={{ top: '-1rem' } as any}>{name}</div>;
                let node = document.createElement('div'); ReactDOM.render(nodeRendered, node);

                let widget: JumpyWidget = {
                    node,
                    line: trueLine,
                    ch: pos,
                    keys: name,
                }

                lineOverlays.push(widget);
                pos += matched.length;
            } else {
                pos++;
            }
        }

        return lineOverlays;
    }));

    // Add to CM + State
    overlayByLines.forEach(wg => editor.addWidget({ line: wg.line, ch: wg.ch }, wg.node, false));
    let state = getState(editor);
    state.widgets = overlayByLines;
    state.shown = true;
    */
}

import CommonEditorRegistry = monaco.internal.CommonEditorRegistry;
import EditorActionDescriptor = monaco.internal.EditorActionDescriptor;
import IEditorActionDescriptorData = monaco.editor.IEditorActionDescriptorData;
import ICommonCodeEditor = monaco.editor.ICommonCodeEditor;
import TPromise = monaco.Promise;

/**
 * TODO: mon
 * this needs to come from monaco
 */
class EditorAction{
    constructor(descriptor:IEditorActionDescriptorData, editor:ICommonCodeEditor) {
	}
}

class JumpyAction extends EditorAction {

    static ID = 'editor.action.jumpy';

	constructor(descriptor:IEditorActionDescriptorData, editor:ICommonCodeEditor) {
		super(descriptor, editor);
	}

	public run():TPromise<boolean> {
        // TODO: mon
		// var commands:ICommand[] = [];
		// var selections = this.editor.getSelections();
        //
		// for (var i = 0; i < selections.length; i++) {
		// 	commands.push(new CopyLinesCommand(selections[i], this.down));
		// }
        //
		// this.editor.executeCommands(this.id, commands);

		return TPromise.as(true);
	}
}

// TODO: mon
// export this overload
// CommonEditorRegistry.registerEditorAction(new EditorActionDescriptor(JumpyAction, JumpyAction.ID, 'Jumpy'), {
// 	context: ContextKey.EditorTextFocus,
// 	primary: KeyMod.CtrlCmd | KeyMod.Shift | KeyCode.KEY_D
// }, 'Jumpy');
