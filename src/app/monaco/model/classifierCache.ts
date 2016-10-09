/**
 * The syntax classifier works on the bases of a *file* with sections of the file being queried for classification
 *
 * This file exists to cache the contents a file
 * and apply its edits (similar to our server fileModel) so that we can do classifications on particular lines
 *
 * Since the ts classifier works on a language service we have a *single* language service to hold all files
 */
import {TypedEvent} from "../../../common/events";
import * as lsh from "../../../languageServiceHost/languageServiceHost";

const languageServiceHost = new lsh.LanguageServiceHost(undefined);
const languageService = ts.createLanguageService(languageServiceHost);

/**
 * ts syntax highlighter doesn't handle bom correctly so fix that
 */
const BOM_CHAR_CODE = 65279;
const hasBom: { [filePath: string]: boolean } = Object.create(null);

export function addFile(filePath: string, contents: string) {
    hasBom[filePath] = contents.charCodeAt(0) === BOM_CHAR_CODE;
    languageServiceHost.addScript(filePath, contents);
}
export function removeFile(filePath: string){
    languageServiceHost.removeFile(filePath);
}
export function editFile(filePath: string, codeEdit: CodeEdit) {
    languageServiceHost.applyCodeEdit(filePath, codeEdit.from, codeEdit.to, codeEdit.newText);
}
export function setContents(filePath: string, contents: string) {
    hasBom[filePath] = contents.charCodeAt(0) === BOM_CHAR_CODE;
    languageServiceHost.setContents(filePath,contents);
}
export function getLineAndCharacterOfPosition(filePath: string, pos: number): EditorPosition {
    return languageServiceHost.getLineAndCharacterOfPosition(filePath, pos);
}
export function getPositionOfLineAndCharacter(filePath: string, line: number, ch: number): number {
    return languageServiceHost.getPositionOfLineAndCharacter(filePath, line, ch);
}

export function getClassificationsForLine(filePath: string, lineStart: number, string: string): ClassifiedSpan[] {

    const offsetForBom = hasBom[filePath] ? -1 : 0;

    // don't need this for monaco!
    /**
     * Protect against code mirror optimized rendering.
     * If string does not match expected line contents tokenize as whitespace till the precise call is made.
     */
    // const trueLineContents = languageService.getNonBoundSourceFile(filePath).text.substr(lineStart);
    // if (!trueLineContents.startsWith(string)){
    //     // console.log({ trueLineContents, string, filePath }); // DEBUG
    //     const cantDoIt = [{
    //         textSpan: {
    //             start:0,
    //             length: string.length
    //         },
    //         startInLine: 0,
    //         string,
    //         classificationType: ts.ClassificationType.whiteSpace,
    //         classificationTypeName: ClassificationTypeNames.whiteSpace,
    //     }];
    //     return cantDoIt;
    // }

    let lineLength = string.length;
    let encodedClassifications = languageService.getEncodedSyntacticClassifications(filePath, { start: lineStart, length: lineLength });
    let classifications: ClassifiedSpan[] = unencodeClassifications(encodedClassifications);

    /** for some reason we have dupes on first token sometimes. this helps remove them */
    let lastStartSet = false;
    let lastStart = 0;

    // Trim to the query region
    classifications = classifications
        .map((c, i) => {

            // Compensate each token for bom
            c.textSpan.start += offsetForBom;

            // completely outside the range on the left
            if ((c.textSpan.start + c.textSpan.length) <= lineStart) {
                return null;
            }

            // completely outside the range on the right
            if (c.textSpan.start > (lineStart + lineLength)) {
                return null;
            }

            // trim the left
            if (c.textSpan.start < lineStart) {
                c.textSpan.length = c.textSpan.start + c.textSpan.length - lineStart;
                c.textSpan.start = lineStart;
            }

            // trim the right
            if ((c.textSpan.start + c.textSpan.length) > (lineStart + lineLength)) {
                 c.textSpan.length = (lineStart + lineLength) - (c.textSpan.start);
            }

            // dedupe...first token only
            if (!lastStartSet) {
                lastStartSet = true;
                lastStart = c.textSpan.start;
            }
            else {
                if (c.textSpan.start == lastStart) {
                    return null;
                }
            }

            return c;
        })
        .filter(c=> !!c);

    // Add a string for easier debugging + startInLine for creating a 'map' of positions later on
    classifications.forEach((c: ClassifiedSpan) => {
        c.startInLine = c.textSpan.start - lineStart;
        c.string = string.substr(c.startInLine, c.textSpan.length)
    });

    return classifications;
}

export function getIndentationAtPosition(filePath: string, lineStart: number, options: ts.EditorOptions) {
    return languageService.getIndentationAtPosition(filePath, lineStart, options);
}

export function getFormattingEditsAfterKeystroke(filePath: string, position: number, key: string, options: ts.FormatCodeOptions) {
    return languageService.getFormattingEditsAfterKeystroke(filePath, position, key, options);
}

/**
  * Just a convinient wrapper around ts.ClassifiedSpan
  * that keeps the enum `classificationType` intact
  **/
export interface ClassifiedSpan {
    textSpan: ts.TextSpan;
    classificationType: ts.ClassificationType;
    classificationTypeName: string;

    // Stuff we load for debugging
    string?: string;
    startInLine?: number;
}

/**
 * ported from services.ts convertClassifications
 * encoding is [[start,lenght,type]......]
 * also added whitespace support
 */
function unencodeClassifications(classifications: ts.Classifications): ClassifiedSpan[] {
    let dense = classifications.spans;
    let result: ClassifiedSpan[] = [];
    let expectedStart = 0; // used for whitespace
    for (let i = 0, n = dense.length; i < n; i += 3) {
        if (dense[i] > expectedStart){
            result.push({
                textSpan: ts.createTextSpan(expectedStart,dense[i]-expectedStart),
                classificationType: ts.ClassificationType.whiteSpace,
                classificationTypeName: ts.ClassificationTypeNames.whiteSpace,
            });
        }
        result.push({
            textSpan: ts.createTextSpan(dense[i], dense[i + 1]),
            classificationType: dense[i + 2],
            classificationTypeName: getClassificationTypeName(dense[i + 2]),
        });
        expectedStart = dense[i] + dense[i + 1];
    }

    return result;
}

/** brought in as it is */
import ClassificationType = ts.ClassificationType;
let ClassificationTypeNames = ts.ClassificationTypeNames;
function getClassificationTypeName(type: ClassificationType) {
    switch (type) {
        case ClassificationType.comment: return ClassificationTypeNames.comment;
        case ClassificationType.identifier: return ClassificationTypeNames.identifier;
        case ClassificationType.keyword: return ClassificationTypeNames.keyword;
        case ClassificationType.numericLiteral: return ClassificationTypeNames.numericLiteral;
        case ClassificationType.operator: return ClassificationTypeNames.operator;
        case ClassificationType.stringLiteral: return ClassificationTypeNames.stringLiteral;
        case ClassificationType.whiteSpace: return ClassificationTypeNames.whiteSpace;
        case ClassificationType.text: return ClassificationTypeNames.text;
        case ClassificationType.punctuation: return ClassificationTypeNames.punctuation;
        case ClassificationType.className: return ClassificationTypeNames.className;
        case ClassificationType.enumName: return ClassificationTypeNames.enumName;
        case ClassificationType.interfaceName: return ClassificationTypeNames.interfaceName;
        case ClassificationType.moduleName: return ClassificationTypeNames.moduleName;
        case ClassificationType.typeParameterName: return ClassificationTypeNames.typeParameterName;
        case ClassificationType.typeAliasName: return ClassificationTypeNames.typeAliasName;
        case ClassificationType.parameterName: return ClassificationTypeNames.parameterName;
        case ClassificationType.docCommentTagName: return ClassificationTypeNames.docCommentTagName;
        case ClassificationType.jsxOpenTagName: return ClassificationTypeNames.jsxOpenTagName;
        case ClassificationType.jsxCloseTagName: return ClassificationTypeNames.jsxCloseTagName;
        case ClassificationType.jsxSelfClosingTagName: return ClassificationTypeNames.jsxSelfClosingTagName;
    }
}
