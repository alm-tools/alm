import React = require("react");
import ReactDOM = require("react-dom");
import Radium = require('radium');
import csx = require('csx');
import {BaseComponent} from "./ui";
import * as ui from "./ui";
import * as utils from "../common/utils";
import * as styles from "./styles/styles";
import * as state from "./state/state";
import * as uix from "./uix";
import * as commands from "./commands/commands";
import CodeMirror = require('codemirror');
import Modal = require('react-modal');
import {server} from "../socket/socketClient";
import {Types} from "../socket/socketContract";
import {modal} from "./styles/styles";
import {Robocop} from "./components/robocop";
import * as docCache from "./codemirror/mode/docCache";
import {CodeEditor} from "./codemirror/codeEditor";
import {RefactoringsByFilePath, Refactoring} from "../common/types";

/* Test:
const styles = {
  box-sizing: border-box;
  outline: none;
  padding: 0;
  margin: 0;
}
 */

// Wire up the code mirror command to come here
CodeMirror.commands[commands.additionalEditorCommands.cssToTs] = (editor: CodeMirror.EditorFromTextArea) => {
    let doc = editor.getDoc();
    let filePath = editor.filePath;
    if (doc.somethingSelected()) {
        var selection = doc.listSelections()[0]; // only the first is formatted at the moment
        let from = selection.anchor;
        let to = selection.head;

        // Calculate result
        const {asLines,asString} = convert(doc.getSelection());

        // Put in new text
        doc.replaceSelection(asString);

        // Auto indent
        const firstLine = selection.head.line;
        for (let i = 0; i < asLines.length; i++) {
            const line = firstLine + i;
            editor.indentLine(line, "smart", true);
        }
    }
    else {
        ui.notifyWarningNormalDisappear('Please select the CSS you want converted to TS and try again 🌹');
    }
}

/**
 * Take a look at :
 * https://github.com/reactjs/react-magic
 * https://www.npmjs.com/package/htmltojsx
 */
import {StyleParser} from "./htmlToJsx/htmlToJsx";
export function convert(content: string): { asLines: string[], asString: string } {
    const style = new StyleParser(content);
    const asLines = style.toJSXString().split(',').map(x => x.trim());
    const asString = asLines.join(',\n');
    return { asLines, asString };
}
