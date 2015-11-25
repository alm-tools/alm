/**
 * Singleton that maintains the cursor history
 */
import * as commands from "./commands/commands";
import * as utils from "../common/utils";
import * as state from "./state/state";

/** The current cursor location */
let currentIndex = 0;
let history: CursorHistoryEntry[] = [];
const insignificantLines = 3;

/** Subscribe to user requests to move around */
commands.previousCursorLocation.on(()=>{
    previous();
});
commands.nextCursorLocation.on(()=>{
    next();
});

interface CursorHistoryEntry {
    tabId: string;
    tabUrl: string; // for a possible future extension where we open the tabUrl if tabId is no longer valid
    firstContact: EditorPosition; // We move this around for the same cursor hitory entry
    finalContact: EditorPosition; // This is the point that is finally saved for this entry
}

export function previous() {
    console.log('goto previous');
}

export function next() {
    console.log('goto next');
}


/**
 * The current tab with id is fetched from state. So all you need is editorPosition
 */
export function addEntry(editorPosition: EditorPosition){
    let selectedTab = state.getSelectedTab();
    if (!selectedTab){
        console.error('adding a cursor history should not have been called if there is no active tab');
        return;
    }
    if (!selectedTab.url.startsWith('file://')){
        console.error('adding a cursor history should not have been called if active tab is not a filePath');
        return;
    }

    // let currentEntryIsLast = (history.length - 1) == currentIndex;

    let potentialNewEntry:CursorHistoryEntry = {
        tabId: selectedTab.id,
        tabUrl: selectedTab.url,
        firstContact: editorPosition,
        finalContact: editorPosition,
    }

    // perhaps all we need is to update the final contact of the last entry
    let lastActiveEntry = history[currentIndex];
    if (lastActiveEntry && lastActiveEntry.tabId == potentialNewEntry.tabId) {
        if (editorPosition.line < (lastActiveEntry.firstContact.line + insignificantLines) && editorPosition.line > (lastActiveEntry.firstContact.line - insignificantLines)) {
            lastActiveEntry.finalContact = editorPosition;
            return;
        }
    }

    history.splice(currentIndex,0, potentialNewEntry);
}
