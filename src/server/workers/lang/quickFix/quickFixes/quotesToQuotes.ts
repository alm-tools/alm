import {QuickFix, QuickFixQueryInformation, Refactoring, CanProvideFixResponse} from "../quickFix";
import * as ast from "../astUtils";
import {EOL} from "os";

export class QuotesToQuotes implements QuickFix {
    key = QuotesToQuotes.name;

    canProvideFix(info: QuickFixQueryInformation): CanProvideFixResponse {
        if (info.positionNode.kind === ts.SyntaxKind.StringLiteral) {
            if (info.positionNode.getText().trim()[0] === `'`) {
                return { display: `Convert ' to "` };
            }
            if (info.positionNode.getText().trim()[0] === `"`) {
                return { display: `Convert " to '` };
            }
        }
    }

    provideFix(info: QuickFixQueryInformation): Refactoring[] {

        var text = info.positionNode.getText();
        var quoteCharacter = text.trim()[0];
        var nextQuoteCharacter = quoteCharacter === "'" ? '"' : "'";

        // STOLEN : https://github.com/atom/toggle-quotes/blob/master/lib/toggle-quotes.coffee
        var quoteRegex = new RegExp(quoteCharacter, 'g')
        var escapedQuoteRegex = new RegExp(`\\\\${quoteCharacter}`, 'g')
        var nextQuoteRegex = new RegExp(nextQuoteCharacter, 'g')

        var newText = text
            .replace(nextQuoteRegex, `\\${nextQuoteCharacter}`)
            .replace(escapedQuoteRegex, quoteCharacter);

        newText = nextQuoteCharacter + newText.substr(1, newText.length - 2) + nextQuoteCharacter

        var refactoring: Refactoring = {
            span: {
                start: info.positionNode.getStart(),
                length: info.positionNode.end - info.positionNode.getStart()
            },
            newText,
            filePath: info.filePath
        };

        return [refactoring];
    }
}
