import * as ui from "./ui";
import * as state from "./state/state";
import * as commands from "./commands/commands";
import * as utils from "../common/utils";
import {tabState, tabStateChanged} from "./tabs/v2/appTabsContainer";
import { errorsCache } from "./globalErrorCacheClient";
import * as types from '../common/types';

/** Interfaces used by GotoHistory feature */
interface GotoPosition {
    filePath: string;
    line: number;
    col: number;
}
interface TabWithGotoPositions {
    lastIndex?: number;
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

const reloadErrorsInOpenFiles = utils.debounce(() => {
    let errorsFlattened = tabState.errorsByFilePathFiltered().errorsFlattened;
    errorsInOpenFiles.members = errorsFlattened.map(x => {
        return { filePath: x.filePath, line: x.from.line, col: x.from.ch }
    });
}, 500);

errorsCache.errorsDelta.on(reloadErrorsInOpenFiles);
state.subscribeSub(state => state.errorsDisplayMode, reloadErrorsInOpenFiles);
state.subscribeSub(state => state.errorsFilter, reloadErrorsInOpenFiles);
tabStateChanged.on(reloadErrorsInOpenFiles);


/**
 * Use this to keep the *lastPosition* in error list in sync
 * A bit fugly because there might be multiple errors in the same location but works good enough
 */
export function gotoError(error: types.CodeError){
    commands.doOpenOrFocusFile.emit({filePath:error.filePath,position:error.from});
    errorsInOpenFiles.lastIndex = indexOf(errorsInOpenFiles.members,(member)=>{
        return member.filePath == error.filePath && member.line == error.from.line && member.col == error.from.ch;
    });
}

/** This *must* always be set */
var activeList: TabWithGotoPositions = errorsInOpenFiles;

function gotoItemInActiveList(index: number){
    let member = activeList.members[index];
    activeList.lastIndex = index;
    commands.doOpenOrFocusFile.emit({filePath:member.filePath,position:{line:member.line,ch:member.col}});
}

/**
 * Uses `activeList` to go to the next error or loop back
 * Storing `lastIndex` with the list allows us to be lazy elsewhere and actively find the element here
 */
function findCurrentIndexInList(): number {
    // Early exit if no members
    if (!activeList.members.length) {
        ui.notifyInfoNormalDisappear('No members in active go-to list');
        return -1;
    }
    // If we don't have a lastPosition then first is the last position
    if (!activeList.lastIndex || activeList.lastIndex == -1)
        return 0;
    // If we have gone too far, then goto last
    if (activeList.lastIndex >= activeList.members.length)
        return activeList.members.length - 1;

    // Index is good. Return that :)
    return activeList.lastIndex;
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

    gotoItemInActiveList(nextIndex);
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

    gotoItemInActiveList(previousIndex);
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
