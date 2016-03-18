import fmc = require('../../../disk/fileModelCache');
import * as lsh from "../../../../languageServiceHost/languageServiceHost";

/**
 * Lib file handling in the backend.
 */
import path = require('path');
export var getDefaultLibFilePath = (options: ts.CompilerOptions) => {
    var filename = ts.getDefaultLibFileName(options);
    return (path.join(path.dirname(require.resolve('ntypescript')), filename)).split('\\').join('/');
}
export var typescriptDirectory = path.dirname(require.resolve('ntypescript')).split('\\').join('/');


/**
 * Extension: Just adds stuff that uses `fmc` or uses `require.resolve` to load lib.d.ts
 */
export class LanguageServiceHost extends lsh.LanguageServiceHost {
    constructor(compilerOptions: ts.CompilerOptions) {
        super(compilerOptions);
        // Add the `lib.d.ts`
        if (!compilerOptions.noLib) {
            this.addScript(getDefaultLibFilePath(compilerOptions));
        }
    }

    addScript(fileName: string, content?: string) {
        try {
            if (!content) {
                content = fmc.getOrCreateOpenFile(fileName).getContents();
            }
        }
        catch (ex) { // if we cannot read the file for whatever reason
            // TODO: in next version of TypeScript langauge service we would add it with "undefined"
            // For now its just an empty string
            content = '';
        }

        super.addScript(fileName, content);
    }

    /** Great for error messages etc */
    getPositionFromTextSpanWithLinePreview = (fileName: string, textSpan: ts.TextSpan): { position: EditorPosition, preview: string } => {
        var position = this.getLineAndCharacterOfPosition(fileName, textSpan.start);
        var preview = fmc.getOrCreateOpenFile(fileName).getLinePreview(position.line);
        return { preview, position };
    }

    ////////////////////////////////////////
    // ts.LanguageServiceHost implementation
    ////////////////////////////////////////
    getDefaultLibFileName = ()=>getDefaultLibFilePath(this.compilerOptions);
}
