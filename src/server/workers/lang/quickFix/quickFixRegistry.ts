import {QuickFix} from "./quickFix";
/**
 * This exists to register the quick fixes
 */
import {AddClassMember} from "./quickFixes/addClassMember";
import {EqualsToEquals} from "./quickFixes/equalsToEquals";
import {QuotesToQuotes} from "./quickFixes/quotesToQuotes";
import {QuoteToTemplate} from "./quickFixes/quoteToTemplate";
import {StringConcatToTemplate} from "./quickFixes/stringConcatToTemplate";
import {TypeAssertPropertyAccessToAny} from "./quickFixes/typeAssertPropertyAccessToAny";
import {ImplementInterface} from "./quickFixes/implementInterface";
import {SingleLineCommentToJsdoc} from "./quickFixes/singleLineCommentToJsdoc";
export var allQuickFixes: QuickFix[] = [
    new AddClassMember(),
    new EqualsToEquals(),
    new StringConcatToTemplate(),
    new QuotesToQuotes(),
    new QuoteToTemplate(),
    new TypeAssertPropertyAccessToAny(),
    new ImplementInterface(),
    new SingleLineCommentToJsdoc()
];
