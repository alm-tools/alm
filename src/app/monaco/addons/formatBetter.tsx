
import CommonEditorRegistry = monaco.CommonEditorRegistry;
import ICommonCodeEditor = monaco.ICommonCodeEditor;
import TPromise = monaco.Promise;
import EditorAction = monaco.EditorAction;
import KeyMod = monaco.KeyMod;
import KeyCode = monaco.KeyCode;
import ServicesAccessor = monaco.ServicesAccessor;
import IActionOptions = monaco.IActionOptions;
import EditorContextKeys = monaco.EditorContextKeys;

/**
 * Format document on selection based on cursor
 */
export class FormatBetterAction extends EditorAction {
    constructor() {
        super({
            id: 'editor.action.formatBetter',
            label: 'Format',
            alias: 'Format',
            precondition: EditorContextKeys.Focus,
            kbOpts: {
                kbExpr: EditorContextKeys.TextFocus,
                primary: KeyMod.CtrlCmd | KeyMod.Alt | KeyCode.KEY_L
            }
        });

    }

    public run(accessor: ServicesAccessor, editor: ICommonCodeEditor): void | TPromise<void> {
        const model = editor.getModel();
        const editorSelection = editor.getSelection();
        if (editorSelection.isEmpty()) {
            const formatDocument = editor.getAction('editor.action.formatDocument');
            return formatDocument.run();
        } else {
            const formatSelection = editor.getAction('editor.action.formatSelection');
            return formatSelection.run();
        }
    }
}

CommonEditorRegistry.registerEditorAction(new FormatBetterAction());
