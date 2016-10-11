/**
 * Note: a lot of the *on enter* docblocking is done by the `richLanguageConfiguration` `onEnterRules`.
 *
 * Here we mostly only implement the `snippets`
 */
import {CompositeDisposible} from "../../../common/events";
type Editor = monaco.editor.ICodeEditor;

/**
 * Note: the order of the snippets is important
 */
const snippets = {
    '////': `//////////////////////
// {{}}
//////////////////////`,


    '///': `/**
 * {{}}
 */`,


    '//': `/** {{}} */`,
}

export function setup(editor: Editor): { dispose: () => void } {
    // if (editor) return { dispose: () => null }; // DEBUG : while the feature isn't complete used to disable it

    const disposible = new CompositeDisposible();
    disposible.add(editor.onKeyDown((e) => {
        if (e.keyCode === monaco.KeyCode.Tab) {
            const position = editor.getPosition();
            const contents = editor.getModel().getLineContent(position.lineNumber).substr(0, position.column - 1);

            const matchers = Object.keys(snippets);
            for (let snippetKey of matchers) {
                if (contents.endsWith(snippetKey)) {
                    e.preventDefault();
                    e.stopPropagation();

                    /** Insert the snippet */
                    const codeSnippet = monaco.CodeSnippet.fromInternal(snippets[snippetKey]);
                    const overwriteBefore = snippetKey.length;
                    const overwriteAfter = 0;
                    monaco.SnippetController.get(editor).run(codeSnippet, overwriteBefore, overwriteAfter, true);

                    // Don't run any other snippets :)
                    return;
                }
            }
        }
        return;
    }));
    return disposible;
}
