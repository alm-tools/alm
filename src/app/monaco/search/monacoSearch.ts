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
    replaceNext: (cm: Editor, newText: string) => simpleReplaceNext(cm, newText),
    replacePrevious: (cm: Editor, newText: string) => simpleReplacePrevious(cm, newText),
    replaceAll: (cm: Editor, newText: string) => simpleReplaceAll(cm, newText),
}

const startSearch = (editor: Editor, query: FindOptions) => {
    const ctrl = getSearchCtrl(editor);
    if (!ctrl.getState().isRevealed) {
        ctrl.start({
            forceRevealReplace: true,
            seedSearchStringFromSelection: false,
            seedSearchScopeFromSelection: false,
            shouldFocus: FindStartFocusAction.NoFocusChange,
            shouldAnimate: false,
        });
    }
    ctrl.setSearchString(query.query);
    // TODO: mon
    // set other options as well
};
const hideSearch = (editor: Editor) => {
    const ctrl = getSearchCtrl(editor);
    ctrl.closeFindWidget();
};
const findNextIfNotAlreadyDoing = (editor: Editor, query: FindOptions) => {
    const ctrl = getSearchCtrl(editor);
    if (!ctrl.getState().isRevealed) {
        startSearch(editor,query);
    }
    else {
        ctrl.moveToNextMatch();
    }
}
const findPreviousIfNotAlreadyDoing = (editor: Editor, query: FindOptions) => {
    const ctrl = getSearchCtrl(editor);
    if (!ctrl.getState().isRevealed) {
        startSearch(editor,query);
    }
    else {
        ctrl.moveToPrevMatch();
    }
};
const simpleReplaceNext = (editor: Editor, newText:string) => {
    const ctrl = getSearchCtrl(editor);

    // Set new text
    hackySetReplaceText(ctrl, newText);

    // trigger the replace action
    ctrl.replace();
};
const simpleReplacePrevious = (editor: Editor, newText: string) => {
    const ctrl = getSearchCtrl(editor);

    // Set new text
    hackySetReplaceText(ctrl,newText);

    // trigger the replace all
    hackyReplacePrevious(editor, ctrl, newText);
};
const simpleReplaceAll = (editor: Editor, newText: string) => {
    const ctrl = getSearchCtrl(editor);

    // Set new text
    hackySetReplaceText(ctrl,newText);

    // trigger the replace all
    ctrl.replaceAll();
};


/**
 * Our interactions with monaco
 */
const getSearchCtrl = (editor: Editor) => {
    return CommonFindController.getFindController(editor);
};
const hackySetReplaceText = (ctrl: CommonFindController, newText: string) => {
    // HACK to inject at new text:
    (ctrl.getState() as any)._replaceString = newText;
}
const hackyReplacePrevious = (editor: Editor, ctrl: CommonFindController, newText: string) => {
    // If it is on a match it should just replace. Othewise it should go the the previous match

    // HACK: get the model
    const model: FindModelBoundToEditorModel = (ctrl as any)._model;
    // HACK: the following is pretty much a duplicate of `replace` from model
    // HACK: we made public a few `model` functions 
    // But for actions we delegate to `ctrl` ;)
    if (!model._hasMatches()) {
        return;
    }
    let selection = editor.getSelection();
    let selectionText = editor.getModel().getValueInRange(selection);
    if (model._rangeIsMatch(selection)) {
        // selection sits on a find match => replace it!
        ctrl.replace();
        ctrl.moveToPrevMatch();
    } else {
        ctrl.moveToPrevMatch();
    }
}

import {CommonFindController, FindStartFocusAction} from "./findController";
import {FindModelBoundToEditorModel} from "./findModel";
