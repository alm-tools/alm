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

export function replaceRange(config: {
    model: monaco.IModel,
    range: {
        startLineNumber: number,
        startColumn: number,
        endLineNumber: number,
        endColumn: number
    },
    newText: string
}) {
    const editOperation: monaco.editor.IIdentifiedSingleEditOperation = {
        identifier: {
            major: 0,
            minor: ++editorOperationCounter,
        },
        text: config.newText,
        range: new monaco.Range(config.range.startLineNumber, config.range.startColumn, config.range.endLineNumber, config.range.endColumn),
        forceMoveMarkers: false,
        isAutoWhitespaceEdit: false,
    }

    config.model.pushEditOperations([], [editOperation], null);
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

export function setSelection(cfg:{editor: Editor, textSpan: ts.TextSpan}) {
    const model = cfg.editor.getModel();
    let start = model.getPositionAt(cfg.textSpan.start);
    let end = model.getPositionAt(cfg.textSpan.start + cfg.textSpan.length);
    cfg.editor.setSelection({
        startLineNumber: start.lineNumber,
        startColumn: start.column,
        endLineNumber: end.lineNumber,
        endColumn: end.column
    });
}

export function gotoPosition(cfg:{editor: Editor, position: EditorPosition}) {
    const pos = {
        lineNumber: cfg.position.line + 1,
        column: cfg.position.ch + 1,
    };
    cfg.editor.setPosition(pos);
    cfg.editor.revealPosition(pos);
}

export function getVisibleLines(editor: Editor): monaco.Range {
    // HACK: The current lines visible api
    const range: monaco.Range = (editor as any)._view.layoutProvider.getLinesViewportData().visibleRange;
    return range;
}

/** Note: Only useful if in single cursor mode */
export function isCursorInTopHalf(cm: Editor): boolean {
    let cursor = cm.getPosition();
    let scrollInfo = getVisibleLines(cm);

    // Closer to top than bottom
    return (cursor.lineNumber - scrollInfo.startLineNumber) < (scrollInfo.endLineNumber - cursor.lineNumber);
}

export function getSelectionOrCurrentLine(editor: Editor): string {
    const selection = editor.getSelection();
    let hasSelection = !selection.isEmpty();
    if (hasSelection) {
        let selected = editor.getModel().getValueInRange(selection);
        return selected;
    }
    else {
        let selected = editor.getModel().getLineContent(selection.startLineNumber);
        return selected;
    }
}

/**
 * Position conversion functions
 */
export function getCurrentPosition(editor: Editor): number {
    const position = editor.getPosition();
    return editor.getModel().getOffsetAt(position);
}

export function positionToOffset(model: monaco.editor.IReadOnlyModel, position: monaco.IPosition): number {
    return model.getOffsetAt(position);
}

export function offsetToPosition(model: monaco.editor.IReadOnlyModel, offset: number): monaco.IPosition {
    return model.getPositionAt(offset);
}
