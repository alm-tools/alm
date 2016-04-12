/**
 * loads and parses `editorconfig` into the TypeScript `EditorOptions`
 */
import * as editorconfig from "editorconfig";
import {EditorOptions, IndentStyle} from "ntypescript";
import * as os from "os";
export type EditorOptions = EditorOptions;

export function getEditorOptions(filePath: string): EditorOptions {
    const config = editorconfig.parseSync(filePath);

    // TODO: convert config to options

    return {
        IndentSize: 4,
        TabSize: 4,
        NewLineCharacter: os.EOL,
        ConvertTabsToSpaces: true,
        IndentStyle: IndentStyle.Smart
    }
}
