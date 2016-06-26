/**
 * Original version from https://github.com/alexandrudima/monaco-typescript/blob/1af97f4c0bc7514ea1f1ba62d9098aa883595918/src/languageFeatures.ts
 *
 * Modified to
 * - use our live error pushing
 * - use `filePath` instead of `uri`
 */
import * as events from "../../../common/events";
import * as state from "../../state/state";
import {cast,server} from "../../../socket/socketClient";
type IDisposable = events.Disposable;
type Editor = monaco.editor.ICodeEditor;

function codeErrorToMonacoError(codeError: CodeError): monaco.editor.IMarkerData {
    return {
        severity: monaco.Severity.Error,
        message: codeError.message,

        startLineNumber: codeError.from.line + 1,
        startColumn: codeError.from.ch + 1,
        endLineNumber: codeError.to.line + 1,
        endColumn: codeError.to.ch + 1,
    };
}

export function setup(editor: Editor): { dispose: () => void } {
    // if (editor) return { dispose: () => null }; // DEBUG : while the feature isn't complete used to disable it

	function performLint(): void {
		let filePath: string = editor.filePath;
		let model: monaco.editor.IModel = editor.getModel();

		let rawErrors = state.getState().errorsUpdate.errorsByFilePath[filePath] || [];
		let markers = rawErrors.map(codeErrorToMonacoError);
		monaco.editor.setModelMarkers(model, 'alm-linter', markers);
	}

	// Perform an initial lint
	performLint();
	const disposible = new events.CompositeDisposible();
	// Subscribe for future updates
	disposible.add(cast.errorsUpdated.on(performLint));
	return disposible;
}
