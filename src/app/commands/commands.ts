/**
 * Defines:
 * commands / command registry / code editor commands
 */

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
    Editor,
    TreeView,
}

interface UICommandConfig {
    keyboardShortcut?: string;
    description: string;
    context: CommandContext;

    // only valid for editor commands
    // we use this to trigger the command on the editor
    editorCommandName?: string;

    /** allow the browser default to still happen */
    allowDefault?: boolean;
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
 * BAS
 */
// export const bas = new UICommand({
//     description: "BAS: I map this to whatever command I am currently testing",
//     context: CommandContext.Global,
// });


/**
 * General purpose UI escape
 */
export var esc = new UICommand({
    keyboardShortcut: 'esc', // atom
    description: "Close any open dialogs and focus back to any open tab",
    context: CommandContext.Global,
});

/**
 * Active list
 */
export var gotoNext = new UICommand({
    keyboardShortcut: 'f8', // atom
    description: "Active List: Goto next position",
    context: CommandContext.Global,
});

export var gotoPrevious = new UICommand({
    keyboardShortcut: 'shift+f8', // atom
    description: "Active List: Goto previous position",
    context: CommandContext.Global,
});

/**
 * Tabs
 */
export var nextTab = new UICommand({
    keyboardShortcut: 'alt+k',
    description: "Tabs: Focus on the Next Tab",
    context: CommandContext.Global,
});
export var prevTab = new UICommand({
    keyboardShortcut: 'alt+j',
    description: "Tabs: Focus on the Previous Tab",
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
export const jumpToTab = new UICommand({
    keyboardShortcut: 'mod+shift+enter',
    description: "Tabs: Jump to tab",
    context: CommandContext.Global,
});
export var duplicateTab = new UICommand({
    description: "Tabs: Duplicate",
    context: CommandContext.Global,
});
export var duplicateWindow = new UICommand({
    description: "Window: Duplicate in a new browser window",
    context: CommandContext.Global,
});

/**
 * Build / output js
 */
export var sync = new UICommand({
    keyboardShortcut: 'shift+f6',
    description: "TypeScript: Sync",
    context: CommandContext.Global,
});
export var build = new UICommand({
    keyboardShortcut: 'f6',
    description: "TypeScript: Build",
    context: CommandContext.Global,
});
export var toggleOutputJS = new UICommand({
    keyboardShortcut: 'mod+shift+m', // atom
    description: "TypeScript: Toggle output js file",
    context: CommandContext.Global,
});

/**
 * Tab indexing
 * // c9, chrome, atom
 */
export var gotoTab1 = new UICommand({
    keyboardShortcut: 'mod+1',
    description: "Tabs: Goto Tab 1",
    context: CommandContext.Global,
});
export var gotoTab2 = new UICommand({
    keyboardShortcut: 'mod+2',
    description: "Tabs: Goto Tab 2",
    context: CommandContext.Global,
});
export var gotoTab3 = new UICommand({
    keyboardShortcut: 'mod+3',
    description: "Tabs: Goto Tab 3",
    context: CommandContext.Global,
});
export var gotoTab4 = new UICommand({
    keyboardShortcut: 'mod+4',
    description: "Tabs: Goto Tab 4",
    context: CommandContext.Global,
});
export var gotoTab5 = new UICommand({
    keyboardShortcut: 'mod+5',
    description: "Tabs: Goto Tab 5",
    context: CommandContext.Global,
});
export var gotoTab6 = new UICommand({
    keyboardShortcut: 'mod+6',
    description: "Tabs: Goto Tab 6",
    context: CommandContext.Global,
});
export var gotoTab7 = new UICommand({
    keyboardShortcut: 'mod+7',
    description: "Tabs: Goto Tab 7",
    context: CommandContext.Global,
});
export var gotoTab8 = new UICommand({
    keyboardShortcut: 'mod+8',
    description: "Tabs: Goto Tab 8",
    context: CommandContext.Global,
});
export var gotoTab9 = new UICommand({
    keyboardShortcut: 'mod+9',
    description: "Tabs: Goto Tab 9",
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
export var omniProjectSymbols = new UICommand({
    keyboardShortcut: 'mod+shift+y', //
    description: "Find sYmbols in active project",
    context: CommandContext.Global,
});
export var omniProjectSourcefile = new UICommand({
    keyboardShortcut: 'mod+alt+y', //
    description: "Find Source File in active project",
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
export var findAndReplaceMulti = new UICommand({
    keyboardShortcut: 'mod+shift+f', // atom,sublime,c9
    description: "Show find and replace in files",
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
export var replacePrevious = new events.TypedEvent<{ newText: string }>();
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
 * Documentation features
 */
export let toggleDoctor = new UICommand({
    keyboardShortcut: "mod+'", //
    description: "Editor: Toggle Doctor",
    context: CommandContext.Global,
});
export var toggleDocumentationBrowser = new UICommand({
    keyboardShortcut: 'mod+shift+\'', // Same as doctor with Shift
    description: "Documentation Browser: Open",
    context: CommandContext.Global,
});
export var doOpenUmlDiagram = new UICommand({
    description: "UML Class diagram",
    context: CommandContext.Global,
});
export var toggleSemanticView = new UICommand({
    description: "Toggle Semantic View",
    context: CommandContext.Global,
});
export const launchTsFlow = new UICommand({
    description: "Launch TypeScript flow based programming",
    context: CommandContext.Global,
})

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
 * Clipboard Ring
 */
export var copy = new UICommand({
    keyboardShortcut: 'mod+c', // atom
    description: "Copy",
    context: CommandContext.Global,
    allowDefault: true
});
export var cut = new UICommand({
    keyboardShortcut: 'mod+x', // atom
    description: "Cut",
    context: CommandContext.Global,
    allowDefault: true
});
export var pasteFromRing = new UICommand({
    keyboardShortcut: 'mod+shift+v', // VS
    description: "PasteFromRing",
    context: CommandContext.Global,
    allowDefault: false
});

/**
 * Tree view
 */
export let treeViewToggle = new UICommand({
    keyboardShortcut: 'mod+\\',    // atom
    description: "Tree View: Toggle",
    context: CommandContext.Global,
});
export let treeViewRevealActiveFile = new UICommand({
    keyboardShortcut: 'mod+shift+\\',    // atom
    description: "Tree View: Reveal Active File",
    context: CommandContext.Global,
});
export let treeViewFocus = new UICommand({
    keyboardShortcut: 'mod+0',    // atom, code
    description: "Tree View: Focus",
    context: CommandContext.Global,
});
export let treeAddFile = new UICommand({
    keyboardShortcut: 'a',    // atom
    description: "Tree View: Add File",
    context: CommandContext.TreeView,
});
export let treeAddFolder = new UICommand({
    keyboardShortcut: 'shift+a',    // atom
    description: "Tree View: Add Folder",
    context: CommandContext.TreeView,
});

export let treeDuplicateFile = new UICommand({
    keyboardShortcut: 'd',    // atom
    description: "Tree View: Duplicate File|Folder",
    context: CommandContext.TreeView,
});
export let treeMoveFile = new UICommand({
    keyboardShortcut: 'm',    // atom
    description: "Tree View: Move File|Folder",
    context: CommandContext.TreeView,
});
/** Rename is same as `move` but people want to search for it */
export let treeRenameFile = new UICommand({
    keyboardShortcut: 'r',
    description: "Tree View: Rename File|Folder",
    context: CommandContext.TreeView,
});
export let treeDeleteFile = new UICommand({
    keyboardShortcut: 'del',    // atom
    description: "Tree View: Delete File|Folder",
    context: CommandContext.TreeView,
});
export let treeOpenInExplorerFinder = new UICommand({
    keyboardShortcut: 'o',    // natural
    description: "Tree View: Open folder in explorer / finder",
    context: CommandContext.TreeView,
});

/**
 * General purpose file opening
 * These are handled in appTabsContainer at the moment
 */
export var doOpenFile = new events.TypedEvent<{ filePath: string, position?: EditorPosition }>();
export var doOpenOrFocusFile = new events.TypedEvent<{ filePath: string, position?: EditorPosition }>();
export var openFileFromDisk = new UICommand({
    keyboardShortcut: 'mod+o',
    description: 'Open a file present on server disk',
    context: CommandContext.Global,
});
/** needed by cursor history */
export var doOpenOrFocusTab = new events.TypedEvent<{ tabId: string, tabUrl: string, position: EditorPosition }>();
/** needed by file tree */
export var closeFilesDirs = new events.TypedEvent<{ files: string[], dirs: string[] }>();
/** Needed by file tree, activates the tab but doesn't change focus away from tree view */
export var doOpenOrActivateFileTab = new events.TypedEvent<{ filePath: string }>();
/** Needed to toggle output js file. We toggle and also do not steal focus */
export var doToggleFileTab = new events.TypedEvent<{ filePath: string }>();

/**
 * Other tab types
 */
export var doOpenDependencyView = new UICommand({
    description: 'Open Dependency View',
    context: CommandContext.Global,
});
export var doOpenASTView = new UICommand({
    description: 'Open AST View',
    context: CommandContext.Global,
});
export var doOpenASTFullView = new UICommand({
    description: 'Open AST-Full View',
    context: CommandContext.Global,
});

/**
 * Git commands
 */
export var gitStatus = new UICommand({
    description: 'Git Status',
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
                return !!c.config.allowDefault;
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

/**
 * Commands *we* authored.
 * For new commands there are the following more places you need to update:
 * - Commands that have keyboard shortcuts just add them to the keymap below
 * - Otherwise they are registered manually at the bottom of the file
 */
export let additionalEditorCommands = {
    renameVariable: '',
    gotoDefinition: '',
    findReferences: '',
    jumpy: '',
    format: '',
    toggleBlaster: '',
    gitSoftResetFile: '',
    htmlToTsx: '',
    cssToTs: '',
    jsonToDts: '',
    goToLine: '',
    quickFix: '',
    gotoTypeScriptSymbol: '',
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
sublimeMap[`Ctrl-Space`] = "autocomplete";
// Our additionalEditorCommands
sublimeMap[`F2`] = additionalEditorCommands.renameVariable;
sublimeMap[`${mod}-B`] = additionalEditorCommands.gotoDefinition;
sublimeMap[`Shift-Enter`] = additionalEditorCommands.jumpy;
sublimeMap[`Shift-${mod}-B`] = additionalEditorCommands.findReferences;
sublimeMap[`${mod}-Alt-L`] = additionalEditorCommands.format;
sublimeMap[`${mod}-Alt-O`] = additionalEditorCommands.toggleBlaster;
sublimeMap[`${mod}-Alt-Z`] = additionalEditorCommands.gitSoftResetFile;
sublimeMap[`${mod}-G`] = additionalEditorCommands.goToLine;
sublimeMap[`${mod}-Y`] = additionalEditorCommands.gotoTypeScriptSymbol;
sublimeMap[`Alt-Enter`] = additionalEditorCommands.quickFix;

// we have our own cursor history
delete defaultMap[`${mod}-U`];
delete defaultMap[`Shift-${mod}-U`];
// Fallback to default `singleSelection` as sublime `singleSelectionTop` is bad e.g. when we do inline rename
delete sublimeMap['Esc'];
// Cmd + U conflicted with our cursor history
delete sublimeMap[`${mod}-K ${mod}-U`];
delete sublimeMap[`${mod}-K ${mod}-L`];
// Because alt+u didn't work on mac
sublimeMap['Alt-='] = "upcaseAtCursor";
sublimeMap['Alt--'] = "downcaseAtCursor";
// Conflicts with jump to tab
delete sublimeMap['Shift-Cmd-Enter'];
delete sublimeMap['Shift-Ctrl-Enter'];
// Conflicts with our js output toggle
// was selectBetweenBrackets
sublimeMap['Shift-Cmd-M'] = "...";
sublimeMap['Shift-Ctrl-M'] = "...";
// sort lines : is too close to `f8`. Delete from keymap but still list.
delete sublimeMap['F9'];
new UICommand({
    description: 'Editor: Sort Lines',
    context: CommandContext.Editor,
    editorCommandName: 'sortLines',
})

// Swap line should also come with indent
// + use VSCode shortcuts as they are consistent across win/mac
const origSwapLineUp = CodeMirror.commands['swapLineUp'];
const origSwapLineDown = CodeMirror.commands['swapLineDown'];
const indentCurrentLine = (cm) => {
    if (cm.isReadOnly()) return CodeMirror.Pass;
    const line = cm.getCursor().line;
    cm.indentLine(line);
}
CodeMirror.commands['swapLineUp'] = function(cm){
    origSwapLineUp.apply(this,arguments);
    indentCurrentLine(cm);
}
CodeMirror.commands['swapLineDown'] = function(cm){
    origSwapLineDown.apply(this,arguments);
    indentCurrentLine(cm);
}
sublimeMap['Alt-Up'] = 'swapLineUp';
sublimeMap['Alt-Down'] = 'swapLineDown';

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
// For our custom *editor* commands that don't have a keymap entry
// We add them manually
new UICommand({
    description: 'Editor: HTML to TSX',
    context: CommandContext.Editor,
    editorCommandName: additionalEditorCommands.htmlToTsx,
})
new UICommand({
    description: 'Editor: CSS to TS',
    context: CommandContext.Editor,
    editorCommandName: additionalEditorCommands.cssToTs,
})
new UICommand({
    description: 'Editor: JSON to TS definition',
    context: CommandContext.Editor,
    editorCommandName: additionalEditorCommands.jsonToDts,
})

/**
 * This is a consolidation of the `file edited` and `file changed on disk`
 */
export const fileContentsChanged = new events.TypedEvent<{ filePath: string }>();


/* DEBUG
console.table(
    commandRegistry
        .filter(c=>c.config.context == CommandContext.Editor)
        .map(c=>({cmd:c.config.description, shortcut:c.config.keyboardShortcut}))
);
/* DEBUG */
