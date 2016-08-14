import {cast, server} from "../../../../socket/socketClient";
import {Types} from "../../../../socket/socketContract";
import * as state from "../../../state/state";
import * as classifierCache from "../../model/classifierCache";
import CancellationToken = monaco.CancellationToken;
import Thenable = monaco.Thenable;
import Position = monaco.Position;

export class DocumentFormatter implements monaco.languages.DocumentFormattingEditProvider {
    provideDocumentFormattingEdits(model: monaco.editor.IReadOnlyModel, options: monaco.languages.FormattingOptions, token: monaco.CancellationToken): monaco.editor.ISingleEditOperation[] | Promise<monaco.editor.ISingleEditOperation[]> {

        const filePath = model.filePath;
        if (!state.inActiveProjectFilePath(model.filePath)) {
            return Promise.resolve([]);
        }

        return server.formatDocument({
            filePath, editorOptions: model._editorOptions
        }).then(res => {
            if (token.isCancellationRequested) return [];
            return res.edits.map(formattingEditToSingleEditOperation);
        });
    }
}


export class DocumentRangeFormatter implements monaco.languages.DocumentRangeFormattingEditProvider {
    provideDocumentRangeFormattingEdits(model: monaco.editor.IReadOnlyModel, range: monaco.Range, options: monaco.languages.FormattingOptions, token: monaco.CancellationToken): monaco.editor.ISingleEditOperation[] | Promise<monaco.editor.ISingleEditOperation[]> {

        const filePath = model.filePath;
        if (!state.inActiveProjectFilePath(model.filePath)) {
            return Promise.resolve([]);
        }

        return server.formatDocumentRange({
            filePath,
            editorOptions: model._editorOptions,
            from: {
                line: range.startLineNumber - 1,
                ch: range.startColumn - 1,
            },
            to: {
                line: range.endLineNumber - 1,
                ch: range.endColumn - 1,
            }
        }).then(res => {
            if (token.isCancellationRequested) return [];
            return res.edits.map(formattingEditToSingleEditOperation);
        });
    }
}



export class FormatOnTypeAdapter implements monaco.languages.OnTypeFormattingEditProvider {

    get autoFormatTriggerCharacters() {
        return [';', '}', '\n'];
    }

    provideOnTypeFormattingEdits(model: monaco.editor.IReadOnlyModel, position: Position, ch: string, options: monaco.languages.FormattingOptions, token: CancellationToken): Thenable<monaco.editor.ISingleEditOperation[]> {
        const filePath = model.filePath;
        const empty = Promise.resolve([]);

        if (!state.inActiveProjectFilePath(model.filePath)) {
            return empty;
        }

        /**
         * If the user just did a docblockr enter
         * And we insert stuff like `* `
         * Then ts will remove the trailing space.
         * We want to keep that so check for it
         */
        const lineContent = model.getLineContent(position.lineNumber);
        if (
            lineContent.endsWith('* ')
            || lineContent.endsWith('// ')
            || lineContent.endsWith('/// ')
        ) {
            return empty;
        }

        return server.getFormattingEditsAfterKeystroke({
            filePath,
            editorPosition: {
                line: position.lineNumber - 1,
                ch: position.column - 1
            },
            key: ch,
            editorOptions: model._editorOptions
        }).then((res) => {
            if (token.isCancellationRequested) return [];
            return res.edits.map(formattingEditToSingleEditOperation);
        });
    }
}

/** Utility */
function formattingEditToSingleEditOperation(edit: Types.FormattingEdit): monaco.editor.ISingleEditOperation {
    const result: monaco.editor.ISingleEditOperation = {
        range: {
            startLineNumber: edit.from.line + 1,
            startColumn: edit.from.ch + 1,
            endLineNumber: edit.to.line + 1,
            endColumn: edit.to.ch + 1
        },
        text: edit.newText
    };
    return result;
}
