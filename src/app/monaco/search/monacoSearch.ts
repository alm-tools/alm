/**
 * The best way to understand what is going on is to review the `find` module in monaco
 * https://github.com/Microsoft/vscode/tree/385412e89f610aaa5dc7d6a3727f45e048e37c7e/src/vs/editor/contrib/find
 */
/** Some types */
type Editor = monaco.editor.ICommonCodeEditor;

declare global {
    module monaco {
        module editor {
            interface ICommonCodeEditor {
                _findController: CommonFindController;
            }
        }
    }
}

/**
 * Mostly providing a typed API on top of `search`
 */
export let commands = {
    search: (cm: Editor, query: FindOptions) => startSearch(cm, query),
    hideSearch: (cm: Editor) => hideSearch(cm),
    findNext: (cm: Editor, query: FindOptions) => findNextIfNotAlreadyDoing(cm, query),
    findPrevious: (cm: Editor, query: FindOptions) => findPreviousIfNotAlreadyDoing(cm, query),
    replaceNext: (cm: Editor, newText: string) => simpleReplace(cm, newText, false),
    replacePrevious: (cm: Editor, newText: string) => simpleReplacePrevious(cm, newText),
    replaceAll: (cm: Editor, newText: string) => simpleReplace(cm, newText, true),
}

/** TODO: mon */
const getSearchCtrl = (editor: Editor) => {
    return CommonFindController.getFindController(editor);
};
const startSearch = (editor: Editor, query: FindOptions) => {
    const ctrl = getSearchCtrl(editor);
    ctrl.setSearchString(query.query);
    // TODO: mon
    // set other options as well
};
const hideSearch = (editor: Editor) => {
    const ctrl = getSearchCtrl(editor);
    ctrl.closeFindWidget();
};
const findNextIfNotAlreadyDoing = (editor: Editor, query: FindOptions) => null;
const findPreviousIfNotAlreadyDoing = (editor: Editor, query: FindOptions) => null;
const simpleReplace: any = () => null;
const simpleReplacePrevious: any = () => null;

import {CommonFindController} from "./findController";
