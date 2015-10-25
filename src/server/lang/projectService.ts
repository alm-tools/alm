/**
 * The stuff from project that the frontend queries.
 * Stuff like autocomplete is a good example.
 * Errors etc are pushed automatically from `activeProject` and do not belong here :)
 */

import * as activeProject from "./activeProject";
let getProject = activeProject.getProjectIfCurrentOrErrorOut;

import {Types} from "../../socket/socketContract";

import * as utils from "../../common/utils";
let {resolve} = utils;

import fuzzaldrin = require('fuzzaldrin');

export function getCompletionsAtPosition(query: Types.GetCompletionsAtPositionQuery): Promise<Types.GetCompletionsAtPositionResponse> {
    let {filePath, position, prefix} = query;
    let project = getProject(query.filePath);

    var completions: ts.CompletionInfo = project.languageService.getCompletionsAtPosition(filePath, position);
    var completionList = completions ? completions.entries.filter(x=> !!x) : [];
    var endsInPunctuation = utils.prefixEndsInPunctuation(prefix);

    if (prefix.length && !endsInPunctuation) {
        // Didn't work good for punctuation
        completionList = fuzzaldrin.filter(completionList, prefix, { key: 'name' });
    }

    /** Doing too many suggestions is slowing us down in some cases */
    let maxSuggestions = 50;
    /** Doc comments slow us down tremendously */
    let maxDocComments = 10;

    // limit to maxSuggestions
    if (completionList.length > maxSuggestions) completionList = completionList.slice(0, maxSuggestions);

    // Potentially use it more aggresively at some point
    function docComment(c: ts.CompletionEntry): { display: string; comment: string; } {
        var completionDetails = project.languageService.getCompletionEntryDetails(filePath, position, c.name);

        // Show the signatures for methods / functions
        var display: string;
        if (c.kind == "method" || c.kind == "function" || c.kind == "property") {
            let parts = completionDetails.displayParts || [];
            // don't show `(method)` or `(function)` as that is taken care of by `kind`
            if (parts.length > 3) {
                parts = parts.splice(3);
            }
            display = ts.displayPartsToString(parts);
        }
        else {
            display = '';
        }
        var comment = (display ? display + '\n' : '') + ts.displayPartsToString(completionDetails.documentation || []);

        return { display: display, comment: comment };
    }

    let completionsToReturn: Types.Completion[] = completionList.map((c, index) => {
        if (index < maxDocComments) {
            var details = docComment(c);
        }
        else {
            details = {
                display: '',
                comment: ''
            }
        }
        return {
            name: c.name,
            kind: c.kind,

            color: kindToColor(c.kind),
            colorBackground: kindToColor(c.kind,true),

            comment: details.comment,
            display: details.display
        };
    });

    if (query.prefix == '(') {
        var signatures = project.languageService.getSignatureHelpItems(query.filePath, query.position);
        if (signatures && signatures.items) {
            signatures.items.forEach((item) => {
                var snippet: string = item.parameters.map((p, i) => {
                    var display = '${' + (i + 1) + ':' + ts.displayPartsToString(p.displayParts) + '}';
                    if (i === signatures.argumentIndex) {
                        return display;
                    }
                    return display;
                }).join(ts.displayPartsToString(item.separatorDisplayParts));

                // We do not use the label for now. But it looks too good to kill off
                var label: string = ts.displayPartsToString(item.prefixDisplayParts)
                    + snippet
                    + ts.displayPartsToString(item.suffixDisplayParts);

                completionsToReturn.unshift({ snippet });
            });
        }
    }

    return resolve({
        completions: completionsToReturn,
        endsInPunctuation: endsInPunctuation
    });
}

import ts = require('ntypescript');
function kindToColor(kind:string, lighten = false){
    let add = lighten?50:0;
    let opacity = lighten?0.2:1;
    let base = 'white';
    switch(kind){
        case ts.ScriptElementKind.keyword:
            // redish
            return `rgba(${0xf9 + add},${0x26 + add},${0x72 + add},${opacity})`;
        case ts.ScriptElementKind.scriptElement:
        case ts.ScriptElementKind.moduleElement:
        case ts.ScriptElementKind.classElement:
        case ts.ScriptElementKind.localClassElement:
        case ts.ScriptElementKind.interfaceElement:
        case ts.ScriptElementKind.typeElement:
        case ts.ScriptElementKind.enumElement:
        case ts.ScriptElementKind.alias:
        case ts.ScriptElementKind.typeParameterElement:
        case ts.ScriptElementKind.primitiveType:
            // yelloish
            // #e6db74
            return `rgba(${0xe6 + add},${0xdb + add},${0x74 + add},${opacity})`;
        case ts.ScriptElementKind.variableElement:
        case ts.ScriptElementKind.localVariableElement:
        case ts.ScriptElementKind.memberVariableElement:
        case ts.ScriptElementKind.letElement:
        case ts.ScriptElementKind.constElement:
        case ts.ScriptElementKind.label:
        case ts.ScriptElementKind.parameterElement:
        case ts.ScriptElementKind.indexSignatureElement:
            // blueish
            // #66d9ef
            return `rgba(${0x66 + add},${0xd9 + add},${0xef + add},${opacity})`;
        case ts.ScriptElementKind.functionElement:
        case ts.ScriptElementKind.localFunctionElement:
        case ts.ScriptElementKind.memberFunctionElement:
        case ts.ScriptElementKind.memberGetAccessorElement:
        case ts.ScriptElementKind.memberSetAccessorElement:
        case ts.ScriptElementKind.callSignatureElement:
        case ts.ScriptElementKind.constructorImplementationElement:
            // greenish
            // #a6e22e
            return `rgba(${0xa6 + add},${0xe2 + add},${0x2e + add},${opacity})`;
        default:
            return base;
    }
}
