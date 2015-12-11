/**
 * Maintains a ring of clipboard commands
 */

import CodeMirror = require('codemirror');
import * as commands from "./commands/commands";
import * as utils from "../common/utils";
import * as ui from "./ui";
import * as uix from "./uix";

let clipboardRing: string[] = [];
let index = 0;
export function addToClipboardRing(){
    let codeEditor = uix.API.getFocusedCodeEditorIfAny();
    if (codeEditor) {
        let selected = codeEditor.codeMirror.getDoc().getSelection();
        console.log(selected);
        // clipboardRing.push(selected)
    }
}

export function pasteFromClipboardRing(){
    if (!clipboardRing.length){
        ui.notifyInfoQuickDisappear('Clipboard Ring Empty');
        return;
    }
    // TODO: replace seletion with a new one
    // have the new item selected
    // update the index (and loop around)
}

commands.copy.on(()=>{
    addToClipboardRing();
});

commands.cut.on(()=>{
    addToClipboardRing();
});
