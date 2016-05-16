/** http://stackoverflow.com/a/23564408/390330 */
export function jumpToLine(config: {
    line: number,
    ch?: number,
    editor: CodeMirror.EditorFromTextArea
}) {
    const doc = config.editor.getDoc();
    const ch = config.ch || 0;
    doc.setCursor({ line: config.line, ch });

    var t = config.editor.charCoords({ line: config.line, ch: 0 }, "local").top;
    var middleHeight = config.editor.getScrollerElement().offsetHeight / 2;
    config.editor.scrollTo(null, t - middleHeight - 5);
}


/** Good for stuff that does not apply in multi cursor or selection mode */
export function isSingleCursor(editor: CodeMirror.EditorFromTextArea): boolean {
    const doc = editor.getDoc();
    /** If something selected or multi cursor */
    return !doc.somethingSelected() && !(doc.listSelections().length > 1);
}

/** Note: Only useful if in single cursor mode */
export function isCursorInTopHalf(cm: CodeMirror.EditorFromTextArea): boolean {
    let cursor = cm.getDoc().getCursor();
    let scrollInfo = cm.getScrollInfo();
    let topLine = cm.coordsChar({ top: scrollInfo.top, left: scrollInfo.left }, 'local').line;
    let bottomLine = cm.coordsChar({ top: scrollInfo.top + scrollInfo.clientHeight, left: scrollInfo.left }, 'local').line + 1;

    // Closer to top than bottom
    return (cursor.line - topLine < bottomLine - cursor.line);
}
