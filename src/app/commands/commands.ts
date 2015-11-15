// for keyboard shortcuts watch out for:
// https://github.com/ajaxorg/ace/wiki/Default-Keyboard-Shortcuts
//
// Keyboard shortcut origins:
// c9: cloud9 IDE
// ca: CodeAnywhere
// atom: github atom
// sublime: sublime text
// code: VScode
//---------------------------------------------
//
// This file also sets up CodeMirror keybindings

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
 * The command registry composed of commands that are keyboard only
 */
export let commandRegistry: UICommand[] = [];

/**
 * General purpose UI escape
 */
export var esc = new UICommand({
    keyboardShortcut: 'esc', // atom
    description:"Close any open dialogs and focus back to any open tab",
});
commandRegistry.push(esc);

/**
 * Tabs
 */
export var nextTab = new UICommand({
    keyboardShortcut: 'alt+k',
    description:"Focus on the next tab",
});
commandRegistry.push(nextTab);
export var prevTab = new UICommand({
    keyboardShortcut: 'alt+j',
    description:"Focus on the previous tab",
});
commandRegistry.push(prevTab);
export var closeTab = new UICommand({
    keyboardShortcut: 'alt+w', // c9
    description:"Close current tab",
});
commandRegistry.push(closeTab);
export var undoCloseTab = new UICommand({
    keyboardShortcut: 'shift+alt+w', // Couldn't find IDEs that do this. c9/ca have this bound to close all tabs
    description:"Undo close tab",
});
commandRegistry.push(undoCloseTab);
export var saveTab = new UICommand({
    keyboardShortcut: 'mod+s', // c9
    description:"Save current tab",
});
commandRegistry.push(saveTab);

/**
 * OmniSearch
 */
export var omniFindFile = new UICommand({
    keyboardShortcut: 'mod+p',  // atom,sublime
    description:"Find a file in the working directory",
});
commandRegistry.push(omniFindFile);
export var omniFindCommand = new UICommand({
    keyboardShortcut: 'mod+shift+p', // atom,sublime
    description:"Find a command",
});
commandRegistry.push(omniFindCommand);
export var omniSelectProject = new UICommand({
    keyboardShortcut: 'alt+shift+p', // atom:projectmanager package
    description:"Find and set active project",
});
commandRegistry.push(omniSelectProject);

/**
 * FAR find and replace
 */
export var findAndReplace = new UICommand({
    keyboardShortcut: 'mod+f', // atom,sublime,c9
    description:"Show find and replace dialog",
});
commandRegistry.push(findAndReplace);
export var findNext = new UICommand({
    keyboardShortcut: 'f3', // atom,sublime
    description:"Find the next search result",
});
commandRegistry.push(findNext);
export var findPrevious = new UICommand({
    keyboardShortcut: 'shift+f3', // atom,sublime
    description:"Find the previous search result",
});
commandRegistry.push(findPrevious);
export var replaceNext = new events.TypedEvent<{ newText: string }>();
export var replaceAll = new events.TypedEvent<{ newText: string }>();

/**
 * Error panel
 */
export let toggleErrorMessagesPanel = new UICommand({
    keyboardShortcut: 'mod+shift+m', // code
    description:"Toggle error panel",
});
commandRegistry.push(toggleErrorMessagesPanel);

/**
 * Tree view
 */
export let toggleTreeView = new UICommand({
 keyboardShortcut: 'mod+\\',    // atom
 description:"Toggle file tree",
});
commandRegistry.push(toggleTreeView);

/**
 * General purpose file opening
 */
export var doOpenFile = new events.TypedEvent<{ filePath: string, position?: EditorPosition }>();
export var doOpenOrFocusFile = new events.TypedEvent<{ filePath: string, position?: EditorPosition }>();
export var openFileFromDisk = new UICommand({
    keyboardShortcut: 'mod+o',
    description: 'Open a file present on server disk'
});
commandRegistry.push(openFileFromDisk);

/**
 * Refactoring.
 * Workflow is user presses f2, relevant code paths (editor tree view) check to see if they are in focus.
 * if they are, then they launch relevant secondary commands that are used by `root` to show relevant UI
 */
export var renameVariable = new events.TypedEvent<{ filePath: string, position: number }>();
export var rename = new UICommand({
    keyboardShortcut: 'f2',
    description: 'Rename item selected in view'
});
commandRegistry.push(rename);

/**
 * Registration
 */
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



/**
 *
 * CODE MIRROR
 *
 */

/**
* Straight out of codemirror.js
*/
export var ios = /AppleWebKit/.test(navigator.userAgent) && /Mobile\/\w+/.test(navigator.userAgent);
export var mac = ios || /Mac/.test(navigator.platform);
export var windows = /win/i.test(navigator.platform);
/** Nice display name for the mod by user platform */
export var modName = mac ? '⌘' : 'Ctrl';
let mod = mac ? 'Cmd' : 'Ctrl';

import CodeMirror = require('codemirror');
// keymaps
require('codemirror/keymap/sublime')

// The key is like sublime -> default -> basic
let keyMap = (CodeMirror as any).keyMap;
let basicMap = keyMap.basic;
let defaultMap = keyMap.default;
let sublimeMap = keyMap.sublime;

/** We just add to default keybindings for now */
defaultMap[`${mod}-Space`] = "autocomplete";
