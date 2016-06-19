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

    let lastWidget: monaco.editor.IContentWidget | null = null;
    // The key quick fix get logic
    const refreshQuickFixes = () => {
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
                editor._lastQuickFixInformation = res;

                // const result: monaco.editor.IModelDeltaDecoration = {
                //     range: {
                //         startLineNumber: pos.lineNumber,
                //         endLineNumber: pos.lineNumber,
                //     } as monaco.Range,
                //     options: quickFixDecorationOptions
                // }
                // lastDecorations = editor.deltaDecorations(lastDecorations, [result]);

                // Setup the marker. Note: Must be done outside `getDomNode` to make it idempotent
                var marker = document.createElement("div");
                marker.className = quickFixClassName;
                marker.title = `Quick fixes available`;
                marker.innerHTML = "💡";
                // marker.onclick = () => {
                //     // TODO: show quick fix selector
                // }

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
    editor.onDidFocusEditor(refreshQuickFixesDebounced);
    editor.onDidChangeModelContent(refreshQuickFixesDebounced);
    editor.onDidChangeCursorPosition(refreshQuickFixesDebounced);
    const disposeProjectWatch = cast.activeProjectConfigDetailsUpdated.on(() => {
        refreshQuickFixesDebounced();
    });

    return disposible;
}

/**
 * We add the quickfix information to the editor to allow easy invocation from an action
 */
declare global {
    namespace monaco {
        namespace editor {
            export interface ICommonCodeEditor {
                _lastQuickFixInformation?: Types.GetQuickFixesResponse
            }
        }
    }
}
