import * as lsh from "./languageServiceHost";
import * as typescriptDir from '../server/workers/lang/core/typeScriptDir';
import * as fs from 'fs';

/**
 * Similar to the base, just adds stuff that uses `require.resolve` to load lib.d.ts
 */
export class LanguageServiceHost extends lsh.LanguageServiceHost {
    getDefaultLibFileName = () => {
        /** TypeScript doesn't handle `undefined` here gracefully, but it handles an empty string just fine */
        return typescriptDir.getDefaultLibFilePaths(this.compilerOptions)[0] || '';
    }

    /** alm demo service */
    addAlmDemo = () => {
        this.addScript('alm.d.ts', fs.readFileSync(__dirname + '/alm.d.ts').toString());
        return this;
    }
}
