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
<!-- Hello world -->
<div class="awesome" style="border: 1px solid red">
  <label for="name">Enter your name: </label>
  <input type="text" id="name" />
</div>
<p>Enter your HTML here</p>
*/

class HtmlToTsxAction extends EditorAction {

	constructor() {
        super({
            id: 'editor.action.htmlToTsx',
			label: 'HTML to TSX',
			alias: 'HTML to TSX',
			precondition: EditorContextKeys.Writable,
        });
	}

    public run(accessor:ServicesAccessor, editor:ICommonCodeEditor): void | TPromise<void> {
        let filePath = editor.filePath;
        let selection = editor.getSelection();
        if (!selection.isEmpty()){
            const indentSize = editor.getModel()._editorOptions ? editor.getModel()._editorOptions.tabSize : 2;
            const oldText = editor.getModel().getValueInRange(selection);
            const newText = convert(oldText, indentSize);
            monacoUtils.replaceSelection({editor, newText});
        }
        else {
            ui.notifyWarningNormalDisappear('Please select the HTML you want converted to TSX and try again 🌹');
        }
	}
}

CommonEditorRegistry.registerEditorAction(new HtmlToTsxAction());


/**
 * Take a look at :
 * https://github.com/reactjs/react-magic
 * https://www.npmjs.com/package/htmltojsx
 */
import {HTMLtoJSX} from "../../htmlToJsx/htmlToJsx";
export function convert(content: string, indentSize: number) {
    var indent = Array(indentSize + 1).join(' ');
    var converter = new HTMLtoJSX({ indent: indent, createClass: false });
    var output = converter.convert(content);
    return output;
}
