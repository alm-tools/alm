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
export function transformSourceFile(file: ts.SourceFile): {comment: string, subItems: types.DocumentedType[]} {
    const comment = getRawComment(file);
    const subItems: types.DocumentedType[] = [];

    ts.forEachChild(file, (node) => {
        if (node.kind == ts.SyntaxKind.ClassDeclaration) {
            subItems.push(transformClass(node as ts.ClassDeclaration));
        }
    });

    return {
        comment,
        subItems
    };
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
        if (node.kind == ts.SyntaxKind.PropertyDeclaration) {
            subItems.push(transformClassProperty(node as ts.PropertyDeclaration));
        }
        if (node.kind == ts.SyntaxKind.MethodDeclaration) {
            subItems.push(transformClassMethod(node as ts.MethodDeclaration));
        }
    });

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

// TODO: these
/** Namespace */
/** Function */
/** Var */
/** Interface */
/** Type */
/** Enum */
