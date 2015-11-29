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
import {Robocop} from "./robocop";
import * as docCache from "./codemirror/mode/docCache";
import {CodeEditor} from "./codemirror/codeEditor";
import {RefactoringsByFilePath, Refactoring} from "../common/types";

// Wire up the code mirror command to come here
CodeMirror.commands[commands.additionalEditorCommands.format] = (editor: CodeMirror.EditorFromTextArea) => {
    console.log('here')
    // let cursor = editor.getDoc().getCursor();
    // let filePath = editor.filePath;
    // let position = editor.getDoc().indexFromPos(cursor);
    // server.getReferences({filePath,position}).then((res)=>{
    //     if (res.references.length == 0){
    //         ui.notifyInfoNormalDisappear('No references for item at cursor location');
    //     }
    //     else if (res.references.length == 1) {
    //         // Go directly 🌹
    //         let def = res.references[0];
    //         commands.doOpenOrFocusFile.emit({
    //             filePath: def.filePath,
    //             position: def.position
    //         });
    //     }
    //     else {
    //         let node = document.createElement('div');
    //         ReactDOM.render(<FindReferences data={res}/>, node);
    //     }
    // });
}
