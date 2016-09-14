import {CompositeDisposible} from "../../../common/events";
import {cast, server} from "../../../socket/socketClient";
import {Types} from "../../../socket/socketContract";
import * as utils from "../../../common/utils";
import * as state from "../../state/state";
import * as commands from "../../commands/commands";

require('./quickFix.css');
type Editor = monaco.editor.ICodeEditor;

const quickFixClassName = 'monaco-quickfix';
const quickFixDecorationOptions: monaco.editor.IModelDecorationOptions = {
    glyphMarginClassName: quickFixClassName,
    isWholeLine: true,
    hoverMessage: 'QuickFixes available. Click to select.'
};

export function setup(editor: Editor): { dispose: () => void } {
    // if (cm) return { dispose: () => null }; // DEBUG : while the feature isn't complete used to disable it

    let disposed = false;
    let lastWidget: monaco.editor.IContentWidget | null = null;
    // The key quick fix get logic
    const refreshQuickFixes = () => {
        if (disposed) return;
        // Clear any previous attempt
        editor._lastQuickFixInformation = null;
        if (lastWidget) {
            editor.removeContentWidget(lastWidget);
            lastWidget = null;
        }

        // If not active project return
        if (!state.inActiveProjectFilePath(editor.filePath)) {
            return;
        }

        const indentSize = editor.getModel().getOptions().tabSize;
        const pos = editor.getPosition();
        const position = editor.getModel().getOffsetAt(pos);

        // query the server with live analysis
        server.getQuickFixes({
            indentSize,
            filePath: editor.filePath,
            position
        }).then(res => {
            // If no longer relevant abort and wait for a new call.
            const newPos = editor.getPosition();
            if (!newPos.equals(pos)) return;

            /** Only add the decoration if there are some fixes available */
            if (res.fixes.length) {
                editor._lastQuickFixInformation = { res, position };

                // Setup the marker. Note: Must be done outside `getDomNode` to make it idempotent
                var marker = document.createElement("div");
                marker.className = quickFixClassName;
                marker.title = `Quick fixes available`;
                marker.innerHTML = "💡";
                marker.onclick = () => {
                    editor.getAction(QuickFixAction.ID).run();
                }

                lastWidget = {
                    allowEditorOverflow: false,
                    getId: () => 'quickfix',
                    getDomNode: () => marker,
                    getPosition: () => {
                        return {
                            position: { lineNumber: pos.lineNumber, column: editor.getModel().getLineContent(pos.lineNumber).length + 1 },
                            preference: [
                                monaco.editor.ContentWidgetPositionPreference.EXACT,
                            ]
                        }
                    }
                };
                editor.addContentWidget(lastWidget);
            }
        });
    };

    const refreshQuickFixesDebounced = utils.debounce(refreshQuickFixes, 1000);

    const disposible = new CompositeDisposible();
    disposible.add(editor.onDidFocusEditor(refreshQuickFixesDebounced));
    disposible.add(editor.onDidChangeModelContent(refreshQuickFixesDebounced));
    disposible.add(editor.onDidChangeCursorPosition(refreshQuickFixesDebounced));
    disposible.add(cast.activeProjectConfigDetailsUpdated.on(() => {
        refreshQuickFixesDebounced();
    }));
    disposible.add({
        dispose(){
            disposed = true;
        }
    })
    return disposible;
}

/**
 * We add the quickfix information to the editor to allow easy invocation from an action
 */
declare global {
    namespace monaco {
        namespace editor {
            export interface ICommonCodeEditor {
                _lastQuickFixInformation?: {
                    res: Types.GetQuickFixesResponse,
                    position: number
                }
            }
        }
    }
}


import CommonEditorRegistry = monaco.CommonEditorRegistry;
import IEditorActionDescriptorData = monaco.IEditorActionDescriptorData;
import ICommonCodeEditor = monaco.ICommonCodeEditor;
import TPromise = monaco.Promise;
import EditorAction = monaco.EditorAction;
import KeyMod = monaco.KeyMod;
import KeyCode = monaco.KeyCode;
import ServicesAccessor = monaco.ServicesAccessor;
import IActionOptions = monaco.IActionOptions;
import EditorContextKeys = monaco.EditorContextKeys;

import * as selectListView from "../../selectListView";
import * as ui from "../../ui";
import * as uix from "../../uix";
import * as React from "react";

class QuickFixAction extends EditorAction {

    static ID = 'editor.action.quickfix';

	constructor() {
        super({
            id: QuickFixAction.ID,
            label: 'TypeScript Quick Fix',
            alias: 'TypeScript Quick Fix',
            precondition: EditorContextKeys.Focus,
            kbOpts: {
                kbExpr: EditorContextKeys.TextFocus,
                primary: KeyMod.Alt | KeyCode.Enter
            }
        });
	}

	public run(accessor:ServicesAccessor, editor:ICommonCodeEditor): void | TPromise<void> {
        const cm = editor;

        if (!cm._lastQuickFixInformation) {
            ui.notifyInfoNormalDisappear('No active quick fixes for last editor position');
            return;
        }
        const fixes = cm._lastQuickFixInformation.res.fixes;
        selectListView.selectListView.show({
            header:'💡 Quick Fixes',
            data: fixes,
            render: (fix, highlighted) => {
                return <div style={{fontFamily:'monospace'}}>{highlighted}</div>;
            },
            textify: (fix) => fix.display,
            onSelect: (fix) => {
                server.applyQuickFix({
                    key: fix.key,
                    indentSize: cm.getModel().getOptions().tabSize,
                    additionalData: null,
                    filePath: cm.filePath,
                    position: cm._lastQuickFixInformation.position
                }).then((res)=>{
                    // apply refactorings
                    // console.log('Apply refactorings:', res.refactorings); // DEBUG
                    uix.API.applyRefactorings(res.refactorings);
                });
                return '';
            }
        });
	}
}

CommonEditorRegistry.registerEditorAction(new QuickFixAction());
