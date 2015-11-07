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
import * as lsh from "./languageServiceHost";

const languageServiceHost = lsh.createLanguageServiceHost();
const languageService = ts.createLanguageService(languageServiceHost);

export function addFile(filePath: string, contents: string) {
    languageServiceHost.addScript(filePath, contents);
}
export function editFile(filePath: string, codeEdit: CodeEdit) {
    let sourceFile = languageService.getSourceFile(filePath);
    let from = sourceFile.getPositionOfLineAndCharacter(codeEdit.from.line, codeEdit.from.ch);
    let to = sourceFile.getPositionOfLineAndCharacter(codeEdit.to.line, codeEdit.to.ch);
    languageServiceHost.editScript(filePath, from, to, codeEdit.newText);
}
export function getClassificationsForLine(filePath:string, lineStart: number, lineLength: number){
    let classifications = languageService.getSyntacticClassifications(filePath, { start: lineStart, length: lineLength });
}
