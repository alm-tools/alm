import React = require("react");
import ReactDOM = require("react-dom");
import Radium = require('radium');
import csx = require('csx');
import * as commands from "../commands/commands";
import {inputDialog} from "../dialogs/inputDialog";
import {jumpToLine} from "../codemirror/cmUtils";

import CodeMirror = require('codemirror');
// Wire up the code mirror command to come here
CodeMirror.commands[commands.additionalEditorCommands.goToLine] = (editor: CodeMirror.EditorFromTextArea) => {
    let doc = editor.getDoc();
    let filePath = editor.filePath;

    inputDialog.open({
        header: "Line Number",
        onOk: (value: string) => {
            const line = +value - 1;
            jumpToLine({line,editor});
        },
        onEsc: () => {

        },
        filterValue: '',
    });
}
