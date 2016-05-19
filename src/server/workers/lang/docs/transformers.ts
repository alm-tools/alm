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
import {getDocumentedTypeLocation} from "../modules/astUtils";
import {getParsedComment} from "../modules/jsDoc";

/** Source File */
export function transformSourceFile(sourceFile: ts.SourceFile): types.DocumentedType {
    const name = sourceFile.fileName;
    const icon = ts.isExternalModule(sourceFile) ? types.IconType.Namespace : types.IconType.Global;
    const comment = getParsedComment(sourceFile, sourceFile);
    const subItems = getSignificantSubItems(sourceFile, sourceFile);

    return {
        name,
        icon,
        comment,
        subItems,
        location: getDocumentedTypeLocation(sourceFile, sourceFile.pos),
    };
}

/** There are a few root level things we care about. This only recurses on those 🌹  */
function getSignificantSubItems(node: ts.SourceFile | ts.ModuleBlock, sourceFile: ts.SourceFile): types.DocumentedType[] {
    const subItems: types.DocumentedType[] = [];

    ts.forEachChild(node, (node) => {
        if (node.kind == ts.SyntaxKind.ClassDeclaration) {
            subItems.push(transformClass(node as ts.ClassDeclaration, sourceFile));
        }
        if (node.kind == ts.SyntaxKind.InterfaceDeclaration) {
            subItems.push(transformInterface(node as ts.InterfaceDeclaration, sourceFile));
        }
        if (node.kind == ts.SyntaxKind.EnumDeclaration) {
            subItems.push(transformEnum(node as ts.EnumDeclaration, sourceFile));
        }
        if (node.kind == ts.SyntaxKind.VariableStatement) {
            transformVariableStatement(node as ts.VariableStatement, sourceFile).forEach(variable => subItems.push(variable));
        }
        if (node.kind == ts.SyntaxKind.FunctionDeclaration) {
            const functionDeclaration = node as ts.FunctionDeclaration;
            /** If it doesn't have a `block` then its an overload. We don't want to visit it */
            if (!functionDeclaration.body) return;
            subItems.push(transformFunction(functionDeclaration, sourceFile));
        }
        if (node.kind == ts.SyntaxKind.ModuleDeclaration) {
            subItems.push(transformModule(node as ts.ModuleDeclaration, sourceFile));
        }
    });

    return subItems;
}

/** Class */
function transformClass(node: ts.ClassDeclaration, sourceFile: ts.SourceFile): types.DocumentedType {
    const name = node.name.text;
    const comment = getParsedComment(node, sourceFile);
    const subItems: types.DocumentedType[] = [];

    let icon = types.IconType.Class;
    if (node.typeParameters) {
        icon = types.IconType.ClassGeneric;
    }

    ts.forEachChild(node, (node) => {
        if (node.kind == ts.SyntaxKind.Constructor) {
            subItems.push(transformClassConstructor(node as ts.ConstructorDeclaration, sourceFile));
        }
        if (node.kind == ts.SyntaxKind.PropertyDeclaration) {
            subItems.push(transformClassProperty(node as ts.PropertyDeclaration, sourceFile));
        }
        if (node.kind == ts.SyntaxKind.MethodDeclaration) {
            subItems.push(transformClassMethod(node as ts.MethodDeclaration, sourceFile));
        }
        if (node.kind == ts.SyntaxKind.IndexSignature) {
            subItems.push(transformClassIndexSignature(node as ts.IndexSignatureDeclaration, sourceFile));
        }
    });

    return {
        name,
        icon,
        comment,
        subItems,
        location: getDocumentedTypeLocation(sourceFile, node.name.pos),
    };
}

/** Class Constructor */
function transformClassConstructor(node: ts.ConstructorDeclaration, sourceFile: ts.SourceFile): types.DocumentedType {
    const name = "constructor";
    const comment = getParsedComment(node, sourceFile);
    const subItems: types.DocumentedType[] = [];
    let icon = types.IconType.ClassConstructor;

    return {
        name,
        icon,
        comment,
        subItems,
        location: getDocumentedTypeLocation(sourceFile, node.pos),
    };
}

/** Class Property */
function transformClassProperty(node: ts.PropertyDeclaration, sourceFile: ts.SourceFile): types.DocumentedType {
    const name = ts.getPropertyNameForPropertyNameNode(node.name);
    const comment = getParsedComment(node, sourceFile);
    const subItems: types.DocumentedType[] = [];
    let icon = types.IconType.ClassProperty;

    return {
        name,
        icon,
        comment,
        subItems,
        location: getDocumentedTypeLocation(sourceFile, node.pos),
    };
}

/** Class Method */
function transformClassMethod(node: ts.MethodDeclaration, sourceFile: ts.SourceFile): types.DocumentedType {
    const name = ts.getPropertyNameForPropertyNameNode(node.name);
    const comment = getParsedComment(node, sourceFile);
    const subItems: types.DocumentedType[] = [];
    let icon = types.IconType.ClassMethod;
    if (node.typeParameters) {
        icon = types.IconType.ClassMethodGeneric;
    }

    return {
        name,
        icon,
        comment,
        subItems,
        location: getDocumentedTypeLocation(sourceFile, node.pos),
    };
}

/** Class Index Signature */
function transformClassIndexSignature(node: ts.IndexSignatureDeclaration, sourceFile: ts.SourceFile): types.DocumentedType {
    const name = "Index Signature";
    const comment = '`' + node.getText() + '`' + `\n` + (getParsedComment(node, sourceFile) || '');
    const subItems: types.DocumentedType[] = [];
    let icon = types.IconType.ClassIndexSignature;

    return {
        name,
        icon,
        comment,
        subItems,
        location: getDocumentedTypeLocation(sourceFile, node.pos),
    };
}

/** Interface */
function transformInterface(node: ts.InterfaceDeclaration, sourceFile: ts.SourceFile): types.DocumentedType {
    const name = node.name.text;
    const comment = getParsedComment(node, sourceFile);
    const subItems: types.DocumentedType[] = [];

    let icon = types.IconType.Interface;
    if (node.typeParameters) {
        icon = types.IconType.InterfaceGeneric;
    }

    ts.forEachChild(node, (node) => {
        if (node.kind == ts.SyntaxKind.ConstructSignature) {
            subItems.push(transformInterfaceConstructor(node as ts.ConstructSignatureDeclaration, sourceFile));
        }
        if (node.kind == ts.SyntaxKind.PropertySignature) {
            subItems.push(transformInterfaceProperty(node as ts.PropertySignature, sourceFile));
        }
        if (node.kind == ts.SyntaxKind.MethodSignature) {
            subItems.push(transformInterfaceMethod(node as ts.MethodSignature, sourceFile));
        }
        if (node.kind == ts.SyntaxKind.IndexSignature) {
            subItems.push(transformInterfaceIndexSignature(node as ts.IndexSignatureDeclaration, sourceFile));
        }
    });

    return {
        name,
        icon,
        comment,
        subItems,
        location: getDocumentedTypeLocation(sourceFile, node.name.pos),
    };
}

/** Interface Property */
function transformInterfaceProperty(node: ts.PropertySignature, sourceFile: ts.SourceFile): types.DocumentedType {
    const name = ts.getPropertyNameForPropertyNameNode(node.name);
    const comment = getParsedComment(node, sourceFile);
    const subItems: types.DocumentedType[] = [];
    let icon = types.IconType.InterfaceProperty;

    return {
        name,
        icon,
        comment,
        subItems,
        location: getDocumentedTypeLocation(sourceFile, node.name.pos),
    };
}

/** Interface Constructor */
function transformInterfaceConstructor(node: ts.ConstructSignatureDeclaration, sourceFile: ts.SourceFile): types.DocumentedType {
    const name = "constructor";
    const comment = getParsedComment(node, sourceFile);
    const subItems: types.DocumentedType[] = [];
    let icon = types.IconType.InterfaceConstructor;

    return {
        name,
        icon,
        comment,
        subItems,
        location: getDocumentedTypeLocation(sourceFile, node.pos),
    };
}

/** Interface Method */
function transformInterfaceMethod(node: ts.MethodSignature, sourceFile: ts.SourceFile): types.DocumentedType {
    const name = ts.getPropertyNameForPropertyNameNode(node.name);
    const comment = getParsedComment(node, sourceFile);
    const subItems: types.DocumentedType[] = [];
    let icon = types.IconType.InterfaceMethod;
    if (node.typeParameters) {
        icon = types.IconType.InterfaceMethodGeneric;
    }

    return {
        name,
        icon,
        comment,
        subItems,
        location: getDocumentedTypeLocation(sourceFile, node.name.pos),
    };
}

/** Interface Index Signature */
function transformInterfaceIndexSignature(node: ts.IndexSignatureDeclaration, sourceFile: ts.SourceFile): types.DocumentedType {
    const name = "Index Signature";
    const comment = '`' + node.getText() + '`' + `\n` + (getParsedComment(node, sourceFile) || '');
    const subItems: types.DocumentedType[] = [];
    let icon = types.IconType.InterfaceIndexSignature;

    return {
        name,
        icon,
        comment,
        subItems,
        location: getDocumentedTypeLocation(sourceFile, node.pos),
    };
}

/** Enum */
function transformEnum(node: ts.EnumDeclaration, sourceFile: ts.SourceFile): types.DocumentedType {
    const name = node.name.text;
    const comment = getParsedComment(node, sourceFile);
    const subItems: types.DocumentedType[] = [];

    let icon = types.IconType.Enum;
    ts.forEachChild(node, (node) => {
        if (node.kind == ts.SyntaxKind.EnumMember) {
            const member = node as ts.EnumMember;
            subItems.push({
                name: member.name.getText(),
                icon: types.IconType.EnumMember,
                comment: getParsedComment(node, sourceFile),
                subItems: [],
                location: getDocumentedTypeLocation(sourceFile, member.name.pos),
            });
        }
    });

    return {
        name,
        icon,
        comment,
        subItems,
        location: getDocumentedTypeLocation(sourceFile, node.name.pos),
    };
}

/** Variable */
function transformVariableStatement(node: ts.VariableStatement, sourceFile: ts.SourceFile): types.DocumentedType[] {
    const result: types.DocumentedType[] = [];
    const declarations = node.declarationList.declarations;

    declarations.forEach(d => {
        const comment = getParsedComment(d, sourceFile);
        const subItems: types.DocumentedType[] = [];
        let icon = types.IconType.Variable;
        if (d.name.kind === ts.SyntaxKind.ObjectBindingPattern) {
            /** destructured variable declaration */
            const names = d.name as ts.ObjectBindingPattern;
            names.elements.forEach(bindingElement => {
                const name = ts.getPropertyNameForPropertyNameNode(bindingElement.name);
                result.push({
                    name, icon, comment, subItems,
                    location: getDocumentedTypeLocation(sourceFile, bindingElement.pos),
                });
            });
        }
        else {
            let name = ts.getPropertyNameForPropertyNameNode(d.name);

            result.push({
                name, icon, comment, subItems,
                location: getDocumentedTypeLocation(sourceFile, d.pos),
            });
        }
    });

    return result;
}

/** Function */
function transformFunction(node: ts.FunctionDeclaration, sourceFile: ts.SourceFile): types.DocumentedType {
    const name = ts.getPropertyNameForPropertyNameNode(node.name);
    const comment = getParsedComment(node, sourceFile);
    const subItems: types.DocumentedType[] = [];
    let icon = types.IconType.Function;
    if (node.typeParameters) {
        icon = types.IconType.FunctionGeneric;
    }

    return {
        name, icon, comment, subItems,
        location: getDocumentedTypeLocation(sourceFile, node.name.pos),
    };
}

/** Module | Namespace */
function transformModule(node: ts.ModuleDeclaration, sourceFile: ts.SourceFile): types.DocumentedType {
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
    let icon = types.IconType.Namespace;
    let name = ts.getPropertyNameForPropertyNameNode(node.name);

    if (node.body.kind === ts.SyntaxKind.ModuleDeclaration) {
        name = name + '.';
        const recurse = transformModule(node.body as ts.ModuleDeclaration, sourceFile);
        return {
            name: name + recurse.name,
            icon,
            comment: recurse.comment,
            subItems: recurse.subItems,
            location: getDocumentedTypeLocation(sourceFile, node.name.pos),
        }
    }
    else {
        const comment = getParsedComment(node, sourceFile);
        const subItems: types.DocumentedType[] = getSignificantSubItems(node.body as ts.ModuleBlock, sourceFile);
        return {
            name, icon, comment, subItems, location: getDocumentedTypeLocation(sourceFile, node.name.pos)
        };
    }
}


// TODO: these
/** Type */
