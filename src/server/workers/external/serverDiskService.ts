/**
 * Provides features to navigate the server disk.
 * Used to power *open file* and *change working directory*
 */
/** imports */
import * as types from "../../../common/types";
import * as fs from "fs";

export const getDirItems = (dirPath: string): types.FilePath[] => {
    const items = fs.readdirSync(dirPath);
    const result: types.FilePath[]
        = items
            .map(filePath => ({ filePath, stat: fs.statSync(filePath) }))
            .filter(({stat}) => stat.isFile() || stat.isDirectory())
            .map(({filePath, stat}) =>
                fs.statSync(filePath).isFile()
                    ? { type: types.FilePathType.File, filePath }
                    : { type: types.FilePathType.Dir, filePath });
    return [];
}
