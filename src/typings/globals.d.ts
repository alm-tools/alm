interface EditorPosition {
    line: number;
    ch: number;
}

interface CodeEdit {
    from: EditorPosition;
    to: EditorPosition;
    newText: string;
}
