/**
 * Note: a lot of the *on enter* docblocking is done by the `richLanguageConfiguration` `onEnterRules`.
 *
 * Here we mostly only implement the `snippets`
 */
type Editor = monaco.editor.ICodeEditor;


export function setup(editor: Editor): { dispose: () => void } {
    if (editor) return { dispose: () => null }; // DEBUG : while the feature isn't complete used to disable it


}
