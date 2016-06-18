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

export function setup(cm: Editor): { dispose: () => void } {
    // if (cm) return { dispose: () => null }; // DEBUG : while the feature isn't complete used to disable it

    let lastDecorations: string[] = [];
    let lastServerRes: Types.GetQuickFixesResponse | null = null;
    // The key quick fix get logic
    const refreshQuickFixes = () => {
        // Clear any previous attempt
        lastServerRes = null;
        if (lastDecorations.length) {
            lastDecorations = cm.deltaDecorations(lastDecorations, []);
        }

        // If not active project return
        if (!state.inActiveProjectFilePath(cm.filePath)) {
            return;
        }

        const indentSize = cm.getModel().getOptions().tabSize;
        const pos = cm.getPosition();
        const position = cm.getModel().getOffsetAt(pos);

        // query the server with live analysis
        server.getQuickFixes({
            indentSize,
            filePath: cm.filePath,
            position
        }).then(res=>{
            const newPos = cm.getPosition();
            if (!newPos.equals(pos)) return;

            lastServerRes = res;
            const newDecorations = res.fixes.map(fix => {
                const result: monaco.editor.IModelDeltaDecoration = {
                    range: {
                        startLineNumber: pos.lineNumber,
                        endLineNumber: pos.lineNumber,
                    } as monaco.Range,
                    options: quickFixDecorationOptions
                }
                return result;
            });

            lastDecorations = cm.deltaDecorations(lastDecorations, newDecorations);
        });
    };

    const refreshQuickFixesDebounced = utils.debounce(refreshQuickFixes, 1000);

    const disposible = new CompositeDisposible();
    cm.onDidFocusEditor(refreshQuickFixesDebounced);
    cm.onDidChangeModelContent(refreshQuickFixesDebounced);
    cm.onDidChangeCursorPosition(refreshQuickFixesDebounced);
    const disposeProjectWatch = cast.activeProjectConfigDetailsUpdated.on(() => {
        refreshQuickFixesDebounced();
    });

    /**
     * Also subscribe to the user clicking the margin
     */
    cm.onMouseUp((mouseEvent) => {
        if (mouseEvent.target.type === monaco.editor.MouseTargetType.GUTTER_GLYPH_MARGIN
            && mouseEvent.target.element.className.includes(quickFixClassName)) {
            if (lastServerRes) {
                // Show the quick fix modal :)
            }
        }
    });

    return disposible;
}
