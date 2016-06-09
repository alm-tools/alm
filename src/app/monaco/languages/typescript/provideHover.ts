import CancellationToken = monaco.CancellationToken;
import Position = monaco.Position;

export class ProvideHover {
    provideHover(model: monaco.editor.IReadOnlyModel, position: Position, token: CancellationToken): Promise<monaco.languages.Hover> {
        let resource = model.uri;

        return null;

        // return wireCancellationToken(token, this._worker(resource).then(worker => {
        //     return worker.getQuickInfoAtPosition(resource.toString(), this._positionToOffset(resource, position));
        // }).then(info => {
        //     if (!info) {
        //         return;
        //     }
        //     return <monaco.languages.Hover>{
        //         range: this._textSpanToRange(resource, info.textSpan),
        //         htmlContent: [{ text: ts.displayPartsToString(info.displayParts) }]
        //     };
        // }));
    }
}
