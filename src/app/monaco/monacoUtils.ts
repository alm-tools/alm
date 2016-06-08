/**
 * Some useful monaco utilities
 */
/** Some types */
type Editor = monaco.editor.ICommonCodeEditor;

let editorOperationCounter = 0;

export function replaceSelection(config: {
    editor: Editor,
    newText: string
}) {
    const selection = config.editor.getSelection();

    const editOperation: monaco.editor.IIdentifiedSingleEditOperation = {
        identifier: {
            major: 0,
            minor: ++editorOperationCounter,
        },
        text: config.newText,
        range: selection,
        forceMoveMarkers: false,
        isAutoWhitespaceEdit: false,
    }

    config.editor.getModel().pushEditOperations([], [editOperation], null);
}
