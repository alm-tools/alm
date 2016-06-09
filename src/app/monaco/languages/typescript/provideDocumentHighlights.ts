import {cast, server} from "../../../../socket/socketClient";
import * as state from "../../../state/state";
import {onlyLastCallWithDelay} from "../../monacoUtils";
import CancellationToken = monaco.CancellationToken;
import Position = monaco.Position;

export function provideDocumentHighlights(model: monaco.editor.IReadOnlyModel, position: Position, token: CancellationToken): Promise<monaco.languages.DocumentHighlight[]> {
    const resource = model.uri;

    if (!state.inActiveProjectFilePath(model.filePath)) {
        return Promise.resolve([]);
    }

    return onlyLastCallWithDelay(()=>server.getOccurrencesAtPosition({
        filePath: model.filePath,
        editorPosition: {
            line: position.lineNumber - 1,
            ch: position.column - 1,
        }
    }), token).then(res => {
        // console.log(res.results); DEBUG
        return res.results.map(entry => {
            return <monaco.languages.DocumentHighlight>{
                range: {
                    startLineNumber: entry.start.line + 1,
                    startColumn: entry.start.ch + 1,
                    endLineNumber: entry.end.line + 1,
                    endColumn: entry.end.ch + 1,
                },
                kind: entry.isWriteAccess ? monaco.languages.DocumentHighlightKind.Write : monaco.languages.DocumentHighlightKind.Text
            };
        })
    });
    // return wireCancellationToken(token, this._worker(resource).then(worker => {
    // 	return worker.getOccurrencesAtPosition(resource.toString(), this._positionToOffset(resource, position));
    // }).then(entries => {
    // 	if (!entries) {
    // 		return;
    // 	}
    // 	return entries.map(entry => {
    // 		return <monaco.languages.DocumentHighlight>{
    // 			range: this._textSpanToRange(resource, entry.textSpan),
    // 			kind: entry.isWriteAccess ? monaco.languages.DocumentHighlightKind.Write : monaco.languages.DocumentHighlightKind.Text
    // 		};
    // 	});
    // }));
}
