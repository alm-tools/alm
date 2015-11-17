/**
 * This file uses stuff from *other* components e.g. status bar (so don't import this file in such components)
 * and exposes stuff from them as an API to *some other* components
 */
import * as state from "./state/state";
import {RefactoringsByFilePath} from "../common/types";
import * as utils from "../common/utils";
import * as commands from "./commands/commands";
import CodeMirror = require('codemirror');

/** Cant this in these UI components. Will cause cycles! */
import * as codeEditor from "./codemirror/codeEditor";
import {Code} from "./tabs/codeTab";
import {appTabsContainer} from "./tabs/appTabsContainer";


/**
 * After the app boots up
 */
export function setup() {
    /**
     * Setup all the CM commands to go to the right place
     */
    commands.commandRegistry
        .filter(x=> x.config.context == commands.CommandContext.Editor)
        .forEach(cmd=> {
            cmd.on(() => {
                let editor = API.getFocusedCodeEditorIfAny();
                if (editor && editor.codeMirror) {
                    editor.codeMirror.execCommand(cmd.config.editorCommandName);
                }
            });
        });
}

/**
 * Functions that can be provided as API
 */
export namespace API {

    export function getRefactoringImpact(refactorings: RefactoringsByFilePath) {
        /** lookup all the *file* tabs that are open */
        let alreadyOpen = state.getState().tabs
            .filter(tab=> tab.url.startsWith('file:'));

        let alreadyOpenFilePaths = alreadyOpen.map(x=> utils.getFilePathFromUrl(x.url));
        let wantedFilePaths = Object.keys(refactorings);
        let currentlyClosedFilePaths = wantedFilePaths.filter(x=> !!alreadyOpenFilePaths.find(ao=> ao == x));

        return { alreadyOpenFilePaths, currentlyClosedFilePaths };
    }

    export function applyRefactorings(refactorings: RefactoringsByFilePath) {
        console.log(getRefactoringImpact(refactorings));
    }

    export function getFocusedCodeEditorIfAny(): codeEditor.CodeEditor {
        let {tabs, selectedTabIndex} = state.getState();
        if (tabs.length == 0) return undefined;

        let focusedTab = tabs[selectedTabIndex];
        if (!focusedTab.url.startsWith('file:')) return undefined;

        let focusedTabComponent: Code = appTabsContainer.refs[focusedTab.id] as Code;
        let editor = focusedTabComponent.refs.editor;

        return editor;
    }
}
