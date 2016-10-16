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
// This file also sets up Monaco keybindings

import * as Mousetrap from "mousetrap";
require("mousetrap/plugins/global-bind/mousetrap-global-bind");
import * as events from "../../common/events";
import * as utils from "../../common/utils";
import * as types from "../../common/types";

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
    keyboardShortcut: 'mod+f8', // atom
    description: "Main Panel : Goto next error in project",
    context: CommandContext.Global,
});

export var gotoPrevious = new UICommand({
    keyboardShortcut: 'mod+shift+f8', // atom
    description: "Main Panel : Goto previous error in project",
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
export var closeAllTabs = new UICommand({
    description: "Tabs: Close all tabs",
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
    keyboardShortcut: 'mod+o',  // atom,sublime
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
    keyboardShortcut: 'mod+shift+h',
    description: "Find Symbols (Hieroglyphs) in active project",
    context: CommandContext.Global,
});
export var omniProjectSourcefile = new UICommand({
    keyboardShortcut: 'mod+p', //
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
});
export var doOpenTestResultsView = new UICommand({
    description: "Test Results View",
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
    keyboardShortcut: 'mod+shift+o',
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
 * Common configuration file creations
 */
export const createEditorconfig = new UICommand({
    description: 'Create a .editorconfig',
    context: CommandContext.Global,
});

/**
 * Settings stuff
 */
export const openSettingsFile = new UICommand({
    description: 'Open settings file',
    context: CommandContext.Global
})

/**
 * Git
 */
export const gitAddAllCommitAndPush = new UICommand({
    description: 'Git: Add all, Commit and Push',
    context: CommandContext.Global
})
export const gitFetchLatestAndRebase = new UICommand({
    description: 'Git: Fetch + Pull latest, and rebase any local commits',
    context: CommandContext.Global
})
/** Whenever status might be invalid */
export const gitStatusNeedsRefresh = new events.TypedEvent<{}>();

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
    // TODO: mon
    // renameVariable: '',
    // gotoDefinition: '',
    // findReferences: '',
    // format: '',
    // toggleBlaster: '',
    // gitSoftResetFile: '',
    // goToLine: '',
    // quickFix: '',
    // gotoTypeScriptSymbol: '',
}
utils.stringEnum(additionalEditorCommands);

/** Load editor actions + keymaps */
import {getActions}  from "./monacoActionLoader";
const actions = getActions();
// console.log(actions); // DEBUG

// TODO: mon
// Our additionalEditorCommands
// sublimeMap[`F2`] = additionalEditorCommands.renameVariable;
// sublimeMap[`${mod}-B`] = additionalEditorCommands.gotoDefinition;
// sublimeMap[`Shift-${mod}-B`] = additionalEditorCommands.findReferences;
// sublimeMap[`${mod}-Alt-L`] = additionalEditorCommands.format;
// sublimeMap[`${mod}-Alt-O`] = additionalEditorCommands.toggleBlaster;
// sublimeMap[`${mod}-Alt-Z`] = additionalEditorCommands.gitSoftResetFile;
// sublimeMap[`${mod}-G`] = additionalEditorCommands.goToLine;
// sublimeMap[`${mod}-Y`] = additionalEditorCommands.gotoTypeScriptSymbol;
// sublimeMap[`Alt-Enter`] = additionalEditorCommands.quickFix;

if (mac) {
    // TODO: mon
    // Prevent the browser from handling the CMD + SHIFT + [ (or ]) which monaco uses for fold / unfold
}

function addEditorMapToCommands(command: types.MonacoActionInformation) {
    new UICommand({
        keyboardShortcut: command.kbd,
        description: `Editor: ${command.label}`,
        context: CommandContext.Editor,
        editorCommandName: command.id,
    });
}
actions.forEach(addEditorMapToCommands)

/**
 * This is a consolidation of the `file edited` and `file changed on disk`
 */
export const fileContentsChanged = new events.TypedEvent<{ filePath: string }>();

/**
 * Setup toasts to hide on esc
 * Note: this is done here instead of `ui` as some commands depend on `ui` and having depend on commands causes a circular dependency
 */
import * as toastr from "toastr";
esc.on(() => {
    toastr.clear();
});

/* DEBUG
console.table(
    commandRegistry
        .filter(c=>c.config.context == CommandContext.Editor)
        .map(c=>({cmd:c.config.description, shortcut:c.config.keyboardShortcut}))
);
/* DEBUG */

/**
 * Mac (the chrome browser in mac) doesn't have *cmd + y* (common redo).
 * Instead it opens the browser history by mistake.
 * So we redirect it to redo for any open editor :)
 */
Mousetrap.bindGlobal('mod+y',function(event:any){
    // If the focus is on editor than monaco already handles it
    // If we made it till here .... then ....
    // Prevent default
    return false;
});
/**
 * Mac: Cmd + H at the wrong place hides the window.
 */
Mousetrap.bindGlobal('mod+h', function(event: any) {
    // If the focus is on editor than monaco already handles it
    // If we made it till here .... then ....
    // Prevent default
    return false;
});
