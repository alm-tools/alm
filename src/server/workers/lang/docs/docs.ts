/**
 * The docs module provides utilities documenation comments
 */
import * as projectService from "../projectService";
import * as types from "../../../../common/types";
import {TypedEvent} from "../../../../common/events";
import * as utils from "../../../../common/utils";
import * as typescriptDir from "../core/typeScriptDir";

/** We just use the *active* project if any */
import * as activeProject from "../activeProject";
let getProject = activeProject.GetProject.getCurrentIfAny;

export function getTopLevelModuleNames(query: {}): Promise<types.GetTopLevelModuleNamesResponse> {
    let project = getProject();
    var languageService = project.languageService;

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

    const locals: types.NavigateToItem[] = [];
    const externals: types.NavigateToItem[] = [];
    for (let file of project.getProjectSourceFiles()) {
        const filePath = file.fileName;
        const addToList = typescriptDir.isFileInTypeScriptDir(filePath) ? externals : locals;
        let declarations = file.getNamedDeclarations();
        for (let index in declarations) {
            for (let declaration of declarations[index]) {
                let item: types.NavigateToItem = {
                    name: getDeclarationName(declaration),
                    kind: getNodeKind(declaration),
                    filePath: file.fileName,
                    fileName: utils.getFileName(file.fileName),
                    position: project.languageServiceHost.getLineAndCharacterOfPosition(file.fileName, declaration.getStart())
                }
                addToList.push(item);
            }
        }
    }

    const result: types.GetTopLevelModuleNamesResponse = { locals, externals };
    return utils.resolve(result);
}
