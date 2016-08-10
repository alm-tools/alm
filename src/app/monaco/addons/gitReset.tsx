import {server} from "../../../socket/socketClient";
import * as ui from "../../ui";

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

class GitResetAction extends EditorAction {
	constructor() {
        super({
            id: 'editor.action.gitReset',
			label: 'Git Soft Reset',
			alias: 'Git Soft Reset',
			precondition: EditorContextKeys.Writable,
			kbOpts: {
                kbExpr: EditorContextKeys.TextFocus,
				primary: KeyMod.CtrlCmd | KeyMod.Alt | KeyCode.KEY_Z
			}
        });
	}

	public run(accessor:ServicesAccessor, editor:ICommonCodeEditor): void | TPromise<void> {
        server.gitReset({ filePath: editor.filePath }).then((res) => {
            // console.log(res); // DEBUG
            ui.notifySuccessNormalDisappear('Git soft reset successful');
        });
	}
}

CommonEditorRegistry.registerEditorAction(new GitResetAction());
