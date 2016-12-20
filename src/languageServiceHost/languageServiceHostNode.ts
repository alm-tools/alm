import * as lsh from "./languageServiceHost";
import * as typescriptDir from '../server/workers/lang/core/typeScriptDir';

/**
 * Similar to the base, just adds stuff that uses `require.resolve` to load lib.d.ts
 */
export class LanguageServiceHost extends lsh.LanguageServiceHost {
    getDefaultLibFileName = () => {
        return typescriptDir.getDefaultLibFilePaths(this.compilerOptions)[0];
    }
}
