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
                /** Like ctrl + shift + m which toggles js output */
				primary: KeyMod.CtrlCmd | KeyCode.KEY_M
			}
        });
	}

	public run(accessor:ServicesAccessor, editor:ICommonCodeEditor): void | TPromise<void> {
        const selected = monacoUtils.getSelectionOrCurrentLine(editor);
        compileAndExecuteTs(selected);
	}
}

CommonEditorRegistry.registerEditorAction(new SendToReplAction());


function compileAndExecuteTs(tsCode:string){
    /** TODO: Offload transpile to server and use their options */
    let js = ts.transpile(tsCode);

    /** Remove "use strict"; + newline */
    js = js.substr('"use strict";'.length).trim();

    /** Log to make it look like we typed it */
    console.log(js);
    /** Run it to show the result */
    eval(js);
}
