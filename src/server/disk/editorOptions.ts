/**
 * loads and parses `editorconfig` into the TypeScript `EditorOptions`
 */
import * as editorconfig from "editorconfig";
import {EditorOptions} from "../../common/types";
import * as os from "os";

export function getEditorOptions(filePath: string): EditorOptions {

    /** Note: any thing not defined comes back as `undefined` (which is good) */
    const config = editorconfig.parseSync(filePath);

    // console.log(filePath, config); // DEBUG

    /**
     * Convert editorconfig to EditorOptions
     */

    // CR sounds like a dumb option. I am treating it as same as os.EOL
    const end_of_line = config.end_of_line || 'os';
    const newLineCharacter =
        end_of_line && config.end_of_line === 'lf' ? '\n'
        : end_of_line && config.end_of_line === 'crlf' ? '\r\n'
        : os.EOL;

    const indent_style = config.indent_style || 'space';
    const convertTabsToSpaces =
        indent_style === 'space' ? true : false;

    // TODO: consolidate tabSize (its indentSize or tabWidth)
    // Similar to https://github.com/editorconfig/editorconfig-vscode/blob/73d1e7c00de20db83fd47b1d0ab3b0ffc5696ae0/src/Utils.ts#L14-L26
    const tabSize =
        config.indent_size || config.tab_width || 2;

    const trimTrailingWhitespace = config.trim_trailing_whitespace || false;
    const insertFinalNewline = config.insert_final_newline == undefined ? false : config.insert_final_newline;

    return {
        tabSize,
        newLineCharacter,
        convertTabsToSpaces,
        trimTrailingWhitespace,
        insertFinalNewline,
    }
}
