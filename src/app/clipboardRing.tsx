/**
 * Maintains a ring of clipboard commands
 */

import CodeMirror = require('codemirror');
import * as commands from "./commands/commands";
import * as utils from "../common/utils";
import * as ui from "./ui";
import * as uix from "./uix";

let clipboardRing: string[] = []; // New items at the head of the ring
let maxItems = 10;
let index = 0;
export function addToClipboardRing(mode: 'cut' | 'copy') {
    let codeEditor = uix.API.getFocusedCodeEditorIfAny();
    if (!codeEditor) return;
    let hasSelection = codeEditor.codeMirror.getDoc().somethingSelected();

    if (hasSelection){
        let selected = codeEditor.codeMirror.getDoc().getSelection();
        addSelected(selected);
    }
    else {
        let ranges = copyableRanges(codeEditor.codeMirror);
        let selected = ranges.text.join('\n');
        addSelected(selected);
    }

    function addSelected(selected:string){
        index = 0; // Reset seek index
        clipboardRing.unshift(selected)
        if (clipboardRing.length > maxItems){
            clipboardRing.pop();
        }
        console.log(clipboardRing,index);
    }
}

export function pasteFromClipboardRing() {
    let codeEditor = uix.API.getFocusedCodeEditorIfAny();
    if (!codeEditor) return;
    let hasSelection = codeEditor.codeMirror.getDoc().somethingSelected();

    if (!clipboardRing.length) {
        ui.notifyInfoQuickDisappear('Clipboard Ring Empty');
        // TODO: hand over to os command + select if anything gets pasted
        return;
    }

    let item = clipboardRing[index];
    if (hasSelection){
        console.log(item);
        codeEditor.codeMirror.getDoc().replaceSelection(item);
    }
    else {
        // TODO
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

commands.pasteFromRing.on(()=>{
    pasteFromClipboardRing();
})

/**
 * Straight out of codemirror source code
 */
function copyableRanges(cm):{text:string[],ranges:any} {
  var text = [], ranges = [];
  for (var i = 0; i < cm.doc.sel.ranges.length; i++) {
    var line = cm.doc.sel.ranges[i].head.line;
    var lineRange = {anchor: CodeMirror.Pos(line, 0), head: CodeMirror.Pos(line + 1, 0)};
    ranges.push(lineRange);
    text.push(cm.getRange(lineRange.anchor, lineRange.head));
  }
  return {text: text, ranges: ranges};
};
