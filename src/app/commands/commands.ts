// for keyboard shortcuts watch out for:
// https://github.com/ajaxorg/ace/wiki/Default-Keyboard-Shortcuts
//
// c9: means keyboard shortcut is consistent with cloud9 ide so don't change these

import * as Mousetrap from "mousetrap";
require("mousetrap/plugins/global-bind/mousetrap-global-bind");
import * as events from "../../common/events";

interface UICommandConfig {
    keyboardShortcut: string;
    description: string;
}

/**
 * A command is just an event emitter with some useful properties relevant to the front end command registry
 * such commands cannot have a payload
 */
class UICommand extends events.TypedEvent<{}>{
    constructor(public config?: UICommandConfig){
        super();
    }
}

/**
 * General purpose UI escape
 */
export var esc = new UICommand({
    keyboardShortcut: 'esc', // atom
    description:"Close any open dialogs and focus back to any open tab",
});


/**
 * Tabs
 */
export var nextTab = new UICommand({
    keyboardShortcut: 'alt+k',
    description:"Focus on the next tab",
});
export var prevTab = new UICommand();
export var closeTab = new UICommand();
export var saveTab = new UICommand();

/**
 * OmniSearch
 */
export var findFile = new UICommand();
export var findCommand = new UICommand();
export var selectProject = new UICommand();

/**
 * General purpose file opening
 */
export var doOpenFile = new events.TypedEvent<{ filePath: string, position?: EditorPosition }>();
export var didOpenFile = new events.TypedEvent<{ filePath: string }>();
export var doOpenOrFocusFile = new events.TypedEvent<{ filePath: string, position?: EditorPosition }>();

/**
 * FAR find and replace
 */
export var findAndReplace = new UICommand();
export var findNext = new UICommand();
export var findPrevious = new UICommand();
export var replaceNext = new events.TypedEvent<{ newText: string }>();
export var replaceAll = new events.TypedEvent<{ newText: string }>();

/**
 * Error panel
 */
export var toggleErrorMessagesPanel = new UICommand();

/**
 * The command registry composed of commands that are keyboard only
 */
export var commandRegistry: UICommand[] = [
    nextTab,
    prevTab,
    closeTab,
    saveTab,
    findFile,
    findCommand,
    selectProject,
    findAndReplace,
    findNext,
    findPrevious,
    toggleErrorMessagesPanel,
];

export function register() {

    /** General utility */
    Mousetrap.bindGlobal('esc', function() {
        esc.emit({});
        return false;
    });

    /** Tabs */
    Mousetrap.bindGlobal('alt+k', function() {
        nextTab.emit({});
        return false;
    });
    Mousetrap.bindGlobal('alt+j', function() {
        prevTab.emit({});
        return false;
    });
    Mousetrap.bindGlobal('alt+w', function() { // c9
        closeTab.emit({});
        return false;
    });
    Mousetrap.bindGlobal('mod+s', function() { // c9
        saveTab.emit({});
        return false;
    });

    /**
     * OmniSearch
     */
    Mousetrap.bindGlobal('mod+p', function() { // atom,sublime
        findFile.emit({});
        return false;
    });
    Mousetrap.bindGlobal('mod+shift+p', function() { // atom,sublime
        findCommand.emit({});
        return false;
    });

    /**
     * Project
     */
    Mousetrap.bindGlobal('alt+shift+p', function() { // atom:ProjectManager
        selectProject.emit({});
        return false;
    });

    /**
     * Find and replace
     */
    Mousetrap.bindGlobal('mod+f', function() { // atom,sublime,c9
        findAndReplace.emit({});
        return false;
    });
    Mousetrap.bindGlobal('mod+h', function() { // atom,sublime,c9
        findAndReplace.emit({});
        return false;
    });
    Mousetrap.bindGlobal('f3', function() { // atom,sublime
        findNext.emit({});
        return false;
    });
    Mousetrap.bindGlobal('shift+f3', function() { // atom,sublime
        findPrevious.emit({});
        return false;
    });

    /**
     * Error panel
     */
     Mousetrap.bindGlobal('mod+shift+m', function() { // code
         toggleErrorMessagesPanel.emit({});
         return false;
     });
}
