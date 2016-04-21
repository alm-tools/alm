import {createMap, selectMany} from "../../../../common/utils";
import * as fmc from "../../../disk/fileModelCache";
import * as path from "path";
import * as fsu from "../../../utils/fsu";

/**
 * The files that you provide in a tsconfig.json might not be the *complete* set of files
 * We preprocess these files to add additional files based on the contents of these files
 */
export function increaseCompilationContext(files: string[]): string[] {

    var filesMap = createMap(files);
    var willNeedMoreAnalysis = (file: string) => {
        if (!filesMap[file]) {
            filesMap[file] = true;
            files.push(file);
            return true;
        } else {
            return false;
        }
    }

    var getReferencedOrImportedFiles = (files: string[]): string[] => {
        var referenced: string[][] = [];

        files.forEach(file => {
            try {
                var content = fmc.getOrCreateOpenFile(file).getContents();
            }
            catch (ex) {
                // if we cannot read a file for whatever reason just quit
                return;
            }
            var preProcessedFileInfo = ts.preProcessFile(content, true),
                dir = path.dirname(file);

            let extensions = ['.ts', '.d.ts', '.tsx'];
            function getIfExists(filePathNoExt: string) {
                for (let ext of extensions) {
                    if (fsu.existsSync(filePathNoExt + ext)) {
                        return filePathNoExt + ext;
                    }
                }
            }

            referenced.push(
                preProcessedFileInfo.referencedFiles.map(fileReference => {
                    // We assume reference paths are always relative
                    var file = path.resolve(dir, fsu.consistentPath(fileReference.fileName));
                    // Try by itself then with extensions
                    if (fsu.existsSync(file)) {
                        return file;
                    }
                    return getIfExists(file);
                }).filter(file => !!file)
                    .concat(
                    preProcessedFileInfo.importedFiles
                        .filter((fileReference) => fsu.isRelative(fileReference.fileName))
                        .map(fileReference => {
                            let fileNoExt = path.resolve(dir, fileReference.fileName);
                            let file = getIfExists(fileNoExt);
                            if (!file) {
                                file = getIfExists(`${file}/index`);
                            }
                            return file;
                        }).filter(file => !!file)
                    )
            );
        });

        return selectMany(referenced);
    }

    var more = getReferencedOrImportedFiles(files)
        .filter(willNeedMoreAnalysis);
    while (more.length) {
        more = getReferencedOrImportedFiles(files)
            .filter(willNeedMoreAnalysis);
    }

    return files;
}
