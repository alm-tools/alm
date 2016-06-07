import project = require('../core/project');
import * as types from "../../../../common/types";
import {extend} from "../../../../common/utils";

/**
 * Merges editorconfig style options with TypeScript's formatCodeOptions
 */
function completeFormatCodeOptions(options: types.EditorOptions, formatCodeOptions: ts.FormatCodeOptions): ts.FormatCodeOptions {
    const copy = extend(formatCodeOptions);
    copy.IndentSize = options.tabSize;
    copy.TabSize = options.tabSize;
    copy.NewLineCharacter = options.newLineCharacter;
    copy.ConvertTabsToSpaces = options.convertTabsToSpaces;
    return copy;
}

export function formatDocument(proj: project.Project, filePath: string, editorOptions: types.EditorOptions): types.RefactoringsByFilePath {
    const formatCodeOptions = completeFormatCodeOptions(editorOptions, proj.configFile.project.formatCodeOptions)
    var textChanges = proj.languageService.getFormattingEditsForDocument(filePath, formatCodeOptions);

    let refactorings:types.Refactoring[] = textChanges.map(x=>{
        let refactoring: types.Refactoring = {
            filePath,
            span: x.span,
            newText: x.newText
        }
        return refactoring;
    });

    return types.getRefactoringsByFilePath(refactorings);
}
export function formatDocumentRange(proj: project.Project, filePath: string, start: EditorPosition, end: EditorPosition, editorOptions: types.EditorOptions): types.RefactoringsByFilePath {
    const formatCodeOptions = completeFormatCodeOptions(editorOptions, proj.configFile.project.formatCodeOptions);
    var st = proj.languageServiceHost.getPositionOfLineAndCharacter(filePath, start.line, start.ch);
    var ed = proj.languageServiceHost.getPositionOfLineAndCharacter(filePath, end.line, end.ch);
    var textChanges = proj.languageService.getFormattingEditsForRange(filePath, st, ed, formatCodeOptions);

    let refactorings:types.Refactoring[] = textChanges.map(x=>{
        let refactoring: types.Refactoring = {
            filePath,
            span: x.span,
            newText: x.newText
        }
        return refactoring;
    });

    return types.getRefactoringsByFilePath(refactorings);
}
