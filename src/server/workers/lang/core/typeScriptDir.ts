/**
 * Stuff from TypeScript Dir
 */

import * as path from "path";

export const getDefaultLibFilePath = (options: ts.CompilerOptions) => {
    var filename = ts.getDefaultLibFileName(options);
    return (path.join(path.dirname(require.resolve('ntypescript')), filename)).split('\\').join('/');
}
export const typescriptDirectory = path.dirname(require.resolve('ntypescript')).split('\\').join('/');
