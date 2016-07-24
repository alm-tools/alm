/**
 * Stuff from TypeScript Dir
 */

import * as path from "path";

/** A constant pointing you to the TypeScript dir */
export const typescriptDirectory = path.dirname(require.resolve('typescript')).split('\\').join('/');

/** Tells you if a filePath is inside the TypeScript dir (most likely some lib file) */
export const isFileInTypeScriptDir = (filePath: string) => filePath.startsWith(typescriptDirectory);

/** Returns you the filePath of a fileName from the TypeScript folder */
function fileFromLibFolder(fileName: string) {
    return path.join(typescriptDirectory, fileName).split('\\').join('/');
}

/** From the compiler's commandLineParser we find the `lib` to `fileName` mapping */
const libOption = ts.optionDeclarations.find(x=>x.name == "lib") as ts.CommandLineOptionOfListType;
const libToFileNameMap = libOption.element.type as ts.Map<string>;

/** Based on the compiler options returns you the lib files that should be included */
export const getDefaultLibFilePaths = (options: ts.CompilerOptions): string[] => {
    if (options.noLib) {
        return [];
    }
    if (options.lib) {
        /** Note: this might need to be more fancy at some point. E.g. user types `es6.array` but we need to get `es2015.array` */
        return options.lib.map((lib) => fileFromLibFolder(libToFileNameMap[lib]));
    }
    return [fileFromLibFolder(ts.getDefaultLibFileName(options))];
}
