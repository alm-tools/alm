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
for (let i = 'a'.charCodeAt(0); i <= 'z'.charCodeAt(0); i++) {
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
    keys: string;
}

interface JumpyState {
    shown: boolean;
    widgets?: JumpyWidget[];
    key1?: string;
    key2?: string;
}

export function getState(cm:Editor): JumpyState{
    return (cm as any).state.jumpy || ((cm as any).state.jumpy = { widgets: [], shown: false });
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
                    keys: name,
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
    let state = getState(cm);
    state.widgets = overlayByLines;
    state.shown = true;
}

function clearAnyOverlay(cm: Editor) {
    let state = getState(cm);
    if (state.shown) {
        state.widgets.forEach(wg => wg.node.parentElement.removeChild(wg.node));
        state.widgets = [];
        state.key1 = null;
        state.key2 = null;
        state.shown = false;
        (cm as any).off('beforeChange', handleBeforeChange);
        (cm as any).off('scroll', clearAnyOverlay);
    }
}

function addOverlay(cm: Editor) {
    clearAnyOverlay(cm);
    createOverlays(cm);

    // Subscribe to esc *once* to clear
    commands.esc.once(()=>{
        clearAnyOverlay(cm);
    });
    (cm as any).on('beforeChange', handleBeforeChange);
    (cm as any).on('scroll', clearAnyOverlay);
}

function handleBeforeChange(cm: Editor, changeObj: { from: CodeMirror.Position, to: CodeMirror.Position, text: string, origin: string, cancel: () => void}) {
    // Note:
    // setTimeout becuase from docs : you may not do anything changes the document or its visualization

    changeObj.cancel(); // don't propogate further

    let state = getState(cm);
    if (!state.key1) {
        state.key1 = changeObj.text;
        setTimeout(()=>{
            // remove not matched
            state.widgets.filter(wg=>!wg.keys.startsWith(state.key1)).forEach(wg => wg.node.parentElement.removeChild(wg.node));

            // only keep matched
            state.widgets = state.widgets.filter(wg=>wg.keys.startsWith(state.key1));

            // remove all if nothing matched
            if (state.widgets.length == 0){
                clearAnyOverlay(cm);
            }
        });
    }
    else {

        setTimeout(()=>{
            let total = state.key1 + changeObj.text;
            let matched = state.widgets.find(wg=>wg.keys == total);
            if (matched){
                cm.getDoc().setCursor({ line: matched.line, ch: matched.ch });
            }
            clearAnyOverlay(cm);
        })
    }
}

// Wire up the code mirror command to come here
CodeMirror.commands[commands.additionalEditorCommands.jumpy] = (cm: CodeMirror.EditorFromTextArea) => {
    let doc = cm.getDoc();
    let cursor = cm.getDoc().getCursor();
    let filePath = cm.filePath;
    let position = cm.getDoc().indexFromPos(cursor);
    doc.setSelection(cursor,cursor); // clear selection otherwise we end up replacing the selection
    addOverlay(cm);
}
