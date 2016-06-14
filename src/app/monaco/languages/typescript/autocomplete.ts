import {cast, server} from "../../../../socket/socketClient";
import {Types} from "../../../../socket/socketContract";
import * as state from "../../../state/state";
import * as classifierCache from "../../../codemirror/mode/classifierCache";
import * as utils from "../../../../common/utils";
import CancellationToken = monaco.CancellationToken;
import Thenable = monaco.Thenable;
import Position = monaco.Position;

/**
 * Provides utilities to perform various line,ch,position,range conversions 🌹
 */
export abstract class Adapter {
	protected _positionToOffset(model: monaco.editor.IReadOnlyModel, position: monaco.IPosition): number {
		return model.getOffsetAt(position);
	}

	protected _offsetToPosition(model: monaco.editor.IReadOnlyModel, offset: number): monaco.IPosition {
		return model.getPositionAt(offset);
	}

	protected _textSpanToRange(model: monaco.editor.IReadOnlyModel, span: ts.TextSpan): monaco.IRange {
		let p1 = this._offsetToPosition(model, span.start);
		let p2 = this._offsetToPosition(model, span.start + span.length);
		let {lineNumber: startLineNumber, column: startColumn} = p1;
		let {lineNumber: endLineNumber, column: endColumn} = p2;
		return { startLineNumber, startColumn, endLineNumber, endColumn };
	}
}

/**
 * You are allowed to create your own completion item as long as you provide what monaco needs
 */
interface MyCompletionItem extends monaco.languages.CompletionItem {
    filePath: string,
    position: number,
}

/**
 * Autocomplete
 */
export class SuggestAdapter extends Adapter implements monaco.languages.CompletionItemProvider {

	public get triggerCharacters(): string[] {
		return ['.'];
	}

	provideCompletionItems(model:monaco.editor.IReadOnlyModel, position:Position, token:CancellationToken): Promise<monaco.languages.CompletionItem[]> {
		const wordInfo = model.getWordUntilPosition(position);
		const filePath = model.filePath;
		const offset = this._positionToOffset(model, position);

		return server
            .getCompletionsAtPosition({
                prefix: wordInfo.word,
                filePath,
                position: offset
            })
            .then(info => {
    			if (!info) {
    				return;
    			}
    			let suggestions: MyCompletionItem[] = info.completions.map(entry => {
    				return {
    					label: entry.name,
    					kind: SuggestAdapter.convertKind(entry.kind),

                        // MyCompletionItem
                        position: offset,
                        filePath,
    				};
    			});

    			return suggestions;
    		});
	}

	resolveCompletionItem(item: monaco.languages.CompletionItem, token: CancellationToken): Promise<monaco.languages.CompletionItem> {

		let myItem = item as MyCompletionItem;
		const filePath = myItem.filePath;
		const position = myItem.position;

		return server
            .getCompletionEntryDetails({filePath,position, label:myItem.label})
            .then(res => {
                // You basically return the same thing with comments if any
    			if (!res.display && !res.comment) {
    				return myItem;
    			}
                /** The names here are what monaco expects */
                const detail = res.display, documentation = res.comment;
                return utils.extend(myItem, { detail, documentation });
	        });
	}

	private static convertKind(kind: string): monaco.languages.CompletionItemKind {
		switch (kind) {
			case Kind.primitiveType:
			case Kind.keyword:
				return monaco.languages.CompletionItemKind.Keyword;
			case Kind.variable:
			case Kind.localVariable:
				return monaco.languages.CompletionItemKind.Variable;
			case Kind.memberVariable:
			case Kind.memberGetAccessor:
			case Kind.memberSetAccessor:
				return monaco.languages.CompletionItemKind.Field;
			case Kind.function:
			case Kind.memberFunction:
			case Kind.constructSignature:
			case Kind.callSignature:
			case Kind.indexSignature:
				return monaco.languages.CompletionItemKind.Function;
			case Kind.enum:
				return monaco.languages.CompletionItemKind.Enum;
			case Kind.module:
				return monaco.languages.CompletionItemKind.Module;
			case Kind.class:
				return monaco.languages.CompletionItemKind.Class;
			case Kind.interface:
				return monaco.languages.CompletionItemKind.Interface;
			case Kind.warning:
				return monaco.languages.CompletionItemKind.File;
		}

		return monaco.languages.CompletionItemKind.Property;
	}
}


export class Kind {
	public static unknown:string = '';
	public static keyword:string = 'keyword';
	public static script:string = 'script';
	public static module:string = 'module';
	public static class:string = 'class';
	public static interface:string = 'interface';
	public static type:string = 'type';
	public static enum:string = 'enum';
	public static variable:string = 'var';
	public static localVariable:string = 'local var';
	public static function:string = 'function';
	public static localFunction:string = 'local function';
	public static memberFunction:string = 'method';
	public static memberGetAccessor:string = 'getter';
	public static memberSetAccessor:string = 'setter';
	public static memberVariable:string = 'property';
	public static constructorImplementation:string = 'constructor';
	public static callSignature:string = 'call';
	public static indexSignature:string = 'index';
	public static constructSignature:string = 'construct';
	public static parameter:string = 'parameter';
	public static typeParameter:string = 'type parameter';
	public static primitiveType:string = 'primitive type';
	public static label:string = 'label';
	public static alias:string = 'alias';
	public static const:string = 'const';
	public static let:string = 'let';
	public static warning:string = 'warning';
}