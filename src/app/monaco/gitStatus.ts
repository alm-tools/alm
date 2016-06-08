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

type Editor = monaco.editor.ICommonCodeEditor;
import {CompositeDisposible} from "../../common/events";
import * as utils from "../../common/utils";
import {server} from "../../socket/socketClient";

export function setup(cm: Editor): { dispose: () => void } {
    if (cm) return { dispose: () => null }; // DEBUG : while the feature isn't complete used to disable it

    const filePath = cm.filePath;

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

    const refreshGitStatus = () => {
        server.gitDiff({ filePath }).then((res) => {
            // TODO: do the rest
        });
    }

    const refreshGitStatusDebounced = utils.debounce(refreshGitStatus, 2000);

    const handleFocus = () => {
        refreshGitStatus();
    }


    const disposible = new CompositeDisposible();
    disposible.add(cm.onDidFocusEditor(handleFocus));
    disposible.add(cm.onDidChangeModel(refreshGitStatusDebounced));
    return disposible;
}
