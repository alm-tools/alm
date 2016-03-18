import project = require('../core/project');
import * as types from "../../../../common/types";

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
    var st = proj.languageServiceHost.getPositionOfLineAndCharacter(filePath, start.line, start.ch);
    var ed = proj.languageServiceHost.getPositionOfLineAndCharacter(filePath, end.line, end.ch);
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
