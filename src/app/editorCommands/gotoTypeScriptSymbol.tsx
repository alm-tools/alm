import React = require("react");
import ReactDOM = require("react-dom");
import Radium = require('radium');
import csx = require('csx');
import * as commands from "../commands/commands";
import {server} from "../../socket/socketClient";
import {inputDialog} from "../dialogs/inputDialog";
import {jumpToLine} from "../codemirror/cmUtils";

import CodeMirror = require('codemirror');
// Wire up the code mirror command to come here
CodeMirror.commands[commands.additionalEditorCommands.gotoTypeScriptSymbol] = (editor: CodeMirror.EditorFromTextArea) => {
    let doc = editor.getDoc();
    let filePath = editor.filePath;

    server.getNavigateToItemsForFilePath({filePath}).then((res)=>{
        console.log(res);
    });
}
