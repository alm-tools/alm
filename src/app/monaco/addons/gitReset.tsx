import {server} from "../../../socket/socketClient";
import * as ui from "../../ui";

import CommonEditorRegistry = monaco.CommonEditorRegistry;
import EditorActionDescriptor = monaco.EditorActionDescriptor;
import IEditorActionDescriptorData = monaco.IEditorActionDescriptorData;
import ICommonCodeEditor = monaco.ICommonCodeEditor;
import TPromise = monaco.Promise;
import EditorAction = monaco.EditorAction;
import ContextKey = monaco.ContextKey;
import KeyMod = monaco.KeyMod;
import KeyCode = monaco.KeyCode;

class GitResetAction extends EditorAction {

    static ID = 'editor.action.gitReset';

	constructor(descriptor:IEditorActionDescriptorData, editor:ICommonCodeEditor) {
		super(descriptor, editor);
	}

	public run():TPromise<boolean> {
        server.gitReset({ filePath: this.editor.filePath }).then((res) => {
            // console.log(res); // DEBUG
            ui.notifySuccessNormalDisappear('Git soft reset successful');
        })

		return TPromise.as(true);
	}
}

CommonEditorRegistry.registerEditorAction(new EditorActionDescriptor(GitResetAction, GitResetAction.ID, 'Git Soft Reset', {
	context: ContextKey.EditorTextFocus,
	primary: KeyMod.CtrlCmd | KeyMod.Alt | KeyCode.KEY_Z
}));
