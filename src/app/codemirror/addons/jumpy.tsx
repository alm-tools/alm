import React = require("react");
import ReactDOM = require("react-dom");
import Radium = require('radium');
import csx = require('csx');
import * as utils from "../../../common/utils";
import * as styles from "../../styles/styles";
import * as state from "../../state/state";
import * as ui from "../../ui";
import * as uix from "../../uix";
import * as commands from "../../commands/commands";
import CodeMirror = require('codemirror');
import Modal = require('react-modal');

require('./jumpy.css');

let lowerCharacters = [];
for (let i = 'a'.charCodeAt(0); i < 'z'.charCodeAt(0); i++) {
    lowerCharacters.push(String.fromCharCode(i));
}
let keys: string[] = []
for (let c1 of lowerCharacters) {
    for (let c2 of lowerCharacters) {
        keys.push(c1 + c2);
    }
}

type Editor = CodeMirror.EditorFromTextArea;

interface JumpyState {
    overlay?: CodeMirror.Mode<any>;
}

function getState(editor:Editor): JumpyState{
    return (editor as any).state.jumpy || ((editor as any).state.jumpy = {});
}

function createOverlay(editor: Editor) {
    let {from,to} = editor.getViewport();

    interface OverlayState {
        lineNumber: number;
    }

    let index = 0;

    return {
        name: 'jumpyOverlayMode',
        token: function(stream: CodeMirror.StringStream) {
            var matches = /^[A-Z]?[0-9a-z]+|^[\{\};]+/.exec(stream.string.substr(stream.pos));
            if (matches && matches.length) {
                let matched = matches[0];
                stream.pos += matched.length;
                console.log('here', matched, stream.pos);
                return "jumpy jumpy-" + keys[index++];
            } else {
                stream.next();
            }
        }
    };
}

function clearAnyOverlay(cm: Editor) {
    if (getState(cm).overlay) {
        cm.removeOverlay(getState(cm).overlay);
        getState(cm).overlay = null;
    }
}

function addOverlay(cm: Editor) {
    clearAnyOverlay(cm);
    let overlay = getState(cm).overlay = createOverlay(cm);
    cm.addOverlay(overlay);
}

// Wire up the code mirror command to come here
CodeMirror.commands[commands.additionalEditorCommands.jumpy] = (editor: CodeMirror.EditorFromTextArea) => {
    let cursor = editor.getDoc().getCursor();
    let filePath = editor.filePath;
    let position = editor.getDoc().indexFromPos(cursor);

    // Subscribe to esc *once* to clear
    commands.esc.once(()=>{
        clearAnyOverlay(editor);
    });
    addOverlay(editor);
}
