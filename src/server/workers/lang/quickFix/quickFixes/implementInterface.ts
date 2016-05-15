import {QuickFix, QuickFixQueryInformation, Refactoring, CanProvideFixResponse} from "../quickFix";
import * as ast from "../astUtils";
import {EOL} from "os";

function getClassAndInterfaceName(error: ts.Diagnostic) {
    var errorText: string = ts.flattenDiagnosticMessageText(error.messageText, EOL);

    var match = errorText.match(/Class \'(\w+)\' incorrectly implements interface \'(\w+)\'./);

    // safety 
    if (!match || match.length !== 3) return;

    var [, className, interfaceName] = match;
    return { className, interfaceName };
}

export class ImplementInterface implements QuickFix {
    key = ImplementInterface.name;

    canProvideFix(info: QuickFixQueryInformation): CanProvideFixResponse {
        var relevantError = info.positionErrors.filter(x=> x.code == ts.Diagnostics.Class_0_incorrectly_implements_interface_1.code)[0];
        if (!relevantError) return;
        if (info.positionNode.kind !== ts.SyntaxKind.Identifier) return;

        var match = getClassAndInterfaceName(relevantError);

        if (!match) return;

        var {className, interfaceName} = match;
        return { display: `Implement members of ${interfaceName} in ${className}` };
    }

    provideFix(info: QuickFixQueryInformation): Refactoring[] {
        var relevantError = info.positionErrors.filter(x=> x.code == ts.Diagnostics.Class_0_incorrectly_implements_interface_1.code)[0];
        if (!relevantError) return;
        if (info.positionNode.kind !== ts.SyntaxKind.Identifier) return;

        var match = getClassAndInterfaceName(relevantError);
        var {className, interfaceName} = match;
        
        // Get all the members of the interface: 
        let interfaceTarget = <ts.InterfaceDeclaration>ast.getNodeByKindAndName(info.program, ts.SyntaxKind.InterfaceDeclaration, className);

        // The class that we are trying to add stuff to 
        let classTarget = <ts.ClassDeclaration>ast.getNodeByKindAndName(info.program, ts.SyntaxKind.ClassDeclaration, className);

        // Then the last brace
        let braces = classTarget.getChildren().filter(x=> x.kind == ts.SyntaxKind.CloseBraceToken);
        let lastBrace = braces[braces.length - 1];
        
        // And the correct indent
        var indentLength = info.service.getIndentationAtPosition(
            classTarget.getSourceFile().fileName, lastBrace.getStart(), info.project.projectFile.project.formatCodeOptions);
        var indent = Array(indentLength + info.project.projectFile.project.formatCodeOptions.IndentSize + 1).join(' ');

        let refactorings: Refactoring[] = [];
        
        //
        // The code for the error is actually from typeChecker.checkTypeRelatedTo so investigate that code more
        // also look at the code from the mixin PR on ms/typescript
        //
        
        // And add stuff after the last brace
        // let refactoring: Refactoring = {
        //     span: {
        //         start: firstBrace.end,
        //         length: 0
        //     },
        //     newText: `${EOL}${indent}${identifierName}: ${typeString};`,
        //     filePath: targetDeclaration.getSourceFile().fileName
        // };

        return refactorings;
    }
}