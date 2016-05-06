/**
 * Singleton that maintains the cursor history
 */
import * as commands from "./commands/commands";
import * as utils from "../common/utils";
import {tabState} from "./tabs/v2/appTabsContainer";

/** The current cursor location */
let currentIndex = -1;
let history: CursorHistoryEntry[] = [];
const tooMany = 200;

/** Subscribe to user requests to move around */
commands.previousCursorLocation.on(() => {
    previous();
});
commands.nextCursorLocation.on(() => {
    next();
});

interface CursorHistoryEntry {
    tabId: string;
    tabUrl: string; // for a possible future extension where we open the tabUrl if tabId is no longer valid
    position: EditorPosition;
}

export function previous() {
    currentIndex = utils.rangeLimited({ min: 0, max: history.length - 1, num: currentIndex - 1 });
    let tab = history[currentIndex];
    if (tab) {
        commands.doOpenOrFocusTab.emit({ tabId: tab.tabId, tabUrl: tab.tabUrl, position: tab.position });
    }
    // debug();
}

export function next() {
    currentIndex = utils.rangeLimited({ min: 0, max: history.length - 1, num: currentIndex + 1 });
    let tab = history[currentIndex];
    if (tab) {
        commands.doOpenOrFocusTab.emit({ tabId: tab.tabId, tabUrl: tab.tabUrl, position: tab.position });
    }
    // debug();
}


/**
 * The current tab with id is fetched from state. So all you need is editorPosition
 */
export let addEntry = utils.debounce((editorPosition: EditorPosition) => {
    let selectedTab = tabState.getSelectedTab();

    /**
     * This can happen if we close the tabs too fast (because this function is debounced)
     * Adding a cursor history should not have been called if there is no active tab
     * Adding a cursor history should not have been called if active tab is not a filePath
     */
    if (!selectedTab || !selectedTab.url.startsWith('file://')) {
        return;
    }

    let potentialNewEntry: CursorHistoryEntry = {
        tabId: selectedTab.id,
        tabUrl: selectedTab.url,
        position: editorPosition
    }

    let isSame = (pos1: EditorPosition, pos2: EditorPosition) => pos1.line == pos2.line && pos1.ch == pos2.ch;

    // This prevents us adding a new history for what we already know e.g. when we ask the UI to select a tab
    let testEntry = history[currentIndex];
    if (testEntry && testEntry.tabId == potentialNewEntry.tabId) {
        if (isSame(editorPosition, testEntry.position)) {
            return;
        }
    }
    // if the users action is same as what there would be one before we just take them there in index
    testEntry = history[currentIndex - 1];
    if (testEntry && testEntry.tabId == potentialNewEntry.tabId) {
        if (isSame(editorPosition, testEntry.position)) {
            currentIndex--;
            return;
        }
    }
    // if the users action is same as what there would be one after we just take them there in index
    testEntry = history[currentIndex + 1];
    if (testEntry && testEntry.tabId == potentialNewEntry.tabId) {
        if (isSame(editorPosition, testEntry.position)) {
            currentIndex++;
            return;
        }
    }

    currentIndex++;
    history.splice(currentIndex, 0, potentialNewEntry);

    // If too many:
    if (history.length >= tooMany) {
        // if at end we remove items from the start
        if (currentIndex == history.length - 1) {
            history.shift();
            currentIndex--;
        }
        // if in the middle we remove items from the end
        else {
            history.pop();
        }
    }

    // console.log(`Added tab: ${potentialNewEntry.tabUrl}:${potentialNewEntry.position.line}:${potentialNewEntry.position.ch}`); debug(); // Debug
}, 800);

let debug = function() {
    console.log(history.map(h=> h.tabUrl + ':' + h.position.line + ':' + h.position.ch))
    console.log(currentIndex);
}
// window.debug = debug;
