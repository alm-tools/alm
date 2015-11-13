"use strict";
import ts = require('ntypescript');
import * as classifierCache from "./classifierCache";

/** Our state per line for CodeMirror mode */
interface LineDescriptor {
    classificationMap: { [position: number]: classifierCache.ClassifiedSpan };
	classifications: classifierCache.ClassifiedSpan[];

	/** Things that would help us know where we are in the file */
	lineNumber: number;
	lineStartIndex: number;
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

function getClassificationMap(classifications: classifierCache.ClassifiedSpan[]) {
    var classificationMap: { [position: number]: classifierCache.ClassifiedSpan } = {};

    for (var i = 0, l = classifications.length; i < l; i++) {
        var classification = classifications[i];
        classificationMap[classification.startInLine] = classification;
    }

    return classificationMap
}

function typeScriptModeFactory(options: CodeMirror.EditorConfiguration, spec: any): CodeMirror.Mode<any> {
    return {
        lineComment: '//',
        blockCommentStart: '/*',
        blockCommentEnd: '*/',
        electricChars: ':{}[]()',

        startState(): LineDescriptor {
            return {
                classifications: [],
                classificationMap: {},
				lineNumber: 0,
				lineStartIndex: 0,
            };
        },

        copyState(lineDescriptor: LineDescriptor): LineDescriptor {
            return {
                classificationMap: lineDescriptor.classificationMap,
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
                let classificationMap = getClassificationMap(classifications);

                // console.log('%c'+stream.string,"font-size: 20px");
                // console.table(classifications.map(c=> ({ str: c.string, cls: c.classificationTypeName,startInLine:c.startInLine })));

				// Update info for next call
                lineDescriptor.classificationMap = classificationMap;
				lineDescriptor.classifications = classifications;
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

            return indent;
        }
    }
}

import CodeMirror = require('codemirror');
export function register(){
    CodeMirror.defineMode('typescript', typeScriptModeFactory);
}
