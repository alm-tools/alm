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
export class UICommand extends events.TypedEvent<{}>{
    constructor(public config: UICommandConfig){
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
export var prevTab = new UICommand({
    keyboardShortcut: 'alt+j',
    description:"Focus on the previous tab",
});
export var closeTab = new UICommand({
    keyboardShortcut: 'alt+w', // c9
    description:"Close current tab",
});
export var saveTab = new UICommand({
    keyboardShortcut: 'mod+s', // c9
    description:"Save current tab",
});

/**
 * OmniSearch
 */
export var omniFindFile = new UICommand({
    keyboardShortcut: 'mod+p',  // atom,sublime
    description:"Find a file in the working directory",
});
export var omniFindCommand = new UICommand({
    keyboardShortcut: 'mod+shift+p', // atom,sublime
    description:"Find a command",
});
export var omniSelectProject = new UICommand({
    keyboardShortcut: 'alt+shift+p', // atom:projectmanager package
    description:"Find and set active project",
});

/**
 * FAR find and replace
 */
export var findAndReplace = new UICommand({
    keyboardShortcut: 'mod+f', // atom,sublime,c9
    description:"Show find and replace dialog",
});
export var findNext = new UICommand({
    keyboardShortcut: 'f3', // atom,sublime
    description:"Find the next search result",
});
export var findPrevious = new UICommand({
    keyboardShortcut: 'shift+f3', // atom,sublime
    description:"Find the previous search result",
});
export var replaceNext = new events.TypedEvent<{ newText: string }>();
export var replaceAll = new events.TypedEvent<{ newText: string }>();

/**
 * Error panel
 */
export var toggleErrorMessagesPanel = new UICommand({
    keyboardShortcut: 'mod+shift+m', // code
    description:"Toggle error panel",
});


/**
 * General purpose file opening
 */
export var doOpenFile = new events.TypedEvent<{ filePath: string, position?: EditorPosition }>();
export var didOpenFile = new events.TypedEvent<{ filePath: string }>();
export var doOpenOrFocusFile = new events.TypedEvent<{ filePath: string, position?: EditorPosition }>();


/**
 * The command registry composed of commands that are keyboard only
 */
export var commandRegistry: UICommand[] = [
    esc,
    nextTab,
    prevTab,
    closeTab,
    saveTab,
    omniFindFile,
    omniFindCommand,
    omniSelectProject,
    findAndReplace,
    findNext,
    findPrevious,
    toggleErrorMessagesPanel,
];

export function register() {

    commandRegistry.forEach(c=>{
        Mousetrap.bindGlobal(c.config.keyboardShortcut, function() {
            c.emit({});
            return false;
        });
    });

    // Commands with multiple key bindings
    // enable at some point
    Mousetrap.bindGlobal('mod+h', function() { // atom,sublime,c9
        findAndReplace.emit({});
        return false;
    });
}
