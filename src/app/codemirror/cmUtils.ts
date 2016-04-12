/** http://stackoverflow.com/a/23564408/390330 */
export function jumpToLine(config: {
    line: number,
    editor: CodeMirror.EditorFromTextArea
}) {
    const doc = config.editor.getDoc();
    doc.setCursor({ line: config.line, ch: 0 });
    
    var t = config.editor.charCoords({ line: config.line, ch: 0 }, "local").top;
    var middleHeight = config.editor.getScrollerElement().offsetHeight / 2;
    config.editor.scrollTo(null, t - middleHeight - 5);
}
