import * as ui from "./ui";
import * as state from "./state/state";
import * as commands from "./commands/commands";
import * as utils from "../common/utils";

/** Interfaces used by GotoHistory feature */
interface GotoPosition {
    filePath: string;
    line: number;
    col: number;
}
interface TabWithGotoPositions {
    lastPosition?: GotoPosition; // TODO: make this index based :( as that will work with items getting deleted
    members: GotoPosition[];
}

commands.gotoNext.on(() => {
    gotoNext();
});
commands.gotoPrevious.on(() => {
    gotoPrevious();
});

var errorsInOpenFiles: TabWithGotoPositions = { members: [] };
var buildOutput: TabWithGotoPositions = { members: [] };
var referencesOutput: TabWithGotoPositions = { members: [] };

state.subscribeSub(state => state.errorsByFilePath,(errorsByFilePath)=>{
    let errorsFlattened = utils.selectMany(Object.keys(errorsByFilePath).map(x=>errorsByFilePath[x]));
    errorsInOpenFiles.members = errorsFlattened.map(x=>{
        return {filePath:x.filePath,line: x.from.line, col: x.from.ch}
    });
})

/** TODO: use this to keep the *lastPosition* in error list in sync */
export function gotoError(error:CodeError){

}

/** This *must* always be set */
var activeList: TabWithGotoPositions = errorsInOpenFiles;

function gotoLine(filePath: string, line: number, col: number, list: TabWithGotoPositions) {
    commands.doOpenOrFocusFile.emit({filePath,position:{line,ch:col}});
    list.lastPosition = { filePath, line, col };
}

/**
 * Uses `activeList` to go to the next error or loop back
 * Storing `lastPosition` with the list allows us to be lazy elsewhere and actively find the element here
 */
function findCurrentIndexInList(): number {
    // Early exit if no members
    if (!activeList.members.length) {
        ui.notifyInfoNormalDisappear('No members in active go-to list');
        return -1;
    }
    // If we don't have a lastPosition then first is the last position
    if (!activeList.lastPosition)
        return 0;

    var lastPosition = activeList.lastPosition;
    var index = indexOf(activeList.members, (item) => item.filePath == lastPosition.filePath && item.line == lastPosition.line);

    // if the item has since been removed go to 0
    if (index == -1) {
        return 0;
    }
    return index;
}

/** Uses `activeList` to go to the next position or loop back */
export function gotoNext() {
    var currentIndex = findCurrentIndexInList();
    if (currentIndex == -1) return;

    var nextIndex = currentIndex + 1;
    // If next is == length then loop to zero
    if (nextIndex == activeList.members.length) {
        nextIndex = 0;
    }

    var next = activeList.members[nextIndex];
    gotoLine(next.filePath, next.line, next.col, activeList);
}

/** Uses `activeList` to go to the previous position or loop back */
export function gotoPrevious() {
    var currentIndex = findCurrentIndexInList();
    if (currentIndex == -1) return;

    var previousIndex = currentIndex - 1;
    // If next is == -1 then loop to length
    if (previousIndex == -1) {
        previousIndex = activeList.members.length - 1;
    }

    var previous = activeList.members[previousIndex];
    gotoLine(previous.filePath, previous.line, previous.col, activeList);
}


/**
 * Utility Return index of element in an array based on a filter
 */
function indexOf<T>(items: T[], filter: (item: T) => boolean): number {
    for (var i = 0; i < items.length; i++) {
        if (filter(items[i])) {
            return i;
        }
    }
    return -1;
}
