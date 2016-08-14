/**
 * This file uses stuff from *other* components e.g. status bar (so don't import this file in such components)
 * and exposes stuff from them as an API to *some other* components
 */
import * as state from "./state/state";
import {RefactoringsByFilePath} from "../common/types";
import * as utils from "../common/utils";
import * as commands from "./commands/commands";

import {tabState, TabInstance} from "./tabs/v2/appTabsContainer";
import * as docCache from "./monaco/model/docCache";

/**
 * Cant use it in UI components. Will cause cycles!. Only used as types here
 */
import * as _codeEditor from "./monaco/editor/codeEditor";

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
                let editorTab = API.getFocusedCodeEditorIfAny();
                if (editorTab && editorTab.editor) {
                    const editor = editorTab.editor;
                    const action = editor.getAction(cmd.config.editorCommandName);
                    if (!action) {
                        console.error('Failed to find editor action:', cmd.config);
                    }
                    else {
                        // We need a set timeout as when we trigger from 'command search' the focus changes throws off monaco
                        // e.g. goto line action (which tries to create its own modal) does not work without the set timeout
                        setTimeout(() => {
                            // console.log(action); // DEBUG action details
                            action.run();
                        })
                    }
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
                additionalData: null
            }
            return codeTab;
        });
        tabState.addTabs(tabs);

        // Transact on docs
        docCache.applyRefactoringsToTsDocs(refactorings);
    }

    export function getFocusedCodeEditorIfAny(): _codeEditor.CodeEditor {
        return tabState.getFocusedCodeEditorIfAny();
    }
}
