/**
 * Interfaces for quick fixes
 */
import project = require("../core/project");
import * as types from "../../../../common/types";

export type Refactoring = types.Refactoring;

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
}

export interface QuickFix {
    /** Some unique key. Classname works best ;) */
    key: string;

    canProvideFix(info: QuickFixQueryInformation): CanProvideFixResponse;

    provideFix(info: QuickFixQueryInformation): types.Refactoring[];
}

/** Utility method. Reason is we want to transact by file path */
export const getRefactoringsByFilePath = types.getRefactoringsByFilePath;
