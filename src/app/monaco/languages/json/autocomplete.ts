import CancellationToken = monaco.CancellationToken;
import Thenable = monaco.Thenable;
import Position = monaco.Position;

export class CompletionAdapter implements monaco.languages.CompletionItemProvider {

	public get triggerCharacters(): string[] {
		return [' ', ':'];
	}

	provideCompletionItems(model: monaco.editor.IReadOnlyModel, position: Position, token: CancellationToken): Thenable<monaco.languages.CompletionList> {
		const wordInfo = model.getWordUntilPosition(position);
		const filePath = model.filePath;

        const result: monaco.languages.CompletionList = {
            isIncomplete: false,
            items:[]
        }

		return Promise.resolve(result);
	}

	resolveCompletionItem(item: monaco.languages.CompletionItem, token: CancellationToken): Thenable<monaco.languages.CompletionItem> {
		return Promise.resolve(item);
	}
}
