import React = require("react");
import ReactDOM = require("react-dom");
import Radium = require('radium');
import csx = require('csx');
import * as ui from "../ui";
import * as utils from "../../common/utils";
import * as commands from "../commands/commands";
import CodeMirror = require('codemirror');
import Modal = require('react-modal');
import {Types} from "../../socket/socketContract";

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


// Wire up the code mirror command to come here
CodeMirror.commands[commands.additionalEditorCommands.jsonToDts] = (editor: CodeMirror.EditorFromTextArea) => {
    let doc = editor.getDoc();
    let filePath = editor.filePath;
    if (doc.somethingSelected()){
        doc.replaceSelection(convert(doc.getSelection()));
    }
    else {
        ui.notifyWarningNormalDisappear('Please select the JavaScript object literal (or json) you want converted to a TypeScript definition and try again 🌹');
    }
}

/**
 * The beating heart
 */
import {toValidJSON, Json2dts} from "../json2dts/json2dts";
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
