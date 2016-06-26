/**
 * Note: a lot of the *on enter* docblocking is done by the `richLanguageConfiguration` `onEnterRules`.
 *
 * Here we mostly only implement the `snippets`
 */
import {CompositeDisposible} from "../../../common/events";
type Editor = monaco.editor.ICodeEditor;

const snippets = {
    '//': `/** {{}} */`,
}

export function setup(editor: Editor): { dispose: () => void } {
    // if (editor) return { dispose: () => null }; // DEBUG : while the feature isn't complete used to disable it

    const disposible = new CompositeDisposible();
    disposible.add(editor.onKeyDown((e)=>{
        if (e.keyCode === monaco.KeyCode.Tab) {
            const position = editor.getPosition();
            const contents = editor.getModel().getLineContent(position.lineNumber).substr(0, position.column - 1);

            const matchers = Object.keys(snippets);
            for (let snippet of matchers) {
                if (contents.endsWith(snippet)) {
                    e.preventDefault();
                    e.stopPropagation();

                    // Need access from monaco for:
                    // - CodeSnippet
                    // - getSnippetController
                    // 
                    // const codeSnippet = new CodeSnippet(snippets[snippet]);
                    // const overwriteBefore = snippet.length;
                    // const overwriteAfter = 0;
                    // getSnippetController(this.editor).run(codeSnippet, overwriteBefore , overwriteAfter));
                }
            }
        }
        return;
    }));
    return disposible;
}
