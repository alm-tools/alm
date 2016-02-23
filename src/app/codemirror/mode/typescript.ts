"use strict";
import ts = require('ntypescript');
import * as classifierCache from "./classifierCache";

/** Our state per line for CodeMirror mode */
interface LineDescriptor {
    classificationMap: { [position: number]: classifierCache.ClassifiedSpan };

    /** Things that would help us know where we are in the file */
    lineNumber: number;
    lineStartIndex: number;

    /** Helps us track how many times `startState` has been called */
    version: number;

    /** Helps us with tag matching. We don't want to confuse `<TypeParameter>` with a JSX tag  */
    lineHasJSX: boolean;
}

interface ClassificationMap{ [position: number]: classifierCache.ClassifiedSpan }

function getStyleForToken(token: classifierCache.ClassifiedSpan, textBefore: string, nextTenChars: string, lineHasJSX:boolean): string {
    var ClassificationType = ts.ClassificationType;
    switch (token.classificationType) {
        case ClassificationType.numericLiteral:
            return 'number';
        case ClassificationType.stringLiteral:
            return 'string';
        case ClassificationType.regularExpressionLiteral:
            return 'string-2';
        case ClassificationType.operator:
            return 'keyword operator'; // The atom grammar does keyword+operator and I actually like that
        case ClassificationType.comment:
            return 'comment';
        case ClassificationType.className:
        case ClassificationType.enumName:
        case ClassificationType.interfaceName:
        case ClassificationType.moduleName:
        case ClassificationType.typeParameterName:
        case ClassificationType.typeAliasName:
            return 'variable-2';
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
                case 'function':
                case 'var':
                case 'let':
                case 'const':
                    return 'qualifier';
                case 'this':
                    return 'number'; // Atom does this `constant`
                default:
                    return 'keyword';
            }

        case ClassificationType.identifier:
            let lastToken = textBefore.trim();
            let nextStr: string; // setup only if needed

            if (lastToken.endsWith('let') || lastToken.endsWith('const') || lastToken.endsWith('var')) {
                return 'def';
            }
            else if ((nextStr = nextTenChars.replace(/\s+/g, '')).startsWith('(')
                || nextStr.startsWith('=(')
                || nextStr.startsWith('=function')) {
                return 'property'; // Atom does this called "method"/"function". I'm just lazy
            }
            // Show types (indentifiers in PascalCase) as variable-2, other types (camelCase) as variable
            else if (token.string.charAt(0).toLowerCase() !== token.string.charAt(0)
                && (lastToken.endsWith(':') || lastToken.endsWith('.')) /* :foo.Bar or :Foo */) {
                return 'variable-2';
            }
            else {
                return 'variable';
            }
        case ClassificationType.parameterName:
            return 'def';
        case ClassificationType.punctuation:
            // Only get punctuation for JSX. Otherwise these would be operator
            if (lineHasJSX && (token.string == '>' || token.string == '<' || token.string == '/>')) {
                return 'tag.bracket'; // we need tag + bracket for CM's tag matching
            }
            return 'bracket';
        case ClassificationType.jsxOpenTagName:
        case ClassificationType.jsxCloseTagName:
        case ClassificationType.jsxSelfClosingTagName:
            return 'tag';
        case ClassificationType.jsxAttribute:
            return 'property';
        case ClassificationType.jsxAttributeStringLiteralValue:
            return 'string';
        case ClassificationType.whiteSpace:
        default:
            return null;
    }
}

function getClassificationInformationForLine(classifications: classifierCache.ClassifiedSpan[]) : {classificationMap:ClassificationMap, lineHasJSX: boolean} {
    var classificationMap: ClassificationMap = {};
    let lineHasJSX = false;
    for (var i = 0, l = classifications.length; i < l; i++) {
        var classification = classifications[i];
        classificationMap[classification.startInLine] = classification;
        lineHasJSX = lineHasJSX
        || classification.classificationType === ts.ClassificationType.jsxOpenTagName
        || classification.classificationType === ts.ClassificationType.jsxCloseTagName
        || classification.classificationType === ts.ClassificationType.jsxSelfClosingTagName
        || classification.classificationType === ts.ClassificationType.jsxText
        || classification.classificationType === ts.ClassificationType.jsxAttribute
    }

    return {classificationMap,lineHasJSX}
}

/**
 * Codemirror does a optimized tokenization if one jumps to some line in the editor
 * It still runs the proper (precise) version slowly so it does eventually kick in
 * This is just to help us know about the version numbers. Not really used yet.
 */
const lastVersionForFilePath:{[filePath:string]:number} = {};

function typeScriptModeFactory(options: CodeMirror.EditorConfiguration, spec: any): CodeMirror.Mode<any> {
    lastVersionForFilePath[options.filePath] = 0;

    return {
        lineComment: '//',
        blockCommentStart: '/*',
        blockCommentEnd: '*/',
        electricChars: ':{}[]()',

        startState(): LineDescriptor {
            lastVersionForFilePath[options.filePath]++;
            return {
                classificationMap: {},
                lineNumber: 0,
                lineStartIndex: 0,
                lineHasJSX: false,
                version: lastVersionForFilePath[options.filePath],
            };
        },

        copyState(lineDescriptor: LineDescriptor): LineDescriptor {
            return {
                classificationMap: lineDescriptor.classificationMap,
                lineNumber: lineDescriptor.lineNumber,
                lineStartIndex: lineDescriptor.lineStartIndex,
                lineHasJSX: lineDescriptor.lineHasJSX,
                version: lineDescriptor.version
            }
        },

        blankLine(lineDescriptor: LineDescriptor) {
            lineDescriptor.lineNumber++;
            lineDescriptor.lineStartIndex++;
        },

        token(stream: CodeMirror.StringStream, lineDescriptor: LineDescriptor): string {
            if (stream.sol()) {

                let classifications = classifierCache.getClassificationsForLine(options.filePath, lineDescriptor.lineStartIndex, stream.string);
                let classificationInformation = getClassificationInformationForLine(classifications);

                // console.log('%c'+stream.string,"font-size: 20px");
                // console.table(classifications.map(c=> ({ str: c.string, cls: c.classificationTypeName,startInLine:c.startInLine })));

                // For faster tokenization done below
                lineDescriptor.classificationMap = classificationInformation.classificationMap;
                lineDescriptor.lineHasJSX = classificationInformation.lineHasJSX;

                // Update info for next call
                lineDescriptor.lineNumber++;
                lineDescriptor.lineStartIndex = lineDescriptor.lineStartIndex + stream.string.length + 1;
            }

            var classifiedSpan = lineDescriptor.classificationMap[stream.pos];
            // console.log(lineDescriptor.lineNumber, stream.pos,lineDescriptor.classificationMap);
            if (classifiedSpan) {
                var textBefore: string = stream.string.substr(0, stream.pos);
                stream.pos += classifiedSpan.string.length;
                var nextTenChars: string = stream.string.substr(stream.pos, 10);
                return getStyleForToken(classifiedSpan, textBefore, nextTenChars,lineDescriptor.lineHasJSX);
            } else {
                stream.skipToEnd();
            }

            return null;
        },

        indent(lineDescriptor: LineDescriptor, textAfter: string): number {
            let indentOptions: ts.EditorOptions = {
                IndentSize: options.indentUnit,
                TabSize: options.tabSize,
                NewLineCharacter: '\n',
                IndentStyle: ts.IndentStyle.Smart,
                ConvertTabsToSpaces: !options.indentWithTabs
            }
            let indent = classifierCache.getIndentationAtPosition(options.filePath, lineDescriptor.lineStartIndex, indentOptions);

            // if called for a } decrease the indent
            if (textAfter.trim() == '}') {
                indent -= options.indentUnit;
            }

            return indent;
        }
    }
}

import CodeMirror = require('codemirror');
export function register() {
    CodeMirror.defineMode('typescript', typeScriptModeFactory);
}
