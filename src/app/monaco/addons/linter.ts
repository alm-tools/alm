/**
 * Original version from https://github.com/alexandrudima/monaco-typescript/blob/1af97f4c0bc7514ea1f1ba62d9098aa883595918/src/languageFeatures.ts
 *
 * Modified to
 * - use our live error pushing
 * - use `filePath` instead of `uri`
 */
import * as events from "../../../common/events";
import * as state from "../../state/state";
import * as types from '../../../common/types';
import {errorsCache} from "../../globalErrorCacheClient";
type IDisposable = events.Disposable;
type Editor = monaco.editor.ICodeEditor;

require('./linter.css');
const gutterClassName = 'monaco-lint-marker-error';
const gutterDecorationOptions: monaco.editor.IModelDecorationOptions = {
    glyphMarginClassName: gutterClassName,
    isWholeLine: true,
    hoverMessage: 'Errors exist in code on this line.'
};


function codeErrorToMonacoError(codeError: types.CodeError): monaco.editor.IMarkerData {
    return {
        severity: codeError.level === 'error' ? monaco.Severity.Error : monaco.Severity.Warning,
        message: codeError.message,

        startLineNumber: codeError.from.line + 1,
        startColumn: codeError.from.ch + 1,
        endLineNumber: codeError.to.line + 1,
        endColumn: codeError.to.ch + 1,
    };
}

export function setup(editor: Editor): { dispose: () => void } {
    // if (editor) return { dispose: () => null }; // DEBUG : while the feature isn't complete used to disable it

    let lastDecorations: string[] = [];
    function performLint(): void {
        let filePath: string = editor.filePath;
        let model: monaco.editor.IModel = editor.getModel();

        let rawErrors = errorsCache.getErrorsForFilePath(filePath);

        // console.log('here', rawErrors); // DEBUG

        // Set inline markers. Monaco also uses these for `f8` next error nav.
        let markers = rawErrors.map(codeErrorToMonacoError);
        monaco.editor.setModelMarkers(model, 'alm-linter', markers);

        // Set gutter decorations
        const newDecorations = rawErrors.map(override => {
            const result: monaco.editor.IModelDeltaDecoration = {
                range: {
                    startLineNumber: override.from.line + 1,
                    endLineNumber: override.to.line + 1,
                } as monaco.Range,
                options: gutterDecorationOptions
            }
            return result;
        });
        lastDecorations = editor.deltaDecorations(lastDecorations, newDecorations);
    }

    // Perform an initial lint
    performLint();
    const disposible = new events.CompositeDisposible();
    // Subscribe for future updates
    disposible.add(errorsCache.errorsDelta.on(performLint));

	/**
	 * Also subscribe to the user clicking the margin
	 */
    disposible.add(editor.onMouseUp((mouseEvent) => {
        if (mouseEvent.target.type === monaco.editor.MouseTargetType.GUTTER_GLYPH_MARGIN
            && mouseEvent.target.element.className.includes(gutterClassName)) {

            const position = mouseEvent.target.position;
            if (position) {
                let rawErrors = errorsCache.getErrorsForFilePath(editor.filePath);
				const error = rawErrors.find(x => x.from.line === position.lineNumber - 1);
                if (error) {
                    editor.setPosition({
                        lineNumber: error.from.line + 1,
                        column: error.from.ch + 1
                    });
                }
            }
        }
    }));

    return disposible;
}
