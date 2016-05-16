/**
 * Stuff from TypeScript Dir
 */

import * as path from "path";

/** Returns you the filePath of a fileName from the TypeScript folder */
function fileFromLibFolder(fileName: string) {
    return path.join(path.dirname(require.resolve('ntypescript')), fileName).split('\\').join('/');
}

/** Based on the compiler options returns you the lib files that should be included */
export const getDefaultLibFilePaths = (options: ts.CompilerOptions): string[] => {
    if (options.noLib) {
        return [];
    }
    if (options.lib) {
        /** Note: this might need to be more fancy at some point. E.g. user types `es6.array` but we need to get `es2015.array` */
        return options.lib.map((fileName) => fileFromLibFolder(`lib.${fileName}.d.ts`));
    }
    return [fileFromLibFolder(ts.getDefaultLibFileName(options))];
}

/** A constant pointing you to the TypeScript dir */
export const typescriptDirectory = path.dirname(require.resolve('ntypescript')).split('\\').join('/');

/** Tells you if a filePath is inside the TypeScript dir (most likely some lib file) */
export const isFileInTypeScriptDir = (filePath: string) => filePath.startsWith(typescriptDirectory);
