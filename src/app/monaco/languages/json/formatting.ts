import * as jsonFormatter from "./service/jsonFormatter";

import CancellationToken = monaco.CancellationToken;
import Position = monaco.Position;
import Range = monaco.Range;
import Thenable = monaco.Thenable;


export class DocumentFormattingEditProvider implements monaco.languages.DocumentFormattingEditProvider {

	public provideDocumentFormattingEdits(model: monaco.editor.IReadOnlyModel, options: monaco.languages.FormattingOptions, token: CancellationToken): Thenable<monaco.editor.ISingleEditOperation[]> {
        return Promise.resolve(jsonFormatter.format(model,model.getFullModelRange(), options));
	}
}

export class DocumentRangeFormattingEditProvider implements monaco.languages.DocumentRangeFormattingEditProvider {

	public provideDocumentRangeFormattingEdits(model: monaco.editor.IReadOnlyModel, range: Range, options: monaco.languages.FormattingOptions, token: CancellationToken): Thenable<monaco.editor.ISingleEditOperation[]> {
        return Promise.resolve(jsonFormatter.format(model, range, options));
	}
}
