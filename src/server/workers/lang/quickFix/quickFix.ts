/**
 * Interfaces for quick fixes
 */
import project = require("../core/project");

export interface Refactoring extends ts.TextChange {
    filePath: string;

    /** If you want to insert a snippet. Be careful that you shouldn't return more than one refatoring if you want to use this */
    isNewTextSnippet?: boolean;
}

/** Note this interface has a few redundant stuff. This is intentional to precompute once */
export interface QuickFixQueryInformation {
    project: project.Project;
    service: ts.LanguageService;
    program: ts.Program;
    typeChecker: ts.TypeChecker;
    sourceFile: ts.SourceFile;
    sourceFileText: string;
    fileErrors: ts.Diagnostic[];
    positionErrors: ts.Diagnostic[];
    positionErrorMessages: string[];
    position: number;
    positionNode: ts.Node;
    filePath: string;
    indentSize: number;

    /**
     * Either the previous or the current.
     * This needs more thinking e.g. 'rename' already does the right thing. See how it is implemented
     */
    oneOfPositionNodesOfType?(kind: ts.SyntaxKind): boolean;
}

export interface CanProvideFixResponse {
    /**
      * Return '' if you can't provide a fix
      * return 'Some string to display' if you can provide a string
      */
    display: string;
    isNewTextSnippet?: boolean;
}

export interface QuickFix {
    /** Some unique key. Classname works best ;) */
    key: string;

    canProvideFix(info: QuickFixQueryInformation): CanProvideFixResponse;

    provideFix(info: QuickFixQueryInformation): Refactoring[];
}

/** You don't need to create this manually. Just use the util function */
export interface RefactoringsByFilePath {
    [filePath: string]: Refactoring[];
}

/** Utility method. Reason is we want to transact by file path */
export function getRefactoringsByFilePath(refactorings: Refactoring[]) {
    var loc: RefactoringsByFilePath = {};
    for (let refac of refactorings) {
        if (!loc[refac.filePath]) loc[refac.filePath] = [];
        loc[refac.filePath].push(refac);
    }

    // sort each of these in descending by start location
    for (let filePath in loc) {
        let refactorings = loc[filePath];
        refactorings.sort((a: Refactoring, b: Refactoring) => {
            return (b.span.start - a.span.start);
        });
    }

    return loc;
}
