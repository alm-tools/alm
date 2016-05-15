import {QuickFix, QuickFixQueryInformation, Refactoring, CanProvideFixResponse} from "../quickFix";
import * as ast from "../astUtils";
import {EOL} from "os";

export class EqualsToEquals implements QuickFix {
    key = EqualsToEquals.name;

    canProvideFix(info: QuickFixQueryInformation): CanProvideFixResponse {
        if (info.positionNode.kind === ts.SyntaxKind.EqualsEqualsToken) {
            return { display: "Convert == to ===" };
        }
        if (info.positionNode.kind === ts.SyntaxKind.ExclamationEqualsToken) {
            return { display: "Convert != to !==" };
        }
    }

    provideFix(info: QuickFixQueryInformation): Refactoring[] {

        if (info.positionNode.kind === ts.SyntaxKind.EqualsEqualsToken) {
            var newText = '===';
        }
        if (info.positionNode.kind === ts.SyntaxKind.ExclamationEqualsToken) {
            var newText = '!==';
        }

        var refactoring: Refactoring = {
            span: {
                // Since TypeScript stores trivia at with the node `pos` we only want 2 steps behind the `end` instead of `pos`
                start: info.positionNode.end - 2,
                length: 2
            },
            newText,
            filePath: info.filePath
        };

        return [refactoring];
    }
}
