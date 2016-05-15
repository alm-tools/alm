import {QuickFix, QuickFixQueryInformation, Refactoring, CanProvideFixResponse} from "../quickFix";
import * as ast from "../astUtils";


export class TypeAssertPropertyAccessToType implements QuickFix {
    key = TypeAssertPropertyAccessToType.name;

    canProvideFix(info: QuickFixQueryInformation): CanProvideFixResponse {
        var relevantError = info.positionErrors.filter(x=> x.code == ts.Diagnostics.Property_0_does_not_exist_on_type_1.code)[0];
        if (!relevantError) return;
        if (info.positionNode.kind !== ts.SyntaxKind.Identifier) return;

        var match = getIdentifierName(info.positionErrorMessages[0]);

        if (!match) return;

        var {identifierName} = match;
        return {display: `Assert <Type> for property access "${identifierName}"`, isNewTextSnippet: true};
    }

    provideFix(info: QuickFixQueryInformation): Refactoring[] {
        /**
         * We want the largest property access expressing `a.b.c` starting at the identifer `c`
         * Since this gets tokenized as `a.b` `.` `c` so its just the parent :)
         */
        let parent = info.positionNode.parent;
        if (parent.kind == ts.SyntaxKind.PropertyAccessExpression) {
            let propertyAccess = <ts.PropertyAccessExpression>parent;
            let start = propertyAccess.getStart();
            let end = propertyAccess.dotToken.getStart();

            let oldText = propertyAccess.getText().substr(0, end - start);

            let refactoring: Refactoring = {
                filePath: info.filePath,
                span: {
                    start: start,
                    length: propertyAccess.name.end - start,
                },
                newText: `(${oldText} as \${1:any})\${2:.${propertyAccess.name.getText()}}\${3}`,
                isNewTextSnippet: true,
            };

            return [refactoring];
        }
        return [];
    }
}

function getIdentifierName(errorText: string) {
    // see https://github.com/Microsoft/TypeScript/blob/6637f49209ceb5ed719573998381eab010fa48c9/src/compiler/diagnosticMessages.json#L842
    var match = /Property \'(\w+)\' does not exist on type \.*/.exec(errorText);

    if (!match) return;

    var [, identifierName] = match;
    return { identifierName };
}
