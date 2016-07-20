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
                let name = (<ts.ModuleDeclaration>child).name.text;
                if (name.endsWith('/index')) {
                    name = utils.getDirectory(name);
                }
                entries.push(name);
            }
        });
    });

    return entries;
}

/** This is great for auto import */
export interface GetPathCompletions {
    prefix: string;
    project: Project;
    filePath: string;
}
/** This is great for autocomplete */
export interface GetPathCompletionsForAutocomplete extends GetPathCompletions {
    position: number;
}

function isStringLiteralInES6ImportDeclaration(node: ts.Node) {
    if (node.kind !== ts.SyntaxKind.StringLiteral) return false;
    while (node.parent.kind !== ts.SyntaxKind.SourceFile
        && node.parent.kind !== ts.SyntaxKind.ImportDeclaration) {
        node = node.parent;
    }
    return node.parent && node.parent.kind === ts.SyntaxKind.ImportDeclaration;
}
function isStringLiteralInImportRequireDeclaration(node: ts.Node) {
    if (node.kind !== ts.SyntaxKind.StringLiteral) return false;
    while (node.parent.kind !== ts.SyntaxKind.SourceFile
        && node.parent.kind !== ts.SyntaxKind.ImportEqualsDeclaration) {
        node = node.parent;
    }
    return node.parent && node.parent.kind === ts.SyntaxKind.ImportEqualsDeclaration;
}

/** Removes the quote characters / `.` and `/` as they cause fuzzaldrin to break */
function sanitizePrefix(prefix: string){
    const result = prefix.replace(/\.|\/|\'|\"|/g, '');
    return result;
}

export function getPathCompletionsForImport(query: GetPathCompletions): types.PathCompletion[] {
    var project = query.project;
    var sourceDir = path.dirname(query.filePath);
    var filePaths = project.configFile.project.files.filter(p => p !== query.filePath && !p.endsWith('.json'));
    var files: {
        fileName: string;
        relativePath: string;
        fullPath: string;
    }[] = [];

    var externalModules = getExternalModuleNames(project.languageService.getProgram());
    externalModules.forEach(e => files.push({
        fileName: `${e}`,
        relativePath: e,
        fullPath: e
    }));

    filePaths.forEach(p=> {
        files.push({
            fileName: fsu.removeExt(utils.getFileName(p)),
            relativePath: fsu.removeExt(fsu.makeRelativePath(sourceDir, p)),
            fullPath: p
        });
    });

    const sanitizedPrefix = sanitizePrefix(query.prefix);
    const endsInPunctuation: boolean = utils.prefixEndsInPunctuation(sanitizedPrefix);
    if (!endsInPunctuation)
        files = fuzzaldrin.filter(files, sanitizedPrefix, { key: 'fileName' });

    return files;
}

/**
 * Very similar to above. But
 * - aborts if position not valid to autocomplete
 * - automatically excludes `externalModules` if position is reference tag
 */
export function getPathCompletionsForAutocomplete(query: GetPathCompletionsForAutocomplete): types.PathCompletionForAutocomplete[] {
    const sourceFile = query.project.languageService.getNonBoundSourceFile(query.filePath);
    const positionNode = ts.getTokenAtPosition(sourceFile, query.position);

    /** Note: in referenceTag is not supported yet */
    const inReferenceTagPath = false;

    const inES6ModuleImportString = isStringLiteralInES6ImportDeclaration(positionNode);
    const inImportRequireString = isStringLiteralInImportRequireDeclaration(positionNode);

    if (!inReferenceTagPath && !inES6ModuleImportString && !inImportRequireString){
        return [];
    }

    /** We have to be in a string literal (as reference tag isn't supproted yet) */
    const pathStringText = positionNode.getFullText();
    const leadingText = pathStringText.match(/^\s+['|"]/g);
    const trailingText = pathStringText.match(/['|"]$/g);
    const from = leadingText ? positionNode.pos + leadingText[0].length : positionNode.pos;
    const to = trailingText ? positionNode.end - trailingText[0].length : positionNode.end;
    const pathStringRange = {
        from,
        to
    };
    // console.log({textThatWillBeReplaced:sourceFile.getFullText().substr(from, to-from)}); // DEBUG

    var project = query.project;
    var sourceDir = path.dirname(query.filePath);
    var filePaths = project.configFile.project.files.filter(p=> p !== query.filePath && !p.endsWith('.json'));
    var files: {
        fileName: string;
        relativePath: string;
        fullPath: string;
        pathStringRange: {
            from: number,
            to: number,
        }
    }[] = [];

    if (!inReferenceTagPath) {
        var externalModules = getExternalModuleNames(project.languageService.getProgram());
        externalModules.forEach(e=> files.push({
            fileName: `${e}`,
            relativePath: e,
            fullPath: e,
            pathStringRange,
        }));
    }

    filePaths.forEach(p => {
        const lowerCaseExtRemoved = fsu.removeExt(p.toLowerCase());
        if (
            lowerCaseExtRemoved.endsWith('/index')
            || lowerCaseExtRemoved.endsWith('/index.d')
        ) {
            p = utils.getDirectory(p);
        }

        files.push({
            fileName: fsu.removeExt(utils.getFileName(p)),
            relativePath: fsu.removeExt(fsu.makeRelativePath(sourceDir, p)),
            fullPath: p,
            pathStringRange,
        });
    });

    const sanitizedPrefix = sanitizePrefix(query.prefix);

    return files;
}
