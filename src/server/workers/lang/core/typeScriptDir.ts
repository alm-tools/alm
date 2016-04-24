/**
 * Stuff from TypeScript Dir
 */

import * as path from "path";

function fileFromLibFolder(fileName:string){
    return path.join(path.dirname(require.resolve('ntypescript')), fileName).split('\\').join('/');
}

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
export const typescriptDirectory = path.dirname(require.resolve('ntypescript')).split('\\').join('/');
