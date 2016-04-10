/**
 * Exists to allow us to pass throught the `original` information around.
 * Code mirror insists on using `CodeMirror.Hint` so we use that
 * But then we put the good stuff in `original` and use it in `render` and `complete` and `move` etc
 */
import * as types from "../../../../common/types";
export interface ExtendedCodeMirrorHint extends CodeMirror.Hint {
    original?: types.Completion;
}
