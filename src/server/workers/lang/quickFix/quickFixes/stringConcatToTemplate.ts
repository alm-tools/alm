import {QuickFix, QuickFixQueryInformation, Refactoring, CanProvideFixResponse} from "../quickFix";
import * as ast from "../../modules/astUtils";

function isBinaryAddition(node: ts.Node): boolean {
    return (node.kind == ts.SyntaxKind.BinaryExpression &&
        (<ts.BinaryExpression>node).operatorToken.kind == ts.SyntaxKind.PlusToken);
}

function isStringExpression(node: ts.Node, typeChecker: ts.TypeChecker): boolean {
    var type = typeChecker.getTypeAtLocation(node);
    var flags = type.getFlags();
    return !!(flags & ts.TypeFlags.String);
}

/** Returns the root (binary +) node if there is some otherwise returns undefined */
function isAPartOfAChainOfStringAdditions(node: ts.Node, typeChecker: ts.TypeChecker): ts.BinaryExpression {
    // We are looking for the `largestSumNode`. Its set once we find one up our tree
    var largestSumNode: ts.BinaryExpression = undefined;
    while (true) {
        // Whenever we find a binary expression of type sum that evaluates to a string
        if (isBinaryAddition(node) && isStringExpression(node, typeChecker)) {
            largestSumNode = <ts.BinaryExpression>node;
        }

        // We've gone too far up
        if (node.kind == ts.SyntaxKind.SourceFile) {
            return largestSumNode;
        }

        // Next look at the parent to find a larger sum node
        node = node.parent;
    }
}

export class StringConcatToTemplate implements QuickFix {
    key = StringConcatToTemplate.name;

    canProvideFix(info: QuickFixQueryInformation): CanProvideFixResponse {
        // Algo
        // Can provide a quick fix if we are part of an expression that
        // is a part of a binary + expression
        // and when these binary +es end we come to an expression which is of type `string`

        // Based on algo we do not care about what the current thing is as long as its a part of a sum of additions
        var strRoot = isAPartOfAChainOfStringAdditions(info.positionNode, info.typeChecker);
        if (strRoot) {
            return { display: 'String concatenations to a template string' };
        }
    }

    provideFix(info: QuickFixQueryInformation): Refactoring[] {
        var strRoot = isAPartOfAChainOfStringAdditions(info.positionNode, info.typeChecker);

        let finalOutput: string[] = [];

        let current: ts.Node = strRoot;

        var backTickCharacter = '`';
        var backTick = new RegExp(backTickCharacter, 'g');
        var $regex = /\$/g;

        const appendToFinal = (node: ts.Node) => {
            // Each string literal needs :
            // to be checked that it doesn't contain (`) and those need to be escaped.
            // Also `$` needs escaping
            // Also the quote characters at the limits need to be removed
            if (node.kind == ts.SyntaxKind.StringLiteral) {
                let text = node.getText();
                let quoteCharacter = text.trim()[0];

                let quoteRegex = new RegExp(quoteCharacter, 'g')
                let escapedQuoteRegex = new RegExp(`\\\\${quoteCharacter}`, 'g')

                let newText = text
                    .replace(backTick, `\\${backTickCharacter}`)
                    .replace(escapedQuoteRegex, quoteCharacter)
                    .replace($regex, '\\$');

                newText = newText.substr(1, newText.length - 2);
                finalOutput.unshift(newText);
            }
            else if (node.kind == ts.SyntaxKind.TemplateExpression || node.kind == ts.SyntaxKind.NoSubstitutionTemplateLiteral)
            {
                let text = node.getText();
                text = text.trim();
                text = text.substr(1, text.length - 2);
                finalOutput.unshift(text);
            }
            // Each expression that isn't a string literal will just be escaped `${}`
            else {
                finalOutput.unshift('${' + node.getText() + '}');
            }
        }

        // We pop of each left node one by one
        while (true) {
            // if we are still in some sequence of additions
            if (current.kind == ts.SyntaxKind.BinaryExpression) {
                let binary = <ts.BinaryExpression>current;
                appendToFinal(binary.right);

                // Continue with left
                current = binary.left;
            }
            else {
                appendToFinal(current);
                break;
            }
        }

        let newText = backTickCharacter + finalOutput.join('') + backTickCharacter;

        var refactoring: Refactoring = {
            span: {
                start: strRoot.getStart(),
                length: strRoot.end - strRoot.getStart()
            },
            newText,
            filePath: info.filePath
        };

        return [refactoring];
    }
}
