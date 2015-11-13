"use strict";
import ts = require('ntypescript');
import * as classifierCache from "./classifierCache";

type BracketsStackItem = {
    indent: number ; brackets: string[]
}

/** Our state per line for CodeMirror mode */
interface LineDescriptor {
    classificationMap: { [position: number]: classifierCache.ClassifiedSpan };
	classifications: classifierCache.ClassifiedSpan[];

    indent: number;
    nextLineIndent: number;
    bracketsStack: BracketsStackItem[]

	/** Things that would help us know where we are in the file */
	lineNumber: number;
	lineStartIndex: number;
}


function last<T>(arr: T[]) {
    return arr[arr.length -1];
}

function getStyleForToken(token: classifierCache.ClassifiedSpan, textBefore: string): string {
	var ClassificationType = ts.ClassificationType;
	switch (token.classificationType) {
		case ClassificationType.numericLiteral:
			return 'number';
		case ClassificationType.stringLiteral:
			return 'string';
		case ClassificationType.regularExpressionLiteral:
			return 'string-2';
		case ClassificationType.operator:
			return 'operator';
		case ClassificationType.comment:
			return 'comment';
		case ClassificationType.keyword:
			switch (token.string) {
				case 'string':
				case 'number':
				case 'void':
				case 'bool':
				case 'boolean':
					return 'variable-2';
				case 'static':
				case 'public':
				case 'private':
				case 'get':
				case 'set':
					return 'qualifier';
				case 'class':
				case 'function':
				case 'module':
				case 'var':
				case 'let':
				case 'const':
					return 'def';
				default:
					return 'keyword';
			}

		case ClassificationType.identifier:
			// Show types (indentifiers in PascalCase) as variable-2, other types (camelCase) as variable
			if (token.string.charAt(0).toLowerCase() !== token.string.charAt(0)) {
				return 'variable-2';
			} else {
				return 'variable';
			}
		case ClassificationType.punctuation:
			return 'bracket';
		case ClassificationType.jsxOpenTagName:
		case ClassificationType.jsxCloseTagName:
		case ClassificationType.jsxSelfClosingTagName:
			return 'tag';
		case ClassificationType.whiteSpace:
		default:
			return null;
	}
}


var openingBrackets = ['{', '(', '[', '<'];
var closingBrackets = ['}', ')', ']', '>'];

function isOpening(bracket: string) {
    return openingBrackets.indexOf(bracket) !== -1;
}

function isClosing(bracket: string) {
    return closingBrackets.indexOf(bracket) !== -1;
}


function isPair(opening: string, closing: string) {
    return openingBrackets.indexOf(opening) === closingBrackets.indexOf(closing);
}


function getLineDescriptorInfo(text: string, classifications: classifierCache.ClassifiedSpan[], indent: number, bracketsStack: BracketsStackItem[]) {
    bracketsStack = bracketsStack.map(item => ({
        indent: item.indent,
        brackets: item.brackets.slice()
    }));

    var classificationMap: { [position: number]: classifierCache.ClassifiedSpan } = {};

    var openedBrackets: string[] = [];
    var closedBrackets: string[] = []

    function openBracket(openedBracket: string) {
        openedBrackets.push(openedBracket);
    }

    function closeBracket(closedBracket: string) {
        var openedBracket = last(openedBrackets)
        if (openedBracket) {
            if (isPair(openedBracket, closedBracket)) {
                openedBrackets.pop();
            }
        } else {
            closedBrackets.push(closedBracket)
        }
    }


    for (var i = 0, l = classifications.length; i < l; i++) {
        var classification = classifications[i];
        classificationMap[classification.startInLine] = classification;
        if (classification.classificationType === ts.ClassificationType.punctuation) {
            if (isClosing(classification.string)) {
                closeBracket(classification.string);
            } else if (isOpening(classification.string)) {
                openBracket(classification.string);
            }
        }
    }



    if (closedBrackets.length) {
        var newStack: string[][] = [];
        for (var i = bracketsStack.length -1; i >=0; i--) {
            var item = bracketsStack[i];
            var brackets = item.brackets;

            var hasPair = false;
            while (
                isPair(last(brackets), closedBrackets[0]) &&
                brackets.length && item.brackets.length
            ) {
                brackets.pop();
                closedBrackets.shift();
                hasPair = true;
            }

            if (hasPair) {
                indent = item.indent;
            }

            if (!brackets.length) {
                bracketsStack.pop();
            } else {
                // in this case we had closing token that are not pair with our openingStack
                // error
                break;
            }
        }
    }

    if (openedBrackets.length) {
        bracketsStack.push({
            indent: indent,
            brackets: openedBrackets
        });
    }

    return {
        classificationMap: classificationMap,
        indent: indent,
        bracketsStack: bracketsStack,
        hasOpening: !!openedBrackets.length
    }
}

function typeScriptModeFactory(options: CodeMirror.EditorConfiguration, spec: any): CodeMirror.Mode<any> {
    return {
        lineComment: '//',
        blockCommentStart: '/*',
        blockCommentEnd: '*/',
        electricChars: ':{}[]()',

        startState(): LineDescriptor {
            return {
                classificationMap: {},
                indent: 0,
                nextLineIndent: 0,
                bracketsStack: [],
				lineNumber: 0,
				lineStartIndex: 0,
				classifications: [],
            };
        },

        copyState(lineDescriptor: LineDescriptor): LineDescriptor {
            return {
                classificationMap: lineDescriptor.classificationMap,
                indent: lineDescriptor.indent,
                nextLineIndent: lineDescriptor.nextLineIndent,
                bracketsStack: lineDescriptor.bracketsStack,
				lineNumber: lineDescriptor.lineNumber,
				lineStartIndex: lineDescriptor.lineStartIndex,
				classifications: lineDescriptor.classifications,
            }
        },

		blankLine(lineDescriptor: LineDescriptor){
			lineDescriptor.lineNumber++;
			lineDescriptor.lineStartIndex++;
		},

        token(stream: CodeMirror.StringStream, lineDescriptor: LineDescriptor): string {
            if (stream.sol()) {

				let classifications = classifierCache.getClassificationsForLine(options.filePath, lineDescriptor.lineStartIndex, stream.string);
                let info = getLineDescriptorInfo(stream.string, classifications, lineDescriptor.nextLineIndent, lineDescriptor.bracketsStack);

                // console.log('%c'+stream.string,"font-size: 20px");
                // console.table(classifications.map(c=> ({ str: c.string, cls: c.classificationTypeName,startInLine:c.startInLine })));

				// Update info for next call
                lineDescriptor.classificationMap = info.classificationMap;
				lineDescriptor.classifications = classifications;
                lineDescriptor.bracketsStack = info.bracketsStack;
                lineDescriptor.indent = info.indent;
                lineDescriptor.nextLineIndent = info.hasOpening ? info.indent + 1 : info.indent;
				lineDescriptor.lineNumber++;
				lineDescriptor.lineStartIndex = lineDescriptor.lineStartIndex + stream.string.length + 1;
            }

            var classifiedSpan = lineDescriptor.classificationMap[stream.pos];
			// console.log(lineDescriptor.lineNumber, stream.pos,lineDescriptor.classificationMap);
            if (classifiedSpan) {
                var textBefore: string  = stream.string.substr(0, stream.pos);
                for (var i = 0; i < classifiedSpan.string.length; i++) {
                    stream.next();
                }
                return getStyleForToken(classifiedSpan, textBefore);
            } else {
                stream.skipToEnd();
            }

            return null;
        },


        indent(lineDescriptor: LineDescriptor , textAfter: string): number {
            let indentOptions: ts.EditorOptions = {
                IndentSize: options.indentUnit,
                TabSize: options.tabSize,
                NewLineCharacter: '\n',
                IndentStyle : ts.IndentStyle.Smart,
                ConvertTabsToSpaces: !options.indentWithTabs
            }
            let indent = classifierCache.getIndentationAtPosition(options.filePath, lineDescriptor.lineStartIndex, indentOptions);
            // if called for a } decrease the indent
            if (textAfter.trim() == '}'){
                indent -= options.indentUnit;
            }

            // if (textAfter) {
            //     indent = getLineDescriptorInfo(textAfter, lineDescriptor.classifications, lineDescriptor.nextLineIndent, lineDescriptor.bracketsStack).indent;
            // }
            return indent;
        }
    }
}

import CodeMirror = require('codemirror');
export function register(){
    CodeMirror.defineMode('typescript', typeScriptModeFactory);
}
