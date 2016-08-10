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

class CssToTsAction extends EditorAction {

    constructor() {
		super({
            id: 'editor.action.cssToTs',
			label: 'CSS to TS',
			alias: 'CSS to TS',
			precondition: EditorContextKeys.Writable,
        });
	}

	public run(accessor:ServicesAccessor, editor:ICommonCodeEditor): void | TPromise<void> {
        let filePath = editor.filePath;
        let selection = editor.getSelection();
        if (!selection.isEmpty()){
            const oldText = editor.getModel().getValueInRange(selection);
            const {asLines, asString} = convert(oldText);
            // put in the new thing
            monacoUtils.replaceSelection({editor, newText: asString});
            // format the new thing
            monacoUtils.format({ editor });
        }
        else {
            ui.notifyWarningNormalDisappear('Please select the CSS you want converted to TS and try again 🌹');
        }
	}
}

CommonEditorRegistry.registerEditorAction(new CssToTsAction());

/**
 * Take a look at :
 * https://github.com/reactjs/react-magic
 * https://www.npmjs.com/package/htmltojsx
 */
import {StyleParser} from "../../htmlToJsx/htmlToJsx";
export function convert(content: string): { asLines: string[], asString: string } {
    const style = new StyleParser(content);
    const asLines = style.toJSXString().split(',').map(x => x.trim());
    const asString = asLines.join(',\n');
    return { asLines, asString };
}
