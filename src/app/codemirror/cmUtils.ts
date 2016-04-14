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
