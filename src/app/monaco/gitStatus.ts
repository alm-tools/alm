/** TIP */
// static ADDED_DECORATION_OPTIONS: common.IModelDecorationOptions = {
//     linesDecorationsClassName: 'git-dirty-added-diff-glyph',
//     isWholeLine: true,
//     overviewRuler: {
//         color: 'rgba(0, 122, 204, 0.6)',
//         darkColor: 'rgba(0, 122, 204, 0.6)',
//         position: common.OverviewRulerLane.Left
//     }
// };

import * as fstyle from "../base/fstyle";
/**
 * Some styles
 */
const addedColor = '#008A00';
const addedClassName = fstyle.style({
    borderLeft: `3px solid ${addedColor}`,
    marginLeft: `5px`
});
const addedDecorationOptions: monaco.editor.IModelDecorationOptions = {
    linesDecorationsClassName: addedClassName,
    isWholeLine: true,
    overviewRuler: {
        color: addedColor,
        darkColor: addedColor,
        position: monaco.editor.OverviewRulerLane.Left
    }
};

type Editor = monaco.editor.ICommonCodeEditor;
import {CompositeDisposible} from "../../common/events";
import * as utils from "../../common/utils";
import {server} from "../../socket/socketClient";

export function setup(editor: Editor): { dispose: () => void } {
    // if (editor) return { dispose: () => null }; // DEBUG : while the feature isn't complete used to disable it

    const filePath = editor.filePath;

    // this._editor.changeDecorations((changeAccessor: editorCommon.IModelDecorationsChangeAccessor) => {
    //     if (this._highlightedDecorationId !== null) {
    //         changeAccessor.changeDecorationOptions(this._highlightedDecorationId, FindDecorations.createFindMatchDecorationOptions(false));
    //         this._highlightedDecorationId = null;
    //     }
    //     if (newCurrentDecorationId !== null) {
    //         this._highlightedDecorationId = newCurrentDecorationId;
    //         changeAccessor.changeDecorationOptions(this._highlightedDecorationId, FindDecorations.createFindMatchDecorationOptions(true));
    //     }
    // });

    let lastDecorations: string[] = [];
    const refreshGitStatus = () => {
        server.gitDiff({ filePath }).then((res) => {
            // TODO: do the rest

            // const decorationId = "something-for-addition"; // TODO: mon : this is probably wrong
            //
            // editor.changeDecorations((changeAccessor: monaco.editor.IModelDecorationsChangeAccessor) => {
			// 	if (this._highlightedDecorationId !== null) {
			// 		changeAccessor.changeDecorationOptions(this._highlightedDecorationId, FindDecorations.createFindMatchDecorationOptions(false));
			// 		this._highlightedDecorationId = null;
			// 	}
			// 	if (newCurrentDecorationId !== null) {
			// 		this._highlightedDecorationId = newCurrentDecorationId;
			// 		changeAccessor.changeDecorationOptions(this._highlightedDecorationId, FindDecorations.createFindMatchDecorationOptions(true));
			// 	}
			// });

            const deltaDecorations: monaco.editor.IModelDeltaDecoration[] = [{
                range: {
                    startLineNumber: 1,
                    endLineNumber: 5,
                } as monaco.Range,
                options: addedDecorationOptions
            }];

            lastDecorations = editor.deltaDecorations(lastDecorations, deltaDecorations);
        });
    }

    const refreshGitStatusDebounced = utils.debounce(refreshGitStatus, 2000);

    const handleFocus = () => {
        refreshGitStatus();
    }

    const disposible = new CompositeDisposible();
    disposible.add(editor.onDidFocusEditor(handleFocus));
    disposible.add(editor.onDidChangeModel(refreshGitStatusDebounced));
    return disposible;
}
