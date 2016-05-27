import React = require("react");
import ReactDOM = require("react-dom");
import Radium = require('radium');
import csx = require('csx');
import * as ui from "../ui";
import * as utils from "../../common/utils";
import * as commands from "../commands/commands";
import CodeMirror = require('codemirror');

/* Test:
<!-- Hello world -->
<div class="awesome" style="border: 1px solid red">
  <label for="name">Enter your name: </label>
  <input type="text" id="name" />
</div>
<p>Enter your HTML here</p>
*/


// Wire up the code mirror command to come here
CodeMirror.commands[commands.additionalEditorCommands.htmlToTsx] = (editor: CodeMirror.EditorFromTextArea) => {
    let doc = editor.getDoc();
    let filePath = editor.filePath;
    if (doc.somethingSelected()){
        var selection = doc.listSelections()[0]; // only the first is formatted at the moment
        let from = selection.anchor;
        let to = selection.head;
        const indentSize = editor.getOption("indentUnit");
        doc.replaceSelection(convert(doc.getSelection(), indentSize));
    }
    else {
        ui.notifyWarningNormalDisappear('Please select the HTML you want converted to TSX and try again 🌹');
    }
}

/**
 * Take a look at :
 * https://github.com/reactjs/react-magic
 * https://www.npmjs.com/package/htmltojsx
 */
import {HTMLtoJSX} from "../htmlToJsx/htmlToJsx";
export function convert(content: string, indentSize: number) {
    var indent = Array(indentSize + 1).join(' ');
    var converter = new HTMLtoJSX({ indent: indent, createClass: false });
    var output = converter.convert(content);
    return output;
}
