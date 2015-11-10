/**
 * The syntax classifier works on the bases of a *file* with sections of the file being queried for classification
 *
 * This file exists to cache the contents a file
 * and apply its edits (similar to our server fileModel) so that we can do classifications on particular lines
 *
 * Since the ts classifier works on a language service we have a *single* language service to hold all files
 *
 *
 * How we apply the updates is a bit tricky.
 * - We want to do this *before* CM asks for classifications
 * - but we also need to accomodate for two tabs having the same file open and thus sending the same edits :-/
 * - * We definitely need to look into a single codemirror shared doc, with a single history, single edit stream, single text :)
 *
 */
import {TypedEvent} from "../../../common/events";
import ts = require('ntypescript');
import * as lsh from "../server/languageServiceHost";

const languageServiceHost = new lsh.LSHost();
const languageService = ts.createLanguageService(languageServiceHost);

export function addFile(filePath: string, contents: string) {
    languageServiceHost.addScript(filePath, contents);
}
export function editFile(filePath: string, codeEdit: CodeEdit) {
    let from = languageServiceHost.getPositionOfLineAndCharacter(filePath, codeEdit.from.line, codeEdit.from.ch);
    let to = languageServiceHost.getPositionOfLineAndCharacter(filePath, codeEdit.to.line, codeEdit.to.ch);
    languageServiceHost.editScript(filePath, from, to, codeEdit.newText);
}
export function getClassificationsForLine(filePath: string, lineStart: number, string: string): ClassifiedSpan[] {
    let lineLength = string.length;
    let classifications: ClassifiedSpan[] = languageService.getSyntacticClassifications(filePath, { start: lineStart, length: lineLength });

    // Trim to the query region
    classifications = classifications
        .map(c=> {
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

            return c;
        })
        .filter(c=> !!c);

    // Add a string for easier debugging
    classifications.forEach(c => {
        c.startInLine = c.textSpan.start - lineStart;
        c.string = string.substr(c.startInLine, c.textSpan.length)
    });


    return classifications;
}

/** Just a convinient wrapper around ts.ClassifiedSpan */
export interface ClassifiedSpan extends ts.ClassifiedSpan {
    string?: string;
    startInLine?: number;
}
