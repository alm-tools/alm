import * as typestyle from "typestyle";
import * as commands from '../../commands/commands';
/**
 * Some styles
 */

/**
 * We have a unified color in overview as
 * having three colors there is mentally overloading
 **/
const colorInOverView = 'rgba(0, 122, 204, 0.6)';

const addedColor = '#008A00';
const addedClassName = typestyle.style({
    borderLeft: `3px solid ${addedColor}`,
    marginLeft: `5px`
});
const addedDecorationOptions: monaco.editor.IModelDecorationOptions = {
    linesDecorationsClassName: addedClassName,
    isWholeLine: true,
    overviewRuler: {
        color: colorInOverView,
        darkColor: colorInOverView,
        position: monaco.editor.OverviewRulerLane.Left
    }
};
const modifiedColor = 'yellow';
const modifiedClassName = typestyle.style({
    borderLeft: `3px solid ${modifiedColor}`,
    marginLeft: `5px`
});
const modifiedDecorationOptions: monaco.editor.IModelDecorationOptions = {
    linesDecorationsClassName: modifiedClassName,
    isWholeLine: true,
    overviewRuler: {
        color: colorInOverView,
        darkColor: colorInOverView,
        position: monaco.editor.OverviewRulerLane.Left
    }
};
const removedColor = '#00ccff';
const removedClassName = typestyle.style({
    borderLeft: `3px solid ${removedColor}`,
    marginLeft: `5px`
});
const removedDecorationOptions: monaco.editor.IModelDecorationOptions = {
    linesDecorationsClassName: removedClassName,
    isWholeLine: true,
    overviewRuler: {
        color: colorInOverView,
        darkColor: colorInOverView,
        position: monaco.editor.OverviewRulerLane.Left
    }
};

type Editor = monaco.editor.ICommonCodeEditor;
import {CompositeDisposible} from "../../../common/events";
import * as utils from "../../../common/utils";
import {server} from "../../../socket/socketClient";

export function setup(editor: Editor): { dispose: () => void } {
    // if (editor) return { dispose: () => null }; // DEBUG : while the feature isn't complete used to disable it

    const filePath = editor.filePath;

    let lastDecorations: string[] = [];
    const refreshGitStatus = () => {
        server.gitDiff({ filePath }).then((res) => {

			// Add to new
            const addedDecorations = res.added.map(added => {
                const result: monaco.editor.IModelDeltaDecoration = {
                    range: {
                        startLineNumber: added.from + 1,
                        endLineNumber: added.to + 1,
                    } as monaco.Range,
                    options: addedDecorationOptions
                };
                return result;
            });
            const modifiedDecorations = res.modified.map(modified => {
                const result: monaco.editor.IModelDeltaDecoration = {
                    range: {
                        startLineNumber: modified.from + 1,
                        endLineNumber: modified.to + 1,
                    } as monaco.Range,
                    options: modifiedDecorationOptions
                };
                return result;
            });
            const removedDecorations = res.removed.map(removed => {
                const result: monaco.editor.IModelDeltaDecoration = {
                    range: {
                        startLineNumber: removed + 1,
                        endLineNumber: removed + 1,
                    } as monaco.Range,
                    options: removedDecorationOptions
                }
                return result;
            });

            // Collect all the decorations and apply them
            const deltaDecorations = addedDecorations.concat(modifiedDecorations).concat(removedDecorations);
            lastDecorations = editor.deltaDecorations(lastDecorations, deltaDecorations);
        });
    }

    const refreshGitStatusDebounced = utils.debounce(refreshGitStatus, 2000);

    const disposible = new CompositeDisposible();
    disposible.add(editor.onDidFocusEditor(refreshGitStatusDebounced));
    disposible.add(editor.onDidChangeModelContent(refreshGitStatusDebounced));
    disposible.add(commands.gitStatusNeedsRefresh.on(refreshGitStatusDebounced));
    return disposible;
}
