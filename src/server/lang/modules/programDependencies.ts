import {TypeScriptConfigFileDetails, pathIsRelative} from "../core/tsconfig";
import {consistentPath} from "../../utils/fsu";
import tsconfig = require("../core/tsconfig");
import * as path from "path";
import * as fs from "fs";
import {getSourceFileImports} from "./astUtils";
import {Types} from "../../../socket/socketContract";

export function getProgramDependencies(projectFile: TypeScriptConfigFileDetails, program: ts.Program): Types.FileDependency[] {
    var links: Types.FileDependency[] = [];
    var projectDir = projectFile.projectFileDirectory;
    for (let file of program.getSourceFiles()) {
        let filePath = file.fileName;
        var dir = path.dirname(filePath);

        var targets = getSourceFileImports(file)
            .filter((fileReference) => pathIsRelative(fileReference))
            .map(fileReference => {
            var file = path.resolve(dir, fileReference + '.ts');
            if (!fs.existsSync(file)) {
                file = path.resolve(dir, fileReference + '.d.ts');
            }
            return file;
        });

        for (let target of targets) {
            var targetPath = consistentPath(path.relative(projectDir, consistentPath(target)));
            var sourcePath = consistentPath(path.relative(projectDir, filePath));
            links.push({
                sourcePath,
                targetPath
            })
        }
    }
    return links;
}
