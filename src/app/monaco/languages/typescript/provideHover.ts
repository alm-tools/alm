import {cast, server} from "../../../../socket/socketClient";
import * as state from "../../../state/state";
import {onlyLastCallWithDelay} from "../../monacoUtils";
import CancellationToken = monaco.CancellationToken;
import Position = monaco.Position;

export class ProvideHover {
    provideHover(model: monaco.editor.IReadOnlyModel, pos: Position, token: CancellationToken): Promise<monaco.languages.Hover> {
        let filePath = model.filePath;

        if (!state.inActiveProjectFilePath(model.filePath)) {
            return null;
        }

        const position = model.getOffsetAt(pos);

        return server.quickInfo({
            filePath: filePath,
            position
        }).then(res => {
            // console.log(res); // DEBUG
            if (!res.valid) {
                return null;
            }
            /** Since we do not show `error` yet just return if no `info` */
            if (!res.info) {
                return null;
            }
            const result: monaco.languages.Hover = {
                range: {
                    startLineNumber: res.info.range.from.line + 1,
                    startColumn: res.info.range.from.ch + 1,
                    endLineNumber: res.info.range.to.line + 1,
                    endColumn: res.info.range.to.ch + 1,
                },
                contents: [
                    `***${res.info.name}***`
                ]
            }
            if (res.info.comment){
                result.contents.push('\n\n' + res.info.comment)
            }
            return result;
        });
    }
}
