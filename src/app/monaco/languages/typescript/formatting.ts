
export class DocumentFormatter implements monaco.languages.DocumentFormattingEditProvider {
    provideDocumentFormattingEdits(model: monaco.editor.IReadOnlyModel, options: monaco.languages.IFormattingOptions, token: monaco.CancellationToken): monaco.editor.ISingleEditOperation[] | Promise<monaco.editor.ISingleEditOperation[]> {
        // TODO: mon
        console.log('TODO: whole document format')
        return null;
    }
}


export class DocumentRangeFormatter implements monaco.languages.DocumentRangeFormattingEditProvider {
    provideDocumentRangeFormattingEdits(model: monaco.editor.IReadOnlyModel, range: monaco.Range, options: monaco.languages.IFormattingOptions, token: monaco.CancellationToken): monaco.editor.ISingleEditOperation[] | Promise<monaco.editor.ISingleEditOperation[]> {
        // TODO: mon
        console.log('TODO: range format')
        return null;
    }
}
