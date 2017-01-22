import * as lsh from "./languageServiceHost";
import * as typescriptDir from '../server/workers/lang/core/typeScriptDir';

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
        this.addScript('alm.d.ts', `
        declare module "alm" {
            export function render(node:any): void;
        }
        `);
        return this;
    }
}
