import * as types from '../../../../common/types';
import {createMap} from "../../../../common/utils";

/**
 * Removes unused imports (both import/require and ES6)
 */
export const removeUnusedImports = (filePath: string, service: ts.LanguageService): types.RefactoringsByFilePath => {
    /**
     * Plan:
     * - First finds all the imports in the file
     * - Then checks if they have any usages (using document highlighting).
     * - For unused ones it removes them
     *   - If all the ones from a ES6 Named import are unused the whole import should be removed
     */
    const sourceFile = service.getProgram().getSourceFile(filePath);
    const imports = getImports(sourceFile);
    const unUsedImports = imports.filter((imp) => !isIdentifierUsed(imp.identifier, sourceFile, service));

    // unUsedImports.forEach(ui => console.log(ui.identifier.text)) // DEBUG

    /**
     * Remove the non es6Named imports
     */
    const refactorings: types.Refactoring[] = unUsedImports
        .filter(ui => ui.type !== 'es6NamedImport')
        .map(ui => {
        const refactoring: types.Refactoring = {
            filePath,
            span: ui.toRemove,
            newText: ''
        };
        return refactoring;
    })

    /**
     * ES6 named imports
     */
    /** Since imports are all at the root level. It is safe to assume no duplications */
    const identifiersMarkedForRemoval = createMap(unUsedImports.map(ui => ui.identifier.text));
    const wholeSectionRemovedMap: { [start_length: string]: boolean } = Object.create(null);
    unUsedImports
        .forEach((ui)=>{
            /**
             * Not using `Array.prototype.filter` as it doesn't work with TypeScirpt's discriminated unions
             * Hence this ugly `if`
             */
            if (ui.type === 'es6NamedImport') {
                const {siblings, wholeToRemove} = ui;
                const start_length = `${wholeToRemove.start}_${wholeToRemove.length}`;
                if (wholeSectionRemovedMap[start_length]) {
                    // Already marked for removal. Move on
                    return;
                }
                if (!siblings.some(s => !identifiersMarkedForRemoval[s.text])) {
                    // remove all.
                    const refactoring: types.Refactoring = {
                        filePath,
                        span: wholeToRemove,
                        newText: ''
                    };
                    refactorings.push(refactoring);
                    /** Mark as analyzed */
                    wholeSectionRemovedMap[start_length] = true;
                }
                else {
                    const refactoring: types.Refactoring = {
                        filePath,
                        span: ui.toRemove,
                        newText: ''
                    };
                    refactorings.push(refactoring);
                }
            }
        });

    return types.getRefactoringsByFilePath(refactorings);
}


type ES6NamedImport = {
    type: 'es6NamedImport',
    identifier: ts.Identifier,
    toRemove: ts.TextSpan,

    /**
     * If all sibligs are also to be removed
     * we should remove the whole
     */
    siblings: ts.Identifier[],
    wholeToRemove: ts.TextSpan,
}

type ES6NamespaceImport = {
        type: 'es6NamespaceImport',
        identifier: ts.Identifier,
        toRemove: ts.TextSpan,
}

type ImportEqual = {
        type: 'importEqual',
        identifier: ts.Identifier,
        toRemove: ts.TextSpan,
    }

type ImportSearchResult =
    ES6NamedImport
    | ES6NamespaceImport
    | ImportEqual;

function getImports(searchNode: ts.SourceFile) {
    const results: ImportSearchResult[] = [];
    ts.forEachChild(searchNode, node => {
        // Vist top-level import nodes
        if (node.kind === ts.SyntaxKind.ImportDeclaration) { // ES6 import
            const importDeclaration = (node as ts.ImportDeclaration);
            const importClause = importDeclaration.importClause;
            const namedBindings = importClause.namedBindings;
            /** Is it a named import */
            if (namedBindings.kind === ts.SyntaxKind.NamedImports) {
                const namedImports = (namedBindings as ts.NamedImports);
                const importSpecifiers = namedImports.elements;

                /**
                 * Also store the information about whole for potential use
                 * if all siblings end up needing removal
                 */
                const siblings = importSpecifiers.map(importSpecifier => importSpecifier.name);
                const wholeToRemove = {
                    start: importDeclaration.getFullStart(),
                    length: importDeclaration.getFullWidth()
                }

                importSpecifiers.forEach((importSpecifier, i) => {
                    const result: ES6NamedImport = {
                        type: 'es6NamedImport',
                        /**
                         * If "foo" then foo is name
                         * If "foo as bar" the foo is name and bar is `propertyName`
                         * The whole thing is `importSpecifier`
                         * */
                        identifier: importSpecifier.name,
                        toRemove: {
                            start: importSpecifier.getFullStart(),
                            length: importSpecifier.getFullWidth()
                        },

                        siblings,
                        wholeToRemove,
                    };
                    /** Also we need to get the trailing coma if any */
                    if (i !== (importSpecifiers.length -1)){
                        const next = importSpecifiers[i + 1];
                        const toRemove = result.toRemove;

                        toRemove.length =
                            next.getFullStart() - toRemove.start;
                    }
                    results.push(result);
                });
            }
            /** Or a namespace import */
            else if (namedBindings.kind === ts.SyntaxKind.NamespaceImport) {
                const namespaceImport = (namedBindings as ts.NamespaceImport);
                results.push({
                    type: 'es6NamespaceImport',
                    identifier: namespaceImport.name,
                    toRemove: {
                        start: importDeclaration.getFullStart(),
                        length: importDeclaration.getFullWidth()
                    },
                })
            }
            else {
                console.error('ERRRRRRRRR: found an unaccounted ES6 import type')
            }
        }
        else if (node.kind === ts.SyntaxKind.ImportEqualsDeclaration) { // import =
            const importEqual = node as ts.ImportEqualsDeclaration;
            results.push({
                type: 'importEqual',
                identifier: importEqual.name,
                toRemove: {
                    start: importEqual.getFullStart(),
                    length: importEqual.getFullWidth()
                },
            })
        }
    });
    return results;
}

function isIdentifierUsed(identifier: ts.Identifier, sourceFile: ts.SourceFile, service: ts.LanguageService) {
    const highlights = service.getOccurrencesAtPosition(sourceFile.fileName, identifier.getStart()) || [];
    // console.log({highlights: highlights.length, text: identifier.text}); // DEBUG

    /**
     * Filter out usages in imports
     * don't count usages that are in other imports
     * E.g. `import {foo}` & `import {foo as bar}`
     * Also makes it easy to get *only* true usages (not even a single import) count ;)
     */
    const nodes = highlights.map(h => ts.getTokenAtPosition(sourceFile, h.textSpan.start));
    const trueUsages = nodes.filter(n => !isNodeInAnImport(n));

    // console.log({trueUsages: trueUsages.length, text: identifier.text}); // DEBUG

    return !!trueUsages.length;
}

function isNodeInAnImport(node: ts.Node) {
    while (node.parent) {
        if (
            node.kind === ts.SyntaxKind.ImportDeclaration
            || node.kind === ts.SyntaxKind.ImportEqualsDeclaration
        ) {
            return true;
        }
        node = node.parent;
    }
    return false;
}
