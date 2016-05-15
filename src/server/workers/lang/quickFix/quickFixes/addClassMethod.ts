import {QuickFix, QuickFixQueryInformation, Refactoring, CanProvideFixResponse} from "../quickFix";
import * as ast from "../astUtils";
import {EOL} from "os";

function getIdentifierAndClassNames(error: ts.Diagnostic) {
    var errorText: string = <any>error.messageText;
    if (typeof errorText !== 'string') {
        console.error('I have no idea what this is:', errorText);
        return undefined;
    };

    // see https://github.com/Microsoft/TypeScript/blob/6637f49209ceb5ed719573998381eab010fa48c9/src/compiler/diagnosticMessages.json#L842
    var match = errorText.match(/Property \'(\w+)\' does not exist on type \'(\w+)\'./);

    // Happens when the type name is an alias. We can't refactor in this case anyways
    if (!match) return;

    var [, identifierName, className] = match;
    return { identifierName, className };
}

/** foo.a => a */
function getLastNameAfterDot(text: string) {
    return text.substr(text.lastIndexOf('.') + 1);
}

function getTypeStringForNode(node: ts.Node, typeChecker: ts.TypeChecker) {
    var type = typeChecker.getTypeAtLocation(node);

    /** Discoverd from review of `services.getQuickInfoAtPosition` */
    return ts.displayPartsToString(ts.typeToDisplayParts(typeChecker, type)).replace(/\s+/g, ' ');
}

export class AddClassMethod implements QuickFix {
    key = AddClassMethod.name;

    canProvideFix(info: QuickFixQueryInformation): CanProvideFixResponse {
        var relevantError = info.positionErrors.filter(x=> x.code == ts.Diagnostics.Property_0_does_not_exist_on_type_1.code)[0];
        if (!relevantError) return;
        if (info.positionNode.kind !== ts.SyntaxKind.Identifier) return;

        // TODO: use type checker to see if item of `.` before hand is a class
        //  But for now just run with it.

        var match = getIdentifierAndClassNames(relevantError);

        if (!match) return;

        var {identifierName, className} = match;
        return { display: `Add method "${identifierName}" to current class ${className}` };
    }

    provideFix(info: QuickFixQueryInformation): Refactoring[] {
        var relevantError = info.positionErrors.filter(x=> x.code == ts.Diagnostics.Property_0_does_not_exist_on_type_1.code)[0];
        var identifier = <ts.Identifier>info.positionNode;

        var identifierName = identifier.text;
        var {className} = getIdentifierAndClassNames(relevantError);

        // Get the type of the stuff on the right if its an assignment
        var typeString = 'any';
        var parentOfParent = identifier.parent.parent;
        if (parentOfParent.kind == ts.SyntaxKind.BinaryExpression
            && (<ts.BinaryExpression>parentOfParent).operatorToken.getText().trim() == '=') {

            let binaryExpression = <ts.BinaryExpression>parentOfParent;
            typeString = getTypeStringForNode(binaryExpression.right, info.typeChecker);

        }
        else if (parentOfParent.kind == ts.SyntaxKind.CallExpression) {

            let nativeTypes = ['string', 'number', 'boolean', 'object', 'null', 'undefined', 'RegExp'];
            let abc = 'abcdefghijklmnopqrstuvwxyz';
            let argsAlphabet = abc.split('');
            let argsAlphabetPosition = 0;
            let argName = '';
            let argCount = 0;

            let callExp = <ts.CallExpression>parentOfParent;
            let typeStringParts = ['('];

            // Find the number of arguments
            let args = [];
            callExp.arguments.forEach(arg => {
                var argType = getTypeStringForNode(arg, info.typeChecker);

                // determine argument output type
                // use consecutive letters for native types
                // or use decapitalized Class name + counter as argument name
                if (nativeTypes.indexOf(argType) != -1 //native types
                    || argType.indexOf('{') != -1 //Casted inline argument declarations
                    || argType.indexOf('=>') != -1 //Method references
                    || argType.indexOf('[]') != -1 //Array references
                    ) {

                    var type:ts.Type = info.typeChecker.getTypeAtLocation(arg);
                    var typeName:string = "type";
                    if (type &&
                        type.symbol &&
                        type.symbol.name) {
                        typeName = type.symbol.name.replace(/[\[\]]/g,'');
                    };
                    var hasAnonymous = typeName.indexOf('__') == 0;
                    var isAnonymousTypedArgument = hasAnonymous && typeName.substring(2) == "type";
                    var isAnonymousMethod = hasAnonymous && typeName.substring(2) == "function";
                    var isAnonymousObject = hasAnonymous && typeName.substring(2) == "object";

                    if (argType.indexOf('=>') != -1 &&
                        !isAnonymousTypedArgument &&
                        !isAnonymousMethod &&
                        !isAnonymousObject) {
                        if( typeName =='Array' ) typeName = 'array';
                        argName = `${typeName}${argCount++}`;
                    }
                    else if( argType.indexOf('[]') != -1 )
                    {
                        argName = `array${argCount++}`;
                    }
                    else {
                        if (isAnonymousMethod) {
                            typeName = "function";
                            argName = `${typeName}${argCount++}`;
                        }
                        else if (isAnonymousObject) {
                            typeName = "object";
                            argName = `${typeName}${argCount++}`;
                        }
                        else {
                            argName = argsAlphabet[argsAlphabetPosition];
                            argsAlphabet[argsAlphabetPosition] += argsAlphabet[argsAlphabetPosition].substring(1);
                            argsAlphabetPosition++;
                            argsAlphabetPosition %= abc.length;
                        }
                    }
                }
                else {
                    // replace 'typeof ' from name
                    argName = argType.replace('typeof ', '');
                    // decapitalize and concat
                    if (argType.indexOf('typeof ') == -1) {
                        var firstLower = argName[0].toLowerCase();

                        if (argName.length == 1) {
                            argName = firstLower;
                        }
                        else {
                            argName = firstLower + argName.substring(1);
                        }
                    }
                    // add counter value and increment it
                    argName += argCount.toString();
                    argCount++
                }

                // cast null and undefined to any type
                if (argType.indexOf('null')!=-1 || argType.indexOf('undefined')!=-1) {
                    argType = argType.replace(/null|undefined/g,'any');
                }
                args.push(`${argName}: ${argType}`);

            });
            typeStringParts.push(args.join(', '));

            // TODO: infer the return type as well if the next parent is an assignment
            // Currently its `any`
            typeStringParts.push(`): any { }`);
            typeString = typeStringParts.join('');
        }

        // Find the containing class declaration
        var memberTarget = ast.getNodeByKindAndName(info.program, ts.SyntaxKind.ClassDeclaration, className);
        if (!memberTarget) {
            // Find the containing interface declaration
            memberTarget = ast.getNodeByKindAndName(info.program, ts.SyntaxKind.InterfaceDeclaration, className);
        }
        if (!memberTarget) {
            return [];
        }

        // The following code will be same (and typesafe) for either class or interface
        let targetDeclaration = <ts.ClassDeclaration|ts.InterfaceDeclaration>memberTarget;

        // Then the first brace
        let firstBrace = targetDeclaration.getChildren().filter(x=> x.kind == ts.SyntaxKind.OpenBraceToken)[0];

        // And the correct indent
        var indentLength = info.service.getIndentationAtPosition(
            memberTarget.getSourceFile().fileName, firstBrace.end, info.project.projectFile.project.formatCodeOptions);
        var indent = Array(indentLength + info.project.projectFile.project.formatCodeOptions.IndentSize + 1).join(' ');

        // And add stuff after the first brace
        let refactoring: Refactoring = {
            span: {
                start: firstBrace.end,
                length: 0
            },
            newText: `${EOL}${indent}public ${identifierName}${typeString}`,
            filePath: targetDeclaration.getSourceFile().fileName
        };

        return [refactoring];
    }
}



/* TESTS */
/*
enum EnumTest{
    one,two
}
class DataClass{};
class FixTests{

    public static STATIC_METHOD():typeof FixTests{ return FixTests }
    public instanceMethod():FixTests{ return this;}
    public instanceGeneric<T>(a:T):T{ return a;}
    constructor(){
        this.simple(true,1,'1',/1/g,null,undefined);
        this.methods( this.instanceMethod, FixTests.STATIC_METHOD );
        this.enums( EnumTest, EnumTest.one );
        this.castedMembers(
            <HTMLElement>{},
            <{x:number; y:number}>{},
            <{fn:(e:FixTests)=>FixTests}>{}
        );
        this.inlineMethods(():number=>{ return -1;});
        this.inlineObjects({
            quickFix:new FixTests,
            type:FixTests,
            step:EnumTest.two
            });
        this.genericMethod( this.instanceGeneric, this.instanceGeneric<FixTests>(this) );

        this.arraySimple([true], [1], ['1'], [/1/g],[null],[undefined]);
        this.arrayMethods([this.instanceMethod, FixTests.STATIC_METHOD]);
        this.arrayEnums([EnumTest], [EnumTest.one]);
        this.arrayCastedMembers(
            [<HTMLElement>{}],
            [<{ x: number; y: number }>{}],
            [<{ fn: (e: FixTests) => FixTests }>{}]
            );
        this.arrayInlineMethods([(): number=> { return -1; }]);
        this.arrayInlineObjects([{
            quickFix: new FixTests,
            type: FixTests,
            step: EnumTest.two
        }]);
        this.arrayGenericMethod([this.instanceGeneric], [this.instanceGeneric<FixTests>(this)]);
    }
}
*/
