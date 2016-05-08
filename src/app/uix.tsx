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
import {tabState, TabInstance} from "./tabs/v2/appTabsContainer";
import * as docCache from "./codemirror/mode/docCache";

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

    export function getClosedVsOpenFilePaths(filePaths: string[]) {
        /** lookup all the *file* tabs that are open */
        let allOpen = tabState.getOpenFilePaths();
        let alreadyOpenFilePaths = filePaths.filter(fp => allOpen.indexOf(fp) != -1);
        let currentlyClosedFilePaths = filePaths.filter(fp => allOpen.indexOf(fp) == -1);

        return { alreadyOpenFilePaths, currentlyClosedFilePaths };
    }

    export function applyRefactorings(refactorings: RefactoringsByFilePath) {
        let {currentlyClosedFilePaths} = getClosedVsOpenFilePaths(Object.keys(refactorings));

        let tabs = currentlyClosedFilePaths.map(fp => {
            let codeTab: TabInstance = {
                id: utils.createId(),
                url: `file://${fp}`,
            }
            return codeTab;
        });
        tabState.addTabs(tabs);

        // Transact on docs
        docCache.applyRefactoringsToTsDocs(refactorings);
    }

    export function getFocusedCodeEditorIfAny(): codeEditor.CodeEditor {
        return tabState.getFocusedCodeEditorIfAny();
    }
}
