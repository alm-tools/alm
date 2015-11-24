/**
 * Singleton that maintains the cursor history
 */
import * as commands from "./commands/commands";
import * as utils from "../common/utils";

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
    tabUrl: string;
    firstContact: EditorPosition; // We move this around for the same cursor hitory entry
    finalContact: EditorPosition; // This is the point that is finally saved for this entry
}

export function previous() {
    console.log('goto previous');
}

export function next() {
    console.log('goto next');
}
