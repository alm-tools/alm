import * as ui from "../../ui";
import * as monacoUtils from "../monacoUtils";
import { server } from "../../../socket/socketClient";
import * as uix from '../../uix';

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
<!-- Hello world -->
<div class="awesome" style="border: 1px solid red">
  <label for="name">Enter your name: </label>
  <input type="text" id="name" />
</div>
<p>Enter your HTML here</p>
*/

class RemoveUnusedImportsAction extends EditorAction {

	constructor() {
        super({
            id: 'editor.action.removeUnusedImports',
			label: 'Remove unused imports',
			alias: 'Remove unused imports',
			precondition: EditorContextKeys.Writable,
        });
	}

    public run(accessor:ServicesAccessor, editor:ICommonCodeEditor): void | TPromise<void> {
        let filePath = editor.filePath;
        let selection = editor.getSelection();
        server.removeUnusedImports({filePath: editor.filePath}).then((refactorings) => {
            // apply refactorings
            // console.log('Apply refactorings:', refactorings); // DEBUG
            uix.API.applyRefactorings(refactorings);
        });
	}
}

CommonEditorRegistry.registerEditorAction(new RemoveUnusedImportsAction());
