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

        // // TODO: query the classifierCache
        // let indentOptions: ts.EditorOptions = {
        //     IndentSize: options.tabSize,
        //     TabSize: options.tabSize,
        //     NewLineCharacter: '\n',
        //     IndentStyle: ts.IndentStyle.Smart,
        //     ConvertTabsToSpaces: options.insertSpaces
        // }
        //
        // const post = classifierCache.getPositionOfLineAndCharacter(filePath, position.lineNumber - 1, position.column - 1);
        // classifierCache.getFormattingEditsAfterKeystroke({
        //     fileName: query.filePath, position , key: query.key, options: FormatCodeOptions
        // })

        return Promise.resolve([])
            .then(res => {
                return []
            })

        // return wireCancellationToken(token, this._worker(resource).then(worker => {
        // 	return worker.getFormattingEditsAfterKeystroke(resource.toString(),
        // 		this._positionToOffset(resource, position),
        // 		ch, FormatHelper._convertOptions(options));
        // }).then(edits => {
        // 	if (edits) {
        // 		return edits.map(edit => this._convertTextChanges(resource, edit));
        // 	}
        // }));
    }
}
