/**
 * Modifications
 * - removed keybinding service dependency
 */
import {Disposable} from "../common/lifecycle";
import {FindReplaceState,FindReplaceStateChangedEvent, INewFindReplaceState} from "./findState";
import {FindModelBoundToEditorModel} from "./findModel";
import * as strings from "../common/strings";
import editorCommon = monaco.editor;

export enum FindStartFocusAction {
	NoFocusChange,
	FocusFindInput,
	FocusReplaceInput
}

export interface IFindStartOptions {
	forceRevealReplace:boolean;
	seedSearchStringFromSelection:boolean;
	seedSearchScopeFromSelection:boolean;
	shouldFocus:FindStartFocusAction;
	shouldAnimate:boolean;
}

const CONTEXT_FIND_WIDGET_VISIBLE = 'findWidgetVisible';

export class CommonFindController extends Disposable implements editorCommon.IEditorContribution {

	static ID = 'editor.contrib.findController';

	private _editor: editorCommon.ICommonCodeEditor;
	protected _state: FindReplaceState;
	private _model: FindModelBoundToEditorModel;

	static getFindController(editor:editorCommon.ICommonCodeEditor): CommonFindController {
		return <CommonFindController>editor.getContribution(CommonFindController.ID);
	}

	constructor(editor:editorCommon.ICommonCodeEditor) {
		super();
		this._editor = editor;

		this._state = this._register(new FindReplaceState());
		this._register(this._state.addChangeListener((e) => this._onStateChanged(e)));

		this._model = null;

		this._register(this._editor.onDidChangeModel(() => {
			let shouldRestartFind = (this._editor.getModel() && this._state.isRevealed);

			this.disposeModel();

			if (shouldRestartFind) {
				this._start({
					forceRevealReplace: false,
					seedSearchStringFromSelection: false,
					seedSearchScopeFromSelection: false,
					shouldFocus: FindStartFocusAction.NoFocusChange,
					shouldAnimate: false
				});
			}
		}));
	}

	public dispose(): void {
		this.disposeModel();
		super.dispose();
	}

	private disposeModel(): void {
		if (this._model) {
			this._model.dispose();
			this._model = null;
		}
	}

	public getId(): string {
		return CommonFindController.ID;
	}

	private _onStateChanged(e:FindReplaceStateChangedEvent): void {
		if (e.isRevealed) {
			if (this._state.isRevealed) {
			} else {
				this.disposeModel();
			}
		}
	}

	public getState(): FindReplaceState {
		return this._state;
	}

	public closeFindWidget(): void {
		this._state.change({ isRevealed: false }, false);
		this._editor.focus();
	}

	public toggleCaseSensitive(): void {
		this._state.change({ matchCase: !this._state.matchCase }, false);
	}

	public toggleWholeWords(): void {
		this._state.change({ wholeWord: !this._state.wholeWord }, false);
	}

	public toggleRegex(): void {
		this._state.change({ isRegex: !this._state.isRegex }, false);
	}

	public setSearchString(searchString:string): void {
		this._state.change({ searchString: searchString }, false);
	}

	public getSelectionSearchString(): string {
		let selection = this._editor.getSelection();

		if (selection.startLineNumber === selection.endLineNumber) {
			if (selection.isEmpty()) {
				let wordAtPosition = this._editor.getModel().getWordAtPosition(selection.getStartPosition());
				if (wordAtPosition) {
					return wordAtPosition.word;
				}
			} else {
				return this._editor.getModel().getValueInRange(selection);
			}
		}

		return null;
	}

	protected _start(opts:IFindStartOptions): void {
		this.disposeModel();

		if (!this._editor.getModel()) {
			// cannot do anything with an editor that doesn't have a model...
			return;
		}

		let stateChanges: INewFindReplaceState = {
			isRevealed: true
		};

		// Consider editor selection and overwrite the state with it
		if (opts.seedSearchStringFromSelection) {
			let selectionSearchString = this.getSelectionSearchString();
			if (selectionSearchString) {
				if (this._state.isRegex) {
					stateChanges.searchString = strings.escapeRegExpCharacters(selectionSearchString);
				} else {
					stateChanges.searchString = selectionSearchString;
				}
			}
		}

		let selection = this._editor.getSelection();

		stateChanges.searchScope = null;
		if (opts.seedSearchScopeFromSelection && selection.startLineNumber < selection.endLineNumber) {
			// Take search scope into account only if it is more than one line.
			stateChanges.searchScope = selection;
		}

		// Overwrite isReplaceRevealed
		if (opts.forceRevealReplace) {
			stateChanges.isReplaceRevealed = true;
		}

		this._state.change(stateChanges, false);

		if (!this._model) {
			this._model = new FindModelBoundToEditorModel(this._editor, this._state);
		}
	}

	public start(opts:IFindStartOptions): void {
		this._start(opts);
	}

	public moveToNextMatch(): boolean {
		if (this._model) {
			this._model.moveToNextMatch();
			return true;
		}
		return false;
	}

	public moveToPrevMatch(): boolean {
		if (this._model) {
			this._model.moveToPrevMatch();
			return true;
		}
		return false;
	}

	public replace(): boolean {
		if (this._model) {
			this._model.replace();
			return true;
		}
		return false;
	}

	public replaceAll(): boolean {
		if (this._model) {
			this._model.replaceAll();
			return true;
		}
		return false;
	}

	public selectAllMatches(): boolean {
		if (this._model) {
			this._model.selectAllMatches();
			this._editor.focus();
			return true;
		}
		return false;
	}
}
