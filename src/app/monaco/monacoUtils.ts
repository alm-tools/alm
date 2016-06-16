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

/** Runs format or format selection (if any) */
export function format(config: {
    editor: Editor,
}){
    const action = config.editor.getAction('editor.action.format');
    action.run();
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

export function gotoPosition(cfg:{editor: Editor, position: EditorPosition}) {
    const pos = {
        lineNumber: cfg.position.line + 1,
        column: cfg.position.ch + 1,
    };
    cfg.editor.setPosition(pos);
    cfg.editor.revealPosition(pos);
}
