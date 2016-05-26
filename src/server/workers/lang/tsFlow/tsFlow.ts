/**
 * This is the main backend for the tsFlow feature
 */
/** Imports */
import * as utils from "../../../../common/utils";
import * as types from "../../../../common/types";
import {getDocumentedTypeLocation} from "../modules/astUtils";

/** We just use the *active* project if any */
import * as activeProject from "../activeProject";
let getProject = activeProject.GetProject.getCurrentIfAny;

export function getFlowRoots(query: types.TsFlowRootQuery): Promise<types.TsFlowRootResponse> {
    let project = activeProject.GetProject.getCurrentIfAny();
    var languageService = project.languageService;
    const filePath = query.filePath;
    const sourceFile = project.getSourceFile(query.filePath);

    const flowPoints: types.TsFlowPoint[] = [];


    let declarations = sourceFile.getNamedDeclarations();
    for (let index in declarations) {
        for (let declaration of declarations[index]) {
            const flowPoint: types.TsFlowPoint = {
                filePath,
                from: project.languageServiceHost.getLineAndCharacterOfPosition(filePath, declaration.getStart()),
                to: project.languageServiceHost.getLineAndCharacterOfPosition(filePath, declaration.getStart()),
                displayName: getDeclarationName(declaration)
            }
            // TODO: filter based on kind
            // getNodeKind(declaration)
            flowPoints.push(flowPoint);
        }
    }


    return utils.resolve({flowPoints});
}


/**
 * Utility functions
 */
let getNodeKind = ts.getNodeKind;
function getDeclarationName(declaration: ts.Declaration): string {
    let result = getTextOfIdentifierOrLiteral(declaration.name);
    if (result !== undefined) {
        return result;
    }

    if (declaration.name.kind === ts.SyntaxKind.ComputedPropertyName) {
        let expr = (<ts.ComputedPropertyName>declaration.name).expression;
        if (expr.kind === ts.SyntaxKind.PropertyAccessExpression) {
            return (<ts.PropertyAccessExpression>expr).name.text;
        }

        return getTextOfIdentifierOrLiteral(expr);
    }

    return undefined;
}
function getTextOfIdentifierOrLiteral(node: ts.Node) {
    if (node.kind === ts.SyntaxKind.Identifier ||
        node.kind === ts.SyntaxKind.StringLiteral ||
        node.kind === ts.SyntaxKind.NumericLiteral) {

        return (<ts.Identifier | ts.LiteralExpression>node).text;
    }

    return undefined;
}
