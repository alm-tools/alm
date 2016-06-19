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

    let lastDecorations: string[] = [];
    let lastServerRes: Types.GetQuickFixesResponse | null = null;
    // The key quick fix get logic
    const refreshQuickFixes = () => {
        // Clear any previous attempt
        lastServerRes = null;
        if (lastDecorations.length) {
            lastDecorations = editor.deltaDecorations(lastDecorations, []);
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
        }).then(res=>{
            const newPos = editor.getPosition();
            if (!newPos.equals(pos)) return;

            lastServerRes = res;

            /** Only add the decoration if there are some fixes available */
            if (res.fixes.length) {
                const result: monaco.editor.IModelDeltaDecoration = {
                    range: {
                        startLineNumber: pos.lineNumber,
                        endLineNumber: pos.lineNumber,
                    } as monaco.Range,
                    options: quickFixDecorationOptions
                }
                lastDecorations = editor.deltaDecorations(lastDecorations, [result]);
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

    /**
     * Also subscribe to the user clicking the margin
     */
    editor.onMouseUp((mouseEvent) => {
        if (mouseEvent.target.type === monaco.editor.MouseTargetType.GUTTER_GLYPH_MARGIN
            && mouseEvent.target.element.className.includes(quickFixClassName)) {
            if (lastServerRes) {
                // Show the quick fix modal :)
            }
        }
    });

    return disposible;
}
