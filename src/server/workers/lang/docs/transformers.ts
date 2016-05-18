/**
 *
 *
 *
 * Various transformers
 *
 *
 *
 */
/** Imports */
import * as types from "../../../../common/types";
import {getRawComment} from "./getRawComment";
/** Source File */
export function transformSourceFile(file: ts.SourceFile): { comment: string, subItems: types.DocumentedType[] } {
    const comment = getRawComment(file);
    const subItems = getSignificantSubItems(file);

    return {
        comment,
        subItems
    };
}

/** There are a few root level things we care about. This only recurses on those 🌹  */
function getSignificantSubItems(node: ts.SourceFile | ts.ModuleDeclaration): types.DocumentedType[] {
    const subItems: types.DocumentedType[] = [];

    ts.forEachChild(node, (node) => {
        if (node.kind == ts.SyntaxKind.ClassDeclaration) {
            subItems.push(transformClass(node as ts.ClassDeclaration));
        }
        if (node.kind == ts.SyntaxKind.InterfaceDeclaration) {
            subItems.push(transformInterface(node as ts.InterfaceDeclaration));
        }
        if (node.kind == ts.SyntaxKind.EnumDeclaration) {
            subItems.push(transformEnum(node as ts.EnumDeclaration));
        }
        if (node.kind == ts.SyntaxKind.VariableStatement) {
            transformVariableStatement(node as ts.VariableStatement).forEach(variable => subItems.push(variable));
        }
        if (node.kind == ts.SyntaxKind.FunctionDeclaration) {
            const functionDeclaration = node as ts.FunctionDeclaration;
            /** If it doesn't have a `block` then its an overload. We don't want to visit it */
            if (!functionDeclaration.body) return;
            subItems.push(transformFunction(functionDeclaration));
        }
        if (node.kind == ts.SyntaxKind.ModuleDeclaration) {
            subItems.push(transformModule(node as ts.ModuleDeclaration));
        }
    });

    return subItems;
}

/** Class */
function transformClass(node: ts.ClassDeclaration): types.DocumentedType {
    const name = node.name.text;
    const comment = getRawComment(node);
    const subItems: types.DocumentedType[] = [];

    let icon = types.IconType.Class;
    if (node.typeParameters) {
        icon = types.IconType.ClassGeneric;
    }

    ts.forEachChild(node, (node) => {
        if (node.kind == ts.SyntaxKind.Constructor) {
            subItems.push(transformClassConstructor(node as ts.ConstructorDeclaration));
        }
        if (node.kind == ts.SyntaxKind.PropertyDeclaration) {
            subItems.push(transformClassProperty(node as ts.PropertyDeclaration));
        }
        if (node.kind == ts.SyntaxKind.MethodDeclaration) {
            subItems.push(transformClassMethod(node as ts.MethodDeclaration));
        }
        if (node.kind == ts.SyntaxKind.IndexSignature) {
            subItems.push(transformClassIndexSignature(node as ts.IndexSignatureDeclaration));
        }
    });

    return {
        name,
        icon,
        comment,
        subItems
    };
}

/** Class Constructor */
function transformClassConstructor(node: ts.ConstructorDeclaration): types.DocumentedType {
    const name = "constructor";
    const comment = getRawComment(node);
    const subItems: types.DocumentedType[] = [];
    let icon = types.IconType.ClassConstructor;

    return {
        name,
        icon,
        comment,
        subItems
    };
}

/** Class Property */
function transformClassProperty(node: ts.PropertyDeclaration): types.DocumentedType {
    const name = ts.getPropertyNameForPropertyNameNode(node.name);
    const comment = getRawComment(node);
    const subItems: types.DocumentedType[] = [];
    let icon = types.IconType.ClassProperty;

    return {
        name,
        icon,
        comment,
        subItems
    };
}

/** Class Method */
function transformClassMethod(node: ts.MethodDeclaration): types.DocumentedType {
    const name = ts.getPropertyNameForPropertyNameNode(node.name);
    const comment = getRawComment(node);
    const subItems: types.DocumentedType[] = [];
    let icon = types.IconType.ClassMethod;
    if (node.typeParameters) {
        icon = types.IconType.ClassMethodGeneric;
    }

    return {
        name,
        icon,
        comment,
        subItems
    };
}

/** Class Index Signature */
function transformClassIndexSignature(node: ts.IndexSignatureDeclaration): types.DocumentedType {
    const name = "Index Signature";
    const comment = '`' + node.getText() + '`' + `\n` + (getRawComment(node) || '');
    const subItems: types.DocumentedType[] = [];
    let icon = types.IconType.ClassIndexSignature;

    return {
        name,
        icon,
        comment,
        subItems
    };
}

/** Interface */
function transformInterface(node: ts.InterfaceDeclaration): types.DocumentedType {
    const name = node.name.text;
    const comment = getRawComment(node);
    const subItems: types.DocumentedType[] = [];

    let icon = types.IconType.Interface;
    if (node.typeParameters) {
        icon = types.IconType.InterfaceGeneric;
    }

    ts.forEachChild(node, (node) => {
        if (node.kind == ts.SyntaxKind.ConstructSignature) {
            subItems.push(transformInterfaceConstructor(node as ts.ConstructSignatureDeclaration));
        }
        if (node.kind == ts.SyntaxKind.PropertySignature) {
            subItems.push(transformInterfaceProperty(node as ts.PropertySignature));
        }
        if (node.kind == ts.SyntaxKind.MethodSignature) {
            subItems.push(transformInterfaceMethod(node as ts.MethodSignature));
        }
        if (node.kind == ts.SyntaxKind.IndexSignature) {
            subItems.push(transformInterfaceIndexSignature(node as ts.IndexSignatureDeclaration));
        }
    });

    return {
        name,
        icon,
        comment,
        subItems
    };
}

/** Interface Property */
function transformInterfaceProperty(node: ts.PropertySignature): types.DocumentedType {
    const name = ts.getPropertyNameForPropertyNameNode(node.name);
    const comment = getRawComment(node);
    const subItems: types.DocumentedType[] = [];
    let icon = types.IconType.InterfaceProperty;

    return {
        name,
        icon,
        comment,
        subItems
    };
}

/** Interface Constructor */
function transformInterfaceConstructor(node: ts.ConstructSignatureDeclaration): types.DocumentedType {
    const name = "constructor";
    const comment = getRawComment(node);
    const subItems: types.DocumentedType[] = [];
    let icon = types.IconType.InterfaceConstructor;

    return {
        name,
        icon,
        comment,
        subItems
    };
}

/** Interface Method */
function transformInterfaceMethod(node: ts.MethodSignature): types.DocumentedType {
    const name = ts.getPropertyNameForPropertyNameNode(node.name);
    const comment = getRawComment(node);
    const subItems: types.DocumentedType[] = [];
    let icon = types.IconType.InterfaceMethod;
    if (node.typeParameters) {
        icon = types.IconType.InterfaceMethodGeneric;
    }

    return {
        name,
        icon,
        comment,
        subItems
    };
}

/** Interface Index Signature */
function transformInterfaceIndexSignature(node: ts.IndexSignatureDeclaration): types.DocumentedType {
    const name = "Index Signature";
    const comment = '`' + node.getText() + '`' + `\n` + (getRawComment(node) || '');
    const subItems: types.DocumentedType[] = [];
    let icon = types.IconType.InterfaceIndexSignature;

    return {
        name,
        icon,
        comment,
        subItems
    };
}

/** Enum */
function transformEnum(node: ts.EnumDeclaration): types.DocumentedType {
    const name = node.name.text;
    const comment = getRawComment(node);
    const subItems: types.DocumentedType[] = [];

    let icon = types.IconType.Enum;
    ts.forEachChild(node, (node) => {
        if (node.kind == ts.SyntaxKind.EnumMember) {
            const member = node as ts.EnumMember;
            subItems.push({
                name: member.name.getText(),
                icon: types.IconType.EnumMember,
                comment: getRawComment(node),
                subItems: []
            });
        }
    });

    return {
        name,
        icon,
        comment,
        subItems
    };
}

/** Variable */
function transformVariableStatement(node: ts.VariableStatement): types.DocumentedType[] {
    const result: types.DocumentedType[] = [];
    const declarations = node.declarationList.declarations;

    declarations.forEach(d => {
        const name = ts.getPropertyNameForPropertyNameNode(d.name);
        const comment = getRawComment(d);
        const subItems: types.DocumentedType[] = [];
        let icon = types.IconType.Variable;

        result.push({
            name,icon,comment,subItems
        });
    });

    return result;
}

/** Function */
function transformFunction(node: ts.FunctionDeclaration): types.DocumentedType {
    const name = ts.getPropertyNameForPropertyNameNode(node.name);
    const comment = getRawComment(node);
    const subItems: types.DocumentedType[] = [];
    let icon = types.IconType.Function;
    if (node.typeParameters) {
        icon = types.IconType.FunctionGeneric;
    }

    return {
        name,icon,comment,subItems
    };
}

/** Module | Namespace */
function transformModule(node: ts.ModuleDeclaration): types.DocumentedType {
    /**
     * Namespace chaining basics
     * a.b.c {}
     * a > declaration
     *   b > declaration
     *     c > declaration + body
     *
     * So if no body then we have to go down to get the name.
     * Also we the *body* is were we should recurse
     */

    const name = ts.getPropertyNameForPropertyNameNode(node.name);
    const comment = getRawComment(node);
    let icon = types.IconType.Namespace;
    const subItems: types.DocumentedType[] = getSignificantSubItems(node);

    return {
        name, icon, comment, subItems
    };
}

// TODO: these
/** Namespace */
/** Type */
