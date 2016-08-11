/**
 * Maintains a ring of stuff that has been copy / cut so you can paste any of them 🌹
 */

/** Imports */
import {replaceSelection, getSelectionOrCurrentLine} from "./monaco/monacoUtils";
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

    index = 0; // Reset seek index

    let selected = getSelectionOrCurrentLine(codeEditor.editor);
    addSelected(selected);
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
    const selection = codeEditor.editor.getSelection();
    let hasSelection = !selection.isEmpty();

    if (!clipboardRing.length) {
        ui.notifyInfoQuickDisappear('Clipboard Ring Empty');
        // TODO: hand over to os command + select if anything gets pasted
        return;
    }

    let item = clipboardRing[index];
    let lines = item.split('\n');
    let lastLineLength = lines[lines.length - 1].length;
    let doc = codeEditor.editor.getModel();

    /** Find the start */
    let from: EditorPosition = {
        line: selection.startLineNumber - 1,
        ch: selection.startColumn - 1
    };

    /** Also add any current selection to the clipboard ring */
    if (hasSelection) {
        let added = addSelected(codeEditor.editor.getModel().getValueInRange(selection)); // Add current selection to the ring
        if (added){
            index++;
        }
    }

    // replace selection (if any) with a new one
    // have the new item selected
    let line = lines.length > 1 ? from.line + (lines.length - 1) : from.line;
    let ch = lines.length > 1 ? lastLineLength : from.ch + item.length;
    let to = { line, ch };
    replaceSelection({editor:codeEditor.editor,newText:item});
    codeEditor.editor.setSelection({
        startLineNumber: from.line + 1,
        startColumn: from.ch + 1,
        endLineNumber: to.line + 1,
        endColumn: to.ch + 1
    });

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
