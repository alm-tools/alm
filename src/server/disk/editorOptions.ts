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

    const indentSize =
        config.indent_size || 2;

    const tabSize =
        config.tab_width || 2;

    const indent_style = config.indent_style || 'space';
    const convertTabsToSpaces =
        indent_style === 'space' ? true : false;

    const trimTrailingWhitespace = config.trim_trailing_whitespace || false;

    return {
        indentSize,
        tabSize,
        newLineCharacter,
        convertTabsToSpaces,
        trimTrailingWhitespace,
    }
}
