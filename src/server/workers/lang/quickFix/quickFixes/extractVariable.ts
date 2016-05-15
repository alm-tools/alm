import {QuickFix, QuickFixQueryInformation, Refactoring, CanProvideFixResponse} from "../quickFix";
import * as ast from "../astUtils";
import {EOL} from "os";

export class ExtractVariable implements QuickFix {
    key = ExtractVariable.name;

    canProvideFix(info: QuickFixQueryInformation): CanProvideFixResponse {

        return execute(info,
            () => {
                let identifier = <ts.Identifier>info.positionNode;
                return { display: `Extract variable from ${identifier.text}` };
            },
            () => {
                let identifier = <ts.Identifier>info.positionNode;
                return { display: `Extract variable from ${identifier.text}` };
            },
            () => {
                return { display: `Extract variable` };
            });
    }

    provideFix(info: QuickFixQueryInformation): Refactoring[] {

        return execute(info,
            () => {
                return extractVariableFromCall(info);
            },
            () => {
                return extractVariableFromCall(info, "Result");
            },
            (callExpression) => {
                return extractVariableFromArg(info, callExpression);
            });
    }

}

function execute(info: QuickFixQueryInformation, onProperty, onFuncCall, onExtractable) {

    let callExpression = findLowestNode<ts.CallExpression>(
        info.positionNode,
        ts.SyntaxKind.CallExpression);

    if (callExpression) {
        if (isPropertyCall(info)) {
            return onProperty();
        } else if (isFuncCall(info)) {
            return onFuncCall();
        } else if (isExtractable(info, callExpression)) {
            return onExtractable(callExpression);
        }
    } else if (isPropertyAccess(info)) {
        return onProperty();
    }

}

function extractVariableFromCall(info: QuickFixQueryInformation, postFix: string = ''): Refactoring[] {

    let typeChecker = info.typeChecker;
    let type = getTypeStringForNode(info.positionNode, typeChecker);
    let identifier = <ts.Identifier>info.positionNode;

    return [{
        span: {
            start: startOfLine(info) + indentAtPos(info),
            length: 0
        },
        newText: `var ${identifier.text}${postFix}: ${type} = `,
        filePath: info.filePath
    }];

}

function extractVariableFromArg(info: QuickFixQueryInformation, callExpression: ts.CallExpression): Refactoring[] {

    let argumentIndex = getArgumentIndex(info.positionNode, callExpression);
    let {name, type} = getArgumentDescription(callExpression,
        argumentIndex, info.typeChecker);

    let indent = indentAtPos(info);
    let value = extractValue(info, callExpression);

    return [
        {
            span: {
                start: callExpression.arguments[argumentIndex].getStart(),
                length: value.length
            },
            newText: name,
            filePath: info.filePath
        },
        {
            span: {
                start: startOfLine(info) + indent,
                length: 0
            },
            newText: `var ${name}: ${type} = ${value};${EOL}${createIndent(indent) }`,
            filePath: info.filePath
        }];

}

function isPropertyAccess(info: QuickFixQueryInformation): boolean {
    return isValidPath(info.positionNode,
        [ts.SyntaxKind.Identifier,
            ts.SyntaxKind.PropertyAccessExpression,
            ts.SyntaxKind.ExpressionStatement]);
}

function isFuncCall(info: QuickFixQueryInformation): boolean {
    return isValidPath(info.positionNode,
        [ts.SyntaxKind.Identifier,
            ts.SyntaxKind.CallExpression,
            ts.SyntaxKind.ExpressionStatement]);
}

function isPropertyCall(info: QuickFixQueryInformation): boolean {
    return isValidPath(info.positionNode,
        [ts.SyntaxKind.Identifier,
            ts.SyntaxKind.PropertyAccessExpression,
            ts.SyntaxKind.CallExpression,
            ts.SyntaxKind.ExpressionStatement]);
}

function isExtractable(info: QuickFixQueryInformation, callExpression: ts.CallExpression): boolean {
    let argumentIndex = getArgumentIndex(info.positionNode, callExpression);
    return (argumentIndex > -1) &&
        (!((info.positionNode.kind == ts.SyntaxKind.Identifier) &&
            (info.positionNode.parent == callExpression)));
}

function findLowestNode<T extends ts.Node>(startNode: ts.Node, kind: ts.SyntaxKind): T {
    let node = startNode;
    let result = new Array<T>();
    while (node) {
        if (node.kind == kind) {
            result.push(<T>node);
        }
        node = node.parent;
    }
    if (result.length == 0) {
        return null;
    } else {
        return result.reverse()[0];
    }
}

function getArgumentDescription(node: ts.CallExpression, argumentIndex: number,
    typeChecker: ts.TypeChecker) {

    let signature = typeChecker.getResolvedSignature(node);
    let argument = signature.parameters[argumentIndex];
    let sigDeclaration = (<ts.SignatureDeclaration>argument.valueDeclaration).type;

    return {
        name: argument.name.trim(),
        type: node.getSourceFile().text.substring(sigDeclaration.pos, sigDeclaration.end).trim()
    }
}

function startOfLine(info: QuickFixQueryInformation): number {
    let {line} = info.project.languageServiceHost.getPositionFromIndex(info.filePath, info.position);
    return info.project.languageServiceHost.getIndexFromPosition(info.filePath, { line, col: 0 });
}

function indentAtPos(info: QuickFixQueryInformation): number {
    return info.service.getIndentationAtPosition(
        info.filePath, info.positionNode.pos, info.project.projectFile.project.formatCodeOptions);
}

function createIndent(indent: number): string {
    return Array(indent + 1).join(' ');
}

function getTypeStringForNode(node: ts.Node, typeChecker: ts.TypeChecker): string {
    let type = typeChecker.getTypeAtLocation(node);
    let typeSignature = ts.displayPartsToString(ts.typeToDisplayParts(typeChecker, type)).replace(/\s+/g, ' ');
    let fatArrowPos = typeSignature.indexOf("=>");

    if (fatArrowPos != -1) {
        return typeSignature.substr(fatArrowPos + 3).trim();
    } else {
        return typeSignature.trim();
    }
}

function extractValue(info: QuickFixQueryInformation, callExpression: ts.CallExpression): string {
    let index = getArgumentIndex(info.positionNode, callExpression);
    let argNode = callExpression.arguments[index];
    return info.positionNode.getSourceFile().text.substr(argNode.pos, argNode.end - argNode.pos).trim();
}

function getArgumentIndex(node: ts.Node, callExpression: ts.CallExpression): number {
    for (let i = 0; i < callExpression.arguments.length; i++) {
        let arg = callExpression.arguments[i];
        if ((node.pos >= arg.pos) && (node.end <= arg.end)) {
            return i;
        }
    }
    return -1;
}

function isValidPath(startNode: ts.Node, kinds: Array<ts.SyntaxKind>): boolean {
    var node = startNode;
    for (let i = 0; i < kinds.length; i++) {
        if (!(node.kind == kinds[i])) {
            return false;
        }
        node = node.parent;
        if (!node) {
            return false;
        }
    }
    return true;
}
