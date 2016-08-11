import * as ui from "../../ui";
import * as monacoUtils from "../monacoUtils";

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

/* Test:
const styles = {
  box-sizing: border-box;
  outline: none;
  padding: 0;
  margin: 0;
}
*/

class SendToReplAction extends EditorAction {

    constructor() {
		super({
            id: 'editor.action.sendToRepl',
			label: 'Send To REPL',
			alias: 'Send To REPL',
			precondition: EditorContextKeys.Writable,
            kbOpts: {
                kbExpr: EditorContextKeys.TextFocus,
                /** From ELM https://github.com/sbrink/vscode-elm/blob/b40b73249f284515fd398ac388ba7f480644e26c/package.json#L119-L123 */
				primary: KeyMod.Alt | KeyCode.US_SLASH
			}
        });
	}

	public run(accessor:ServicesAccessor, editor:ICommonCodeEditor): void | TPromise<void> {
        const selected = monacoUtils.getSelectionOrCurrentLine(editor);
        compileAndExecuteTs(selected);
	}
}

CommonEditorRegistry.registerEditorAction(new SendToReplAction());


/** TODO: Offload transpile to server and use their options */
function compileAndExecuteTs(tsCode:string){
    const js = ts.transpile(tsCode);
    console.log(js);
    eval(js);
}
