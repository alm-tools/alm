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

    getScriptSnapshot(fileName: string): ts.IScriptSnapshot {
        let snap = super.getScriptSnapshot(fileName);
        if (!snap) {
            // This script should be a part of the project if it exists
            // But we only do this in the server
            if (typeof process !== "undefined" && typeof require !== "undefined") {
                if (require('fs').existsSync(fileName)) {
                    try {
                        /** Just because the file exists doesn't mean we can *read* it. Hence the try */
                        const contents = require('fs').readFileSync(fileName, 'utf8');
                        this.addScript(fileName, contents);
                        snap = super.getScriptSnapshot(fileName);
                        this.incrementallyAddedFile.emit({filePath:fileName});
                    }
                    catch (e) {

                    }
                }
            }
        }
        return snap;
    }

    /** alm demo service */
    addAlmDemo = () => {
        this.addScript('alm.d.ts', fs.readFileSync(__dirname + '/alm.d.ts').toString());
        return this;
    }
}
