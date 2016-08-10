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
{
  foo: 123,
  bar: {
    bas: "Hello",
    baz: {
      qux: "World"
    }
  }
}
*/

class JsonToDts extends EditorAction {

	constructor() {
        super({
            id: 'editor.action.jsonToDts',
			label: 'JSON to TypeScript definition (.d.ts)',
			alias: 'JSON to TypeScript definition (.d.ts)',
			precondition: EditorContextKeys.Writable,
        });
	}

	public run(accessor:ServicesAccessor, editor:ICommonCodeEditor): void | TPromise<void> {
        let filePath = editor.filePath;
        let selection = editor.getSelection();
        if (!selection.isEmpty()){
            const indentSize = editor.getModel()._editorOptions ? editor.getModel()._editorOptions.tabSize : 2;
            const oldText = editor.getModel().getValueInRange(selection);
            const newText = convert(oldText);
            monacoUtils.replaceSelection({editor, newText});
            monacoUtils.format({editor});
        }
        else {
            ui.notifyWarningNormalDisappear('Please select the JavaScript object literal (or json) you want converted to a TypeScript definition and try again 🌹');
        }
	}
}

CommonEditorRegistry.registerEditorAction(new JsonToDts());


/**
 * The beating heart
 */
import {toValidJSON, Json2dts} from "../../json2dts/json2dts";
export function convert(content: string): string {
    try {
        var converter = new Json2dts();
        var text2Obj = JSON.parse(toValidJSON(content));
        if (typeof text2Obj != "string") {
            converter.parse(text2Obj, 'RootJson');
            content = converter.getCode();
        }
        else {
            ui.notifyWarningNormalDisappear('Json2dts Invalid JSON');
        }

    } catch (e) {
        ui.notifyWarningNormalDisappear(`Json2dts Invalid JSON error: ${e}`);
    }
    return content;
}
