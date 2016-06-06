/**
 * Original version from https://github.com/alexandrudima/monaco-typescript/blob/1af97f4c0bc7514ea1f1ba62d9098aa883595918/src/languageFeatures.ts
 *
 * Modified to
 * - use our live error pushing
 * - use `filePath` instead of `uri`
 */
import * as events from "../../../../common/events";
import * as state from "../../../state/state";
import {cast,server} from "../../../../socket/socketClient";
type IDisposable = events.Disposable;

export class DiagnostcsAdapter {

	private _disposables: IDisposable[] = [];
	private _listener: { [filePath: string]: events.CompositeDisposible } = Object.create(null);

	constructor(public langauge: 'javascript' | 'typescript') {
		const onModelAdd = (model: monaco.editor.IModel): void => {
			if (model.getModeId() !== langauge) {
				return;
			}

            /** Get the file path for the model that is getting created */
            const filePath = window.creatingModelFilePath;
            if (!filePath) {
                // Should not happen as already bail out if language is not of the kind we setup in the doccache 🌹
                console.error('should not happen');
                return;
            }

            let handle: any;
            const performLint = () => {
                clearTimeout(handle);
                handle = setTimeout(() => this._doValidate(filePath, model), 2000);
            }

            const disposible = new events.CompositeDisposible();
			this._listener[model.filePath] = disposible;

            // subscribe for future updates
            disposible.add(model.onDidChangeContent(performLint));
            disposible.add(cast.errorsUpdated.on(performLint));

            // also validate initially
			this._doValidate(filePath, model);
		};

		const onModelRemoved = (model: monaco.editor.IModel): void => {
            if (model.filePath && this._listener[model.filePath]) {
                this._listener[model.filePath].dispose();
                delete this._listener[model.filePath];
            }
		};

		this._disposables.push(monaco.editor.onDidCreateModel(onModelAdd));
		this._disposables.push(monaco.editor.onWillDisposeModel(onModelRemoved));
		this._disposables.push(monaco.editor.onDidChangeModelLanguage(event => {
			onModelRemoved(event.model);
			onModelAdd(event.model);
		}));

		this._disposables.push({
			dispose: () => {
				for (let key in this._listener) {
					this._listener[key].dispose();
				}
			}
		});

		monaco.editor.getModels().forEach(onModelAdd);
	}

	public dispose(): void {
		this._disposables.forEach(d => d && d.dispose());
		this._disposables = [];
	}

	private _doValidate(filePath: string, model: monaco.editor.IModel): void {
        let rawErrors = state.getState().errorsUpdate.errorsByFilePath[filePath] || [];
        let markers = rawErrors.map(codeErrorToMonacoError);
        monaco.editor.setModelMarkers(model, this.langauge, markers);
	}
}


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
