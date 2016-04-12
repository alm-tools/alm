/**
 * loads and parses `editorconfig` into the TypeScript `EditorOptions`
 */
import * as editorconfig from "editorconfig";
import {EditorOptions} from "../../common/types";
import * as os from "os";

export function getEditorOptions(filePath: string): EditorOptions {
    const config = editorconfig.parseSync(filePath);

    // TODO: convert config to options
    // console.log(config);

    return {
        indentSize: 4,
        tabSize: 4,
        newLineCharacter: os.EOL,
        convertTabsToSpaces: true,
    }
}
