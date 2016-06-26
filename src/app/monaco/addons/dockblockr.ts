type Editor = monaco.editor.ICodeEditor;


export function setup(editor: Editor): { dispose: () => void } {
    if (editor) return { dispose: () => null }; // DEBUG : while the feature isn't complete used to disable it

    
}
