import {cast, server} from "../../../../socket/socketClient";
import * as state from "../../../state/state";
import {onlyLastCallWithDelay} from "../../monacoUtils";
import CancellationToken = monaco.CancellationToken;
import Position = monaco.Position;

export class ProvideHover {
    provideHover(model: monaco.editor.IReadOnlyModel, position: Position, token: CancellationToken): Promise<monaco.languages.Hover> {
        let filePath = model.filePath;

        if (!state.inActiveProjectFilePath(model.filePath)) {
            return null;
        }

        return server.quickInfo({
            filePath: filePath,
            editorPosition: {
                line: position.lineNumber - 1,
                ch: position.column - 1
            }
        }).then(res => {
            // console.log(res); // DEBUG
            if (!res.valid) {
                return null;
            }
            const result: monaco.languages.Hover = {
                range: {
                    startLineNumber: res.info.range.from.line + 1,
                    startColumn: res.info.range.from.ch + 1,
                    endLineNumber: res.info.range.to.line + 1,
                    endColumn: res.info.range.to.ch + 1,
                },
                htmlContent: [
                    {text: res.info.name},
                ]
            }
            if (res.info.comment){
                result.htmlContent.push({formattedText: res.info.comment}) // Markdown doesn't work right now.
            }
            return result;
        });
    }
}
