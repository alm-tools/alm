/**
 * loads and parses `editorconfig` into the TypeScript `EditorOptions`
 */
import * as editorconfig from "editorconfig";
import {EditorOptions} from "../../common/types";
import * as os from "os";

export function getEditorOptions(filePath: string): EditorOptions {
    const config = editorconfig.parseSync(filePath);

    // console.log(filePath, config); // DEBUG

    // Convert editorconfig to EditorOptions
    const newLineCharacter =
        config.end_of_line && config.end_of_line === 'lf' ? '\n'
        : config.end_of_line && config.end_of_line === 'crlf' ? '\r\n'
        : os.EOL;

    const indentSize =
        config.indent_size || 4;


    return {
        indentSize,
        tabSize: 4,
        newLineCharacter,
        convertTabsToSpaces: true,
    }
}
