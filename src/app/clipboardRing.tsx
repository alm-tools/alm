/**
 * Maintains a ring of clipboard commands
 */

import CodeMirror = require('codemirror');
import * as commands from "./commands/commands";
import * as utils from "../common/utils";
import * as ui from "./ui";
import * as uix from "./uix";

let clipboardRing: string[] = [];
let maxItems = 10;
let index = 0;
export function addToClipboardRing(mode: 'cut' | 'copy') {
    let codeEditor = uix.API.getFocusedCodeEditorIfAny();
    if (codeEditor) {
        if (mode === 'copy') {
            let selected = codeEditor.codeMirror.getDoc().getSelection();
            addSelected(selected);
        }
        else if (mode === 'cut') {
            let hasSelection = codeEditor.codeMirror.getDoc().somethingSelected();
            if (hasSelection){
                let selected = codeEditor.codeMirror.getDoc().getSelection();
                addSelected(selected);
            }
            else {
                // Cut in code mirror calls `cm.setSelections` in `prepareCopyCut`.
                // We can use that get the line selection
                codeEditor.lastSelection.once((res)=>{
                    addSelected(res.text);
                });
            }
        }
    }

    function addSelected(selected:string){
        clipboardRing.push(selected)
        if (clipboardRing.length > maxItems){
            clipboardRing.shift();
        }
        // console.log(selected);
    }
}

export function pasteFromClipboardRing() {
    if (!clipboardRing.length) {
        ui.notifyInfoQuickDisappear('Clipboard Ring Empty');
        return;
    }
    // TODO: replace seletion with a new one
    // have the new item selected
    // update the index (and loop around)
}

commands.copy.on(() => {
    addToClipboardRing('copy');
});

commands.cut.on(() => {
    addToClipboardRing('cut');
});
