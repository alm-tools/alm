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

export function setup(cm: Editor): { dispose: () => void } {
    if (cm) return { dispose: () => null }; // DEBUG : while the feature isn't complete used to disable it
    
}
