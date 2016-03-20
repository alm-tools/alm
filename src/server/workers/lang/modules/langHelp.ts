/**
 * Objective: provide help on the JavaScript / TypeScript languauge. Eg. `for..of` purpose etc.
 */
import {Types} from "../../../../socket/socketContract";
export function getLangHelp(node: ts.Node): Types.LangHelp {
    switch (node.kind) {
        case ts.SyntaxKind.StringKeyword:
            // : string
            return {
                displayName: "string type annotation",
                help: "https://basarat.gitbooks.io/typescript/content/docs/types/type-system.html#primitive-types"
            }
        case ts.SyntaxKind.ConstKeyword:
            return {
                displayName: "const keyword",
                help: "https://basarat.gitbooks.io/typescript/content/docs/const.html"
            }
        case ts.SyntaxKind.LetKeyword:
            return {
                displayName: "let keyword",
                help: "https://basarat.gitbooks.io/typescript/content/docs/let.html"
            }
        case ts.SyntaxKind.ClassKeyword:
            return {
                displayName: "class keyword",
                help: "https://basarat.gitbooks.io/typescript/content/docs/classes.html"
            }
    }
}
