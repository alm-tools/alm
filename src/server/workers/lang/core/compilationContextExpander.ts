import {createMap, selectMany} from "../../../../common/utils";
import * as fmc from "../../../disk/fileModelCache";
import * as path from "path";
import * as fsu from "../../../utils/fsu";

/**
 * The files that you provide in a tsconfig.json might not be the *complete* set of files
 * We preprocess these files to add additional files based on the contents of these files
 */
export function increaseCompilationContext(files: string[], allowJs: boolean): string[] {

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
            if (allowJs) {
                extensions.push('.js');
                extensions.push('.jsx');
            }
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

/** There can be only one typing by name */
interface Typings {
    [name: string]: {
        filePath: string;
        /** Right now its just INF as we don't do version checks. First one wins! */
        version: number; // (Simple : maj * 1000000 + min). Don't care about patch
    };
}

/**
 *  Spec
 *  We will expand on files making sure that we don't have a `typing` with the same name
 *  Also if two node_modules reference a similar sub project (and also recursively) then the one with latest `version` field wins
 */
export function getDefinitionsForNodeModules(projectDir: string, files: string[]): { ours: string[]; implicit: string[], packagejson: string[] } {
    let packagejson = [];

    /** TODO use later when we care about versions */
    function versionStringToNumber(version: string): number {
        var [maj, min, patch] = version.split('.');
        return parseInt(maj) * 1000000 + parseInt(min);
    }

    var typings: Typings = {};

    // Find our `typings` (anything in a typings folder with extension `.d.ts` is considered a typing)
    // These are INF powerful
    var ourTypings = files
        .filter(f=> path.basename(path.dirname(f)) == 'typings' && f.endsWith('.d.ts')
            || path.basename(path.dirname(path.dirname(f))) == 'typings' && f.endsWith('.d.ts'));
    ourTypings.forEach(f=> typings[path.basename(f)] = { filePath: f, version: Infinity });
    var existing = createMap(files.map(fsu.consistentPath));

    function addAllReferencedFilesWithMaxVersion(file: string) {
        var dir = path.dirname(file);
        try {
            var content = fmc.getOrCreateOpenFile(file).getContents();
        }
        catch (ex) {
            // if we cannot read a file for whatever reason just quit
            return;
        }
        var preProcessedFileInfo = ts.preProcessFile(content, true);
        var files = preProcessedFileInfo.referencedFiles.map(fileReference => {
            // We assume reference paths are always relative
            var file = path.resolve(dir, fileReference.fileName);
            // Try by itself, .d.ts
            if (fsu.existsSync(file)) {
                return file;
            }
            if (fsu.existsSync(file +'.tsx')){
                return file + '.tsx';
            }
            if (fsu.existsSync(file + '.d.ts')) {
                return file + '.d.ts';
            }
        }).filter(f=> !!f);

        // Only ones we don't have by name yet
        // TODO: replace INF with an actual version
        files = files
            .filter(f => !typings[path.basename(f)] || typings[path.basename(f)].version > Infinity);
        // Add these
        files.forEach(f => typings[path.basename(f)] = { filePath: f, version: Infinity });
        // Keep expanding
        files.forEach(f=> addAllReferencedFilesWithMaxVersion(f));
    }

    // Keep going up till we find node_modules
    // at that point read the `package.json` for each file in node_modules
    // And then if that package.json has `typescript.definition` we import that file
    try {
        var node_modules = fsu.travelUpTheDirectoryTreeTillYouFind(projectDir, 'node_modules', true);

        // For each sub directory of node_modules look at package.json and then `typescript.definition`
        var moduleDirs = fsu.getDirs(node_modules);
        for (let moduleDir of moduleDirs) {
            try {
                var package_json = JSON.parse(fmc.getOrCreateOpenFile(`${moduleDir}/package.json`).getContents());
                packagejson.push(`${moduleDir}/package.json`);
            }
            catch (ex) {
                // Can't read package.json ... no worries ... move on to other modules
                continue;
            }
            if (package_json.typescript && package_json.typescript.definition) {

                let file = path.resolve(moduleDir, './', package_json.typescript.definition);

                /** If the file configuration points to a valid file */
                if (fsu.existsSync(file)) {
                    typings[path.basename(file)] = {
                        filePath: file,
                        version: Infinity
                    };
                    // Also add any files that this `.d.ts` references as long as they don't conflict with what we have
                    addAllReferencedFilesWithMaxVersion(file);
                }
            }
        }

    }
    catch (ex) {
        if (ex.message == "not found") {
            // Sure we didn't find node_modules
            // Thats cool
        }
        // this is best effort only at the moment
        else {
            console.error('Failed to read package.json from node_modules due to error:', ex, ex.stack);
        }
    }

    var all = Object.keys(typings)
        .map(typing => typings[typing].filePath)
        .map(x=> fsu.consistentPath(x));
    var implicit = all
        .filter(x=> !existing[x]);
    var ours = all
        .filter(x=> existing[x]);

    return { implicit, ours, packagejson };
}
