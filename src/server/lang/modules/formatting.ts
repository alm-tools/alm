import project = require('../core/project');
import * as types from "../../../common/types";

export function formatDocument(proj: project.Project, filePath: string): types.RefactoringsByFilePath {
    var textChanges = proj.languageService.getFormattingEditsForDocument(filePath, proj.configFile.project.formatCodeOptions);

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
export function formatDocumentRange(proj: project.Project, filePath: string, start: EditorPosition, end: EditorPosition): types.RefactoringsByFilePath {
    var st = proj.languageServiceHost.getIndexFromPosition(filePath, start);
    var ed = proj.languageServiceHost.getIndexFromPosition(filePath, end);
    var textChanges = proj.languageService.getFormattingEditsForRange(filePath, st, ed, proj.configFile.project.formatCodeOptions);

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
