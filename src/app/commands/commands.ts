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
import * as utils from "../../common/utils";
import * as csx from "csx";

export enum CommandContext {
    Global,
    Editor
}

interface UICommandConfig {
    keyboardShortcut?: string;
    description: string;
    context: CommandContext;

    // only valid for editor commands
    // we use this to trigger the command on the editor
    editorCommandName?: string;
}

/**
 * The command registry composed of commands that are keyboard only
 */
export let commandRegistry: UICommand[] = [];

/**
 * A command is just an event emitter with some useful properties relevant to the front end command registry
 * such commands cannot have a payload
 */
export class UICommand extends events.TypedEvent<{}>{
    constructor(public config: UICommandConfig) {
        super();
        commandRegistry.push(this);
    }
}

/**
 * General purpose UI escape
 */
export var esc = new UICommand({
    keyboardShortcut: 'esc', // atom
    description: "Close any open dialogs and focus back to any open tab",
    context: CommandContext.Global,
});

/**
 * Tabs
 */
export var nextTab = new UICommand({
    keyboardShortcut: 'alt+k',
    description: "Tabs: Focus on the Next",
    context: CommandContext.Global,
});
export var prevTab = new UICommand({
    keyboardShortcut: 'alt+j',
    description: "Tabs: Focus on the Previous",
    context: CommandContext.Global,
});
export var closeTab = new UICommand({
    keyboardShortcut: 'alt+w', // c9
    description: "Tabs: Close current tab",
    context: CommandContext.Global,
});
export var undoCloseTab = new UICommand({
    keyboardShortcut: 'shift+alt+w', // Couldn't find IDEs that do this. c9/ca have this bound to close all tabs
    description: "Tabs: Undo close tab",
    context: CommandContext.Global,
});
export var saveTab = new UICommand({
    keyboardShortcut: 'mod+s', // c9
    description: "Tabs: Save current tab",
    context: CommandContext.Global,
});
export var closeOtherTabs = new UICommand({
    description: "Tabs: Close other tabs",
    context: CommandContext.Global,
});

/**
 * OmniSearch
 */
export var omniFindFile = new UICommand({
    keyboardShortcut: 'mod+p',  // atom,sublime
    description: "Find a file in the working directory",
    context: CommandContext.Global,
});
export var omniFindCommand = new UICommand({
    keyboardShortcut: 'mod+shift+p', // atom,sublime
    description: "Find a command",
    context: CommandContext.Global,
});
export var omniSelectProject = new UICommand({
    keyboardShortcut: 'alt+shift+p', // atom:projectmanager package
    description: "Find and set active project",
    context: CommandContext.Global,
});

/**
 * FAR find and replace
 */
export var findAndReplace = new UICommand({
    keyboardShortcut: 'mod+f', // atom,sublime,c9
    description: "Show find and replace dialog",
    context: CommandContext.Global,
});
export var findNext = new UICommand({
    keyboardShortcut: 'f3', // atom,sublime
    description: "Find the next search result",
    context: CommandContext.Global,
});
export var findPrevious = new UICommand({
    keyboardShortcut: 'shift+f3', // atom,sublime
    description: "Find the previous search result",
    context: CommandContext.Global,
});
export var replaceNext = new events.TypedEvent<{ newText: string }>();
export var replaceAll = new events.TypedEvent<{ newText: string }>();

/**
 * Error panel
 */
export let toggleMessagePanel = new UICommand({
    keyboardShortcut: 'mod+;', //
    description: "Toggle Message Panel",
    context: CommandContext.Global,
});

export let cycleMessagesPanel = new UICommand({
    keyboardShortcut: 'mod+shift+;', //
    description: "Cycle Message Panel",
    context: CommandContext.Global,
});

/**
 * Editor inline features
 */
export let toggleDoctor = new UICommand({
    keyboardShortcut: "mod+'", //
    description: "Editor: Toggle Doctor",
    context: CommandContext.Global,
});

/**
 * Cursor history
 */
export let previousCursorLocation = new UICommand({
    keyboardShortcut: "mod+u", // CM undo cursor
    description: "Cursor: Previous Cursor Location",
    context: CommandContext.Global,
});
export let nextCursorLocation = new UICommand({
    keyboardShortcut: "mod+shift+u", // CM redo cursor
    description: "Cursor: Next Cursor Location",
    context: CommandContext.Global,
});

/**
 * Tree view
 */
export let toggleTreeView = new UICommand({
    keyboardShortcut: 'mod+\\',    // atom
    description: "Toggle File Tree",
    context: CommandContext.Global,
});

/**
 * General purpose file opening
 */
export var doOpenFile = new events.TypedEvent<{ filePath: string, position?: EditorPosition }>();
export var doOpenOrFocusFile = new events.TypedEvent<{ filePath: string, position?: EditorPosition }>();
export var openFileFromDisk = new UICommand({
    keyboardShortcut: 'mod+o',
    description: 'Open a file present on server disk',
    context: CommandContext.Global,
});

/**
 * Registration
 */
export function register() {

    commandRegistry.forEach(c=> {
        if (c.config.context == CommandContext.Global
            && c.config.keyboardShortcut) {
            Mousetrap.bindGlobal(c.config.keyboardShortcut, function() {
                c.emit({});
                return false;
            });
        }
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

/** Commands *we* authored */
export let additionalEditorCommands = {
    renameVariable: '',
    gotoDefinition: '',
    findReferences: '',
    jumpy: '',
}
utils.stringEnum(additionalEditorCommands);

/** Load CM and keymaps */
import CodeMirror = require('codemirror');
require('codemirror/keymap/sublime')

// The key is like sublime -> default -> basic
let keyMap = (CodeMirror as any).keyMap;
let basicMap = keyMap.basic;
let defaultMap = keyMap.default;
let sublimeMap = keyMap.sublime;

/** Extensions : We just add to highest priority, here sublimeMap */
// Additional key bindings for existing commands
sublimeMap[`${mod}-Space`] = "autocomplete";
// Our additionalEditorCommands
sublimeMap[`F2`] = additionalEditorCommands.renameVariable;
sublimeMap[`${mod}-B`] = additionalEditorCommands.gotoDefinition;
sublimeMap[`Shift-Enter`] = additionalEditorCommands.jumpy;
sublimeMap[`Shift-${mod}-B`] = additionalEditorCommands.findReferences;

delete sublimeMap['Esc']; // Fallback to default `singleSelection` as sublime `singleSelectionTop` is bad
// console.log(csx.extend(basicMap,defaultMap,sublimeMap)); // DEBUG

/** Comamnds we don't support as an editor command */
let unsupportedNames = utils.createMap([
    '...', // General command to ignore some input
    'replace',
    'find', // already list this elsewhere
    'findPrev',
    'findNext',
    'findUnder',
    'findUnderPrevious',
    'indentAuto',
    'replaceAll',

    'transposeChars', // Ctrl + T doesn't work

    // These have been deprecated by using cursor history, from defaultMap
    "undoSelection", // Mod + U
    "redoSelection", // Shift + Mod + U

    "nextBookmark",
    "prevBookmark",
    "toggleBookmark",
    "clearBookmarks",
    "selectBookmarks",

    "delLineLeft", // didn't work

    "setSublimeMark", // don't care
    "setSublimeMark",
    "selectToSublimeMark",
    "deleteToSublimeMark",
    "swapWithSublimeMark",
    "sublimeYank",

    "unfoldAll", // Didn't work
    "findIncremental",
    "findIncrementalReverse",

    "save", // already elsewhere
]);

/** Some commands are duplicated with different keys(e.g redo ctrl y and ctrl + shift + z)*/
let alreadyAddedCommand: utils.TruthTable = {};
/** Keys already added do not fall throught */
let alreadyAddedShortcut: utils.TruthTable = {};

function addEditorMapToCommands(map: { [shortcut: string]: string }) {
    let listed = Object.keys(map).map((k) => ({ shortcut: k, commandName: map[k] }));

    for (let item of listed) {
        // fall through
        if (item.shortcut == 'fallthrough') {
            continue;
        }
        // commands we don't support
        if (unsupportedNames[item.commandName]){
            continue;
        }
        // dupes
        if (alreadyAddedCommand[item.commandName]){
            continue;
        }
        alreadyAddedCommand[item.commandName] = true;
        if (alreadyAddedShortcut[item.shortcut]){
            continue;
        }
        alreadyAddedShortcut[item.shortcut] = true;

        let shortcut = item.shortcut
            .replace(/-/g, '+');

        let commandDisplayName = item.commandName
            .split(/(?=[A-Z])/) // split on uppercase
            .map(x => x[0].toUpperCase() + x.substr(1)) // uppercase first character
            .join(' ');

        new UICommand({
            keyboardShortcut: shortcut,
            description: `Editor: ${commandDisplayName}`,
            context: CommandContext.Editor,
            editorCommandName: item.commandName,
        });
    }
}

// Add in order of priority
addEditorMapToCommands(sublimeMap);
addEditorMapToCommands(defaultMap);
addEditorMapToCommands(basicMap);

//* DEBUG
// console.table(
//     commandRegistry
//         .filter(c=>c.config.context == CommandContext.Editor)
//         .map(c=>({cmd:c.config.description, shortcut:c.config.keyboardShortcut}))
// );
/* DEBUG */
