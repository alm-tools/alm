import utils = require("../../utils");
import {QuickFix, QuickFixQueryInformation, Refactoring, CanProvideFixResponse} from "../quickFix";
import * as ast from "../astUtils";
import {EOL} from "os";

export class SingleLineCommentToJsdoc implements QuickFix {
    key = SingleLineCommentToJsdoc.name;

    validNodes = utils.createMap([
        ts.SyntaxKind.ExportKeyword,
        ts.SyntaxKind.VarKeyword,
        ts.SyntaxKind.LetKeyword,
        ts.SyntaxKind.ConstKeyword,
        ts.SyntaxKind.FunctionKeyword,
    ]);

    canProvideFix(info: QuickFixQueryInformation): CanProvideFixResponse {
        if (this.validNodes[info.positionNode.kind]) {
            let comments = ts.getLeadingCommentRangesOfNode(info.positionNode, info.sourceFile);
            if (!comments) return;

            const mapped = comments.map(c=> info.sourceFileText.substring(c.pos, c.end));
            if (!mapped.length) return;

            let relevantComment = mapped[mapped.length - 1];

            if (relevantComment.startsWith('//'))
                return { display: 'Convert comment to jsDoc' };
        }
    }

    provideFix(info: QuickFixQueryInformation): Refactoring[] {
        
        let comments = ts.getLeadingCommentRangesOfNode(info.positionNode, info.sourceFile);        
        let relevantComment = comments[comments.length - 1];
        var oldText = info.sourceFileText.substring(relevantComment.pos, relevantComment.end);
        let newText = "/** " + oldText.substr(2).trim() + " */";

        var refactoring: Refactoring = {
            span: {
                start: relevantComment.pos,
                length: relevantComment.end - relevantComment.pos
            },
            newText,
            filePath: info.filePath
        };

        return [refactoring];
    }
}
