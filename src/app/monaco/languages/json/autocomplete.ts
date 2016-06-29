import * as utils from "../../../../common/utils";
import * as monacoUtils from "../../monacoUtils";
import {getCompletionsAtPosition} from "./service/jsonCompletions2";

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
        const prefix = wordInfo.word;
        const offset = monacoUtils.positionToOffset(model, position);

        const result: monaco.languages.CompletionList = {
            isIncomplete: false,
            items:[]
        }

        if (!utils.isSupportedConfigFileForAutocomplete(filePath)){
            return Promise.resolve(result);
        }

        return getCompletionsAtPosition(model, position).then((res) => {
            return res;
        });
	}

	resolveCompletionItem(item: monaco.languages.CompletionItem, token: CancellationToken): Thenable<monaco.languages.CompletionItem> {
		return Promise.resolve(item);
	}
}
