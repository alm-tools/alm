import {consistentPath} from "../../../utils/fsu";
import tsconfig = require("../core/tsconfig");
import * as path from "path";
import * as fs from "fs";
import {isRelative} from "../../../utils/fsu";
import {getSourceFileImports} from "./astUtils";
import {Types} from "../../../../socket/socketContract";
import * as types from "../../../../common/types";

export function getProgramDependencies(projectFile: types.TypeScriptConfigFileDetails, program: ts.Program): Types.FileDependency[] {
    var links: Types.FileDependency[] = [];
    var projectDir = projectFile.projectFileDirectory;
    for (let file of program.getSourceFiles()) {
        let filePath = file.fileName;
        var dir = path.dirname(filePath);

        var targets = getSourceFileImports(file)
            .filter((fileReference) => isRelative(fileReference))
            .map(fileReference => {
                var file = path.resolve(dir, fileReference + '.ts');
                if (!fs.existsSync(file)) {
                    file = path.resolve(dir, fileReference + '.tsx');
                }
                if (!fs.existsSync(file)) {
                    /** Do not resolve to a `.d.ts` file as it makes no sense to analyze those */
                    return null;
                }
                return file;
            })
            .filter(x => !!x);

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
