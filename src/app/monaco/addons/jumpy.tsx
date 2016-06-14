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
    // createOverlays(cm);

    // Subscribe to esc *once* to clear
    commands.esc.once(() => {
        // TODO:
        // clearAnyOverlay(cm);
    });
    // TODO:
    // (cm as any).on('beforeChange', handleBeforeChange);
    // (cm as any).on('scroll', clearAnyOverlay);
}
