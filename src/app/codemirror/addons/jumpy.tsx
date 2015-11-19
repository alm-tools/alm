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

interface JumpyWidget{
    node: HTMLDivElement;
    line: number;
    ch: number;
    key1: string;
    key2: string;
}

interface JumpyState {
    widgets?: JumpyWidget[];
}

function getState(cm:Editor): JumpyState{
    return (cm as any).state.jumpy || ((cm as any).state.jumpy = { widgets: [] });
}

function createOverlays(cm: Editor) {
    let doc = cm.getDoc();
    let {from,to} = cm.getViewport();
    let text = cm.getDoc().getRange({line:from,ch:0},{line:to,ch:0});
    let splitRegex = /^[A-Z]?[0-9a-z]+|^[\{\};]+/;

    let scrollInfo = cm.getScrollInfo();
    let topLine = cm.coordsChar({top:scrollInfo.top,left: scrollInfo.left}, 'local').line;
    let bottomLine = cm.coordsChar({ top: scrollInfo.top + scrollInfo.clientHeight, left: scrollInfo.left }, 'local').line + 1;
    // console.log(scrollInfo,bottomLine-topLine);
    let lines = [];
    for (let i = 0; i < bottomLine - topLine; i++) {
        lines.push(i);
    }

    let keysIndex = 0;

    let overlayByLines = utils.selectMany(lines.map((x)=>{
        let trueLine = x + topLine;
        let string = doc.getLine(trueLine);

        let pos = 0;
        let lineOverlays:JumpyWidget[] = [];
        while (pos !== string.length) {
            var matches = /^[A-Z]?[0-9a-z]+|^[\{\};]+/.exec(string.substr(pos));
            if (matches && matches.length) {
                let matched = matches[0];
                let name = keys[keysIndex++];
                let nodeRendered = <div key={x+':'+pos} className="cm-jumpy" style={{top:'-1rem'} as any}>{name}</div>;
                let node = document.createElement('div'); ReactDOM.render(nodeRendered,node);

                let widget: JumpyWidget = {
                    node,
                    line: trueLine,
                    ch: pos,
                    key1: name[0],
                    key2: name[1],
                }

                lineOverlays.push(widget);
                pos += matched.length;
            } else {
                pos++;
            }
        }

        return lineOverlays;
    }));

    // Add to CM + State
    overlayByLines.forEach(wg=>cm.addWidget({line:wg.line,ch:wg.ch},wg.node,false));
    getState(cm).widgets = overlayByLines;
}

function clearAnyOverlay(cm: Editor) {
    if (getState(cm).widgets.length) {
        getState(cm).widgets.forEach(wg => wg.node.parentElement.removeChild(wg.node));
        getState(cm).widgets = [];
    }
}

function addOverlay(cm: Editor) {
    clearAnyOverlay(cm);
    createOverlays(cm);
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
