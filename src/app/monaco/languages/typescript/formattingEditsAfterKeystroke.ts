import {cast, server} from "../../../../socket/socketClient";
import * as state from "../../../state/state";
import * as classifierCache from "../../../codemirror/mode/classifierCache";
import CancellationToken = monaco.CancellationToken;
import Thenable = monaco.Thenable;
import Position = monaco.Position;

export class FormatOnTypeAdapter implements monaco.languages.OnTypeFormattingEditProvider {

    get autoFormatTriggerCharacters() {
        return [';', '}', '\n'];
    }

    provideOnTypeFormattingEdits(model: monaco.editor.IReadOnlyModel, position: Position, ch: string, options: monaco.languages.IFormattingOptions, token: CancellationToken): Thenable<monaco.editor.ISingleEditOperation[]> {
        const filePath = model.filePath;

        if (!state.inActiveProjectFilePath(model.filePath)) {
            return Promise.resolve([]);
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
            return res.edits.map(e=>{
                const result: monaco.editor.ISingleEditOperation = {
                    range: {
                        startLineNumber: e.from.line + 1,
                        startColumn: e.from.ch + 1,
                        endLineNumber: e.to.line + 1,
                        endColumn: e.to.ch + 1
                    },
                    text: e.newText
                };
                return result;
            })
        });
    }
}
