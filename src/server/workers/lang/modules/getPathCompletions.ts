import * as path from "path";
import {Project} from "../core/project";
import * as utils from "../../../../common/utils";
import * as fsu from "../../../utils/fsu";
import * as types from "../../../../common/types";
import {Types} from "../../../../socket/socketContract";

import fuzzaldrin = require('fuzzaldrin');

/** From https://github.com/Microsoft/TypeScript/pull/2173/files */
function getExternalModuleNames(program: ts.Program): string[] {
    var entries: string[] = [];

    program.getSourceFiles().forEach(sourceFile => {

        // Look for ambient external module declarations
        ts.forEachChild(sourceFile, child => {
            if (child.kind === ts.SyntaxKind.ModuleDeclaration && (<ts.ModuleDeclaration>child).name.kind === ts.SyntaxKind.StringLiteral) {
                entries.push((<ts.ModuleDeclaration>child).name.text);
            }
        });
    });

    return entries;
}

export interface GetRelativePathsInProjectResponse {
    files: {
        name: string;
        relativePath: string;
        fullPath: string;
    }[];
    endsInPunctuation: boolean;
}

export interface GetPathCompletions {
    project: Project;
    filePath: string;
    prefix: string;
    includeExternalModules: boolean;
}

export function getPathCompletions(query: GetPathCompletions): GetRelativePathsInProjectResponse {
    var project = query.project;
    var sourceDir = path.dirname(query.filePath);
    var filePaths = project.configFile.project.files.filter(p=> p !== query.filePath);
    var files: {
        name: string;
        relativePath: string;
        fullPath: string;
    }[] = [];

    if (query.includeExternalModules) {
        var externalModules = getExternalModuleNames(project.languageService.getProgram());
        externalModules.forEach(e=> files.push({
            name: `${e}`,
            relativePath: e,
            fullPath: e
        }));
    }

    filePaths.forEach(p=> {
        files.push({
            name: path.basename(p, '.ts'),
            relativePath: fsu.removeExt(fsu.makeRelativePath(sourceDir, p)),
            fullPath: p
        });
    });

    var endsInPunctuation: boolean = utils.prefixEndsInPunctuation(query.prefix);

    if (!endsInPunctuation)
        files = fuzzaldrin.filter(files, query.prefix, { key: 'name' });

    var response: GetRelativePathsInProjectResponse = {
        files: files,
        endsInPunctuation: endsInPunctuation
    };

    return response;
}
