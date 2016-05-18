/**
 * Maintains a ring of stuff that has been copy / cut so you can paste any of them 🌹
 */

/** Imports */
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

    if (hasSelection) {
        let selected = codeEditor.codeMirror.getDoc().getSelection();
        index = 0; // Reset seek index
        addSelected(selected);
    }
    else {
        let ranges = copyableRanges(codeEditor.codeMirror);
        let selected = ranges.text.join('\n');
        index = 0; // Reset seek index
        addSelected(selected);
    }
}

function addSelected(selected: string): boolean {
    // Just prevents the item being added right next to each other
    let before = utils.rangeLimited({ num: index - 1, min: 0, max: clipboardRing.length - 1, loopAround: true });
    let after = utils.rangeLimited({ num: index + 1, min: 0, max: clipboardRing.length - 1, loopAround: true });
    if (clipboardRing[before] === selected
        || clipboardRing[after] === selected
        // Cause we will remove last if we get to max items, check second last too
        || clipboardRing[maxItems - 2] === selected) {
        return false;
    }

    clipboardRing.unshift(selected)
    if (clipboardRing.length > maxItems) {
        clipboardRing.pop();
    }
    // console.log(clipboardRing,index); // DEBUG
    return true;
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
    let lines = item.split('\n');
    let lastLineLength = lines[lines.length - 1].length;
    let doc = codeEditor.codeMirror.getDoc();

    /** Find the start */
    let from: EditorPosition;
    if (hasSelection) {
        let selection = doc.listSelections()[0];
        from = CodeMirror.cmpPos(selection.anchor, selection.head) >= 0 ? selection.head : selection.anchor;

        let added = addSelected(doc.getSelection()); // Add current selection to the ring
        if (added){
            index++;
        }
    }
    else {
        from = doc.getCursor();
    }

    // replace selection (if any) with a new one
    // have the new item selected
    let line = lines.length > 1 ? from.line + (lines.length - 1) : from.line;
    let ch = lines.length > 1 ? lastLineLength : from.ch + item.length;
    let to = { line, ch };
    doc.replaceSelection(item);
    doc.setSelection(from, to);

    // update the index (and loop around)
    index = utils.rangeLimited({ num: index + 1, min: 0, max: clipboardRing.length - 1, loopAround: true });
}

commands.copy.on(() => {
    addToClipboardRing('copy');
});

commands.cut.on(() => {
    addToClipboardRing('cut');
});

commands.pasteFromRing.on(() => {
    pasteFromClipboardRing();
})

/**
 * Straight out of codemirror source code
 */
function copyableRanges(cm): { text: string[], ranges: any } {
    var text = [], ranges = [];
    for (var i = 0; i < cm.doc.sel.ranges.length; i++) {
        var line = cm.doc.sel.ranges[i].head.line;
        var lineRange = { anchor: CodeMirror.Pos(line, 0), head: CodeMirror.Pos(line + 1, 0) };
        ranges.push(lineRange);
        text.push(cm.getRange(lineRange.anchor, lineRange.head));
    }
    return { text: text, ranges: ranges };
};
