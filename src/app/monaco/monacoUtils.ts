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


/**
 * Useful for language query stuff that we want to debounce + cancel if no longer relevant even after the query is made
 */
export function onlyLastCallWithDelay<T>(call: () => Promise<T>, token: monaco.CancellationToken): Promise<T> {
    let delay = 500;
    let timeout: any;

    const p = new Promise((resolve, reject) => {
        const later = () => {
            if (token.isCancellationRequested) reject('cancelled');
            else {
                call().then((res)=>{
                    if (token.isCancellationRequested) reject('cancelled');
                    else resolve(res);
                });
            }

        }
        timeout = setTimeout(later, delay);
        token.onCancellationRequested(() => {
            clearTimeout(timeout);
            reject('cancelled');
        });
    })
    return p;
}
