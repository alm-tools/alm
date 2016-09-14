import * as types from '../../../../common/types';

/**
 * Removes unused imports (both import/require and ES6)
 */
export const removeUnusedImports = (filePath: string, service: ts.LanguageService): types.RefactoringsByFilePath => {
    /**
     * Plan:
     * - First finds all the imports in the file
     * - Then checks if they have any usages (using document highlighting).
     * - For used ones it removes them
     *   - If all the ones from a ES6 Named import are unused the whole import is removed
     */
    const sourceFile = service.getProgram().getSourceFile(filePath);
    const imports = getImports(sourceFile);
    const unUsedImports = imports.filter((imp) => !isIdentifierUsed(imp.identifier, sourceFile, service));

    /** TODO: removeUnusedImports */
    return Object.create(null);
}


type ImportSearchResult = {
    type: 'es6NamedImport',
    identifier: ts.Identifier,
}
    | {
        type: 'es6NamespaceImport',
        identifier: ts.Identifier,
    }
    | {
        type: 'importEqual',
        identifier: ts.Identifier,
    };
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
                const themNames = namedImports.elements;
                themNames.forEach(i => results.push({
                    type: 'es6NamedImport',
                    /**
                     * Always has `name`
                     * If "foo" then foo is name
                     * If "foo as bar" the foo is name and bar is `propertyName`
                     * */
                    identifier: i.name
                }));
            }
            /** Or a namespace import */
            else if (namedBindings.kind === ts.SyntaxKind.NamespaceImport) {
                const namespaceImport = (namedBindings as ts.NamespaceImport);
                results.push({
                    type: 'es6NamespaceImport',
                    identifier: namespaceImport.name,
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
            })
        }
    });
    return results;
}

function isIdentifierUsed(identifier: ts.Identifier, sourceFile: ts.SourceFile, service: ts.LanguageService) {
    const highlights = service.getOccurrencesAtPosition(sourceFile.fileName, identifier.getStart()) || [];
    // console.log({uses: highlights.length, text: identifier.text}); // DEBUG
    
    // TODO: removeUnusedImports don't count usages that are in other imports
    // E.g. `import {foo}` & `import {foo as bar}`
    return highlights.length > 1;
}
