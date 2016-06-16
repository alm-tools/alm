type Editor = monaco.editor.ICommonCodeEditor;

require('./liveAnalysis.css');

const overrideClassName = 'monaco-live-analysis-override';
const overrideDecorationOptions: monaco.editor.IModelDecorationOptions = {
    glyphMarginClassName: overrideClassName,
    isWholeLine: true,
};


export function setup(cm: Editor): { dispose: () => void } {
    if (cm) return { dispose: () => null }; // DEBUG : while the feature isn't complete used to disable it

}
