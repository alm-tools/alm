import {QuickFix, QuickFixQueryInformation, Refactoring, CanProvideFixResponse} from "../quickFix";
import * as ast from "../astUtils";
import {EOL } from "os";
var { displayPartsToString, typeToDisplayParts } = ts;
import path = require('path');
import {Project} from "../../core/project";

import {getPathCompletions} from "../../modules/getPathCompletions";

function getIdentifierAndFileNames(error: ts.Diagnostic, project: Project) {

    var errorText: string = <any>error.messageText;

    // We don't support error chains yet
    if (typeof errorText !== 'string') {
        return undefined;
    };

    var match = errorText.match(/Cannot find name \'(\w+)\'./);

    // If for whatever reason the error message doesn't match
    if (!match) return;

    var [, identifierName] = match;
    var {files} = getPathCompletions({
        project,
        filePath: error.file.fileName,
        prefix: identifierName,
        includeExternalModules: false
    });
    var file = files.length > 0 ? files[0].relativePath : undefined;
    var basename = files.length > 0 ? files[0].name : undefined;
    return { identifierName, file, basename };
}

export class AddImportStatement implements QuickFix {
    key = AddImportStatement.name;

    canProvideFix(info: QuickFixQueryInformation): CanProvideFixResponse {
        var relevantError = info.positionErrors.filter(x=> x.code == 2304)[0];
        if (!relevantError) return;
        if (info.positionNode.kind !== ts.SyntaxKind.Identifier) return;
        var matches = getIdentifierAndFileNames(relevantError, info.project);
        if (!matches) return;

        var { identifierName, file} = matches;
        return file ? { display: `import ${identifierName} = require(\"${file}\")` } : undefined;
    }

    provideFix(info: QuickFixQueryInformation): Refactoring[] {
        var relevantError = info.positionErrors.filter(x=> x.code == 2304)[0];
        var identifier = <ts.Identifier>info.positionNode;

        var identifierName = identifier.text;
        var fileNameforFix = getIdentifierAndFileNames(relevantError, info.project);

        // Add stuff at the top of the file
        let refactorings: Refactoring[] = [{
            span: {
                start: 0,
                length: 0
            },
            newText: `import ${identifierName} = require(\"${fileNameforFix.file}\");${EOL}`,
            filePath: info.sourceFile.fileName
        }];

        // Also refactor the variable name to match the file name
        // TODO: the following code only takes into account location
        // There may be other locations where this is used.
        // Better that they trigger a *rename* explicitly later if they want to rename the variable
        // if (identifierName !== fileNameforFix.basename) {
        //     refactorings.push({
        //         span: {
        //             start: identifier.getStart(),
        //             length: identifier.end - identifier.getStart()
        //         },
        //         newText: fileNameforFix.basename,
        //         filePath: info.srcFile.fileName
        //     })
        // }

        return refactorings;
    }
}
