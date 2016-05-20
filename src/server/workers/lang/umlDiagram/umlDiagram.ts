/**
 * This is the backend for the uml diagram view
 */

/** Imports */
import * as utils from "../../../../common/utils";
import * as types from "../../../../common/types";
import {getDocumentedTypeLocation} from "../modules/astUtils";

/** We just use the *active* project if any */
import * as activeProject from "../activeProject";
let getProject = activeProject.GetProject.getCurrentIfAny;

/**
 * Get a uml diagram structure for a file
 */
export function getUmlDiagramForFile(query: { filePath: string }) : Promise<{classes: types.UMLClass[]}> {
    let project = getProject();
    const sourceFile = project.getProjectSourceFiles().find(f => f.fileName === query.filePath);
    const program = project.languageService.getProgram();

    // const modules = tsAnalyzer.collectInformation(program, sourceFile);
    // console.log(modules);

    const classes = analyzeFile({ sourceFile, program });

    // TODO: sort by base classes (i.e. the class that has the lowest length of extend)

    return utils.resolve({ classes });
}


function analyzeFile({sourceFile, program}: { sourceFile: ts.SourceFile, program: ts.Program }): types.UMLClass[] {
    const result: types.UMLClass[] = [];
    const typeChecker = program.getTypeChecker();

    ts.forEachChild(sourceFile, node => {
        if (node.kind == ts.SyntaxKind.ClassDeclaration) {
            result.push(transformClass(node as ts.ClassDeclaration, sourceFile, program));
        }

        // TODO: potentially support looking into `a.b.c` style namespaces as well
    });

    return result;
}

/**
 * Various Transformers
 */

function transformClass(node: ts.ClassDeclaration, sourceFile: ts.SourceFile, program: ts.Program): types.UMLClass {
    const result: types.UMLClass = {
        name: node.name.text,
        icon: types.IconType.Class,
        location: getDocumentedTypeLocation(sourceFile, node.name.pos),

        members: [],
        extends: null,
    }
    if (node.typeParameters) {
        result.icon = types.IconType.ClassGeneric;
    }

    /** Collect members */
    ts.forEachChild(node, (node) => {
        if (node.kind == ts.SyntaxKind.Constructor) {
            result.members.push(transformClassConstructor(node as ts.ConstructorDeclaration, sourceFile));
        }
        if (node.kind == ts.SyntaxKind.PropertyDeclaration) {
            result.members.push(transformClassProperty(node as ts.PropertyDeclaration, sourceFile));
        }
        if (node.kind == ts.SyntaxKind.MethodDeclaration) {
            result.members.push(transformClassMethod(node as ts.MethodDeclaration, sourceFile));
        }
        if (node.kind == ts.SyntaxKind.IndexSignature) {
            result.members.push(transformClassIndexSignature(node as ts.IndexSignatureDeclaration, sourceFile));
        }
    });

    /** Collect parent classes */
    const classDeclaration = node;
    if (classDeclaration.heritageClauses) {
        let extendsClause = classDeclaration.heritageClauses.find(c => c.token === ts.SyntaxKind.ExtendsKeyword);
        if (extendsClause && extendsClause.types.length > 0) {
            const expression = extendsClause.types[0];
            const typeChecker = program.getTypeChecker();
            const symbol = typeChecker.getTypeAtLocation(expression.expression).symbol;
            if (symbol) {
                const valueDeclaration = symbol.valueDeclaration;
                if (valueDeclaration && valueDeclaration.kind === ts.SyntaxKind.ClassDeclaration) {
                    const node = valueDeclaration as ts.ClassDeclaration;
                    const nodeSourceFile = node.getSourceFile();
                    result.extends = transformClass(node, nodeSourceFile, program);
                }
            }
        }
    }

    /** Figure out any override */
    if (result.extends) {
        /** Collect all parents */
        const parents: types.UMLClass[] = [];
        let parent = result.extends;
        while (parent) {
            parents.push(parent);
            parent = parent.extends;
        }
        /** For each member check if a parent has a member with the same name */
        result.members.forEach(m => {
            if (m.name === "constructor") return; // (except for constructor)
            if (parents.some(p => p.members.some(pm => pm.lifetime === types.UMLClassMemberLifetime.Instance && pm.name === m.name))) {
                m.override = true;
            }
        });
    }

    return result;
}

/** Class Constructor */
function transformClassConstructor(node: ts.ConstructorDeclaration, sourceFile: ts.SourceFile): types.UMLClassMember {
    const name = "constructor";
    let icon = types.IconType.ClassConstructor;
    const location = getDocumentedTypeLocation(sourceFile, node.pos);
    const result: types.UMLClassMember = {
        name,
        icon,
        location,

        visibility: types.UMLClassMemberVisibility.Public,
        lifetime: types.UMLClassMemberLifetime.Instance,
    }

    return result;
}

/** Class Property */
function transformClassProperty(node: ts.PropertyDeclaration, sourceFile: ts.SourceFile): types.UMLClassMember {
    const name = ts.getPropertyNameForPropertyNameNode(node.name);
    let icon = types.IconType.ClassProperty;
    const location = getDocumentedTypeLocation(sourceFile, node.pos);
    const visibility = getVisibility(node);
    const lifetime = getLifetime(node);

    const result: types.UMLClassMember = {
        name,
        icon,
        location,

        visibility,
        lifetime,
    }

    return result;
}

/** Class Method */
function transformClassMethod(node: ts.MethodDeclaration, sourceFile: ts.SourceFile): types.UMLClassMember {
    const name = ts.getPropertyNameForPropertyNameNode(node.name);
    let icon = types.IconType.ClassMethod;
    if (node.typeParameters) {
        icon = types.IconType.ClassMethodGeneric;
    }
    const location = getDocumentedTypeLocation(sourceFile, node.pos);
    const visibility = getVisibility(node);
    const lifetime = getLifetime(node);

    const result: types.UMLClassMember = {
        name,
        icon,
        location,

        visibility,
        lifetime,
    }

    return result;
}

/** Class Index Signature */
function transformClassIndexSignature(node: ts.IndexSignatureDeclaration, sourceFile: ts.SourceFile): types.UMLClassMember {
    const name = "Index Signature";
    let icon = types.IconType.ClassIndexSignature;
    let location = getDocumentedTypeLocation(sourceFile, node.pos);

    const result: types.UMLClassMember = {
        name,
        icon,
        location,

        visibility: types.UMLClassMemberVisibility.Public,
        lifetime: types.UMLClassMemberLifetime.Instance,
    }

    return result;
}

/**
 *
 * General Utilities
 *
 */

/** Visibility */
function getVisibility(node: ts.Node): types.UMLClassMemberVisibility {
    if (node.modifiers) {
        if (hasModifierSet(node.modifiers.flags, ts.NodeFlags.Protected)) {
            return types.UMLClassMemberVisibility.Protected;
        } else if (hasModifierSet(node.modifiers.flags, ts.NodeFlags.Private)) {
            return types.UMLClassMemberVisibility.Private;
        } else if (hasModifierSet(node.modifiers.flags, ts.NodeFlags.Public)) {
            return types.UMLClassMemberVisibility.Public;
        } else if (hasModifierSet(node.modifiers.flags, ts.NodeFlags.Export)) {
            return types.UMLClassMemberVisibility.Public;
        }
    }
    switch (node.parent.kind) {
        case ts.SyntaxKind.ClassDeclaration:
            return types.UMLClassMemberVisibility.Public;
        case ts.SyntaxKind.ModuleDeclaration:
            return types.UMLClassMemberVisibility.Private;
    }
    return types.UMLClassMemberVisibility.Private;
}

/** Lifetime */
function getLifetime(node: ts.Node): types.UMLClassMemberLifetime {
    if (node.modifiers) {
        if (hasModifierSet(node.modifiers.flags, ts.NodeFlags.Static)) {
            return types.UMLClassMemberLifetime.Static;
        }
    }
    return types.UMLClassMemberLifetime.Instance;
}

/** Just checks if a flag is set */
function hasModifierSet(value: number, modifier: number) {
    return (value & modifier) === modifier;
}
