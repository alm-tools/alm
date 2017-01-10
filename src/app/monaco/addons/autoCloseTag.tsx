import {CompositeDisposible} from "../../../common/events";
type Editor = monaco.editor.ICodeEditor;

export function setup(cm: Editor): { dispose: () => void } {

    const disposible = new CompositeDisposible();
    disposible.add(cm.onDidChangeModelContent((e) => {
       /** Close tag */

    }));

    return disposible;
}
