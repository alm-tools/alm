import project = require('./core/project');
import mkdirp = require('mkdirp');
import path = require('path');
import fs = require('fs');
import {makeAbsoluteIfNeeded} from "../../disk/workingDir";
import {consistentPath} from "../../utils/fsu";
import {createMap} from "../../../common/utils";

export function diagnosticToCodeError(diagnostic: ts.Diagnostic): CodeError {
    var filePath = diagnostic.file.fileName;
    var startPosition = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
    var endPosition = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start + diagnostic.length);

    return {
        filePath: filePath,
        from: { line: startPosition.line, ch: startPosition.character },
        to: { line: endPosition.line, ch: endPosition.character },
        message: ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
        preview: diagnostic.file.text.substr(diagnostic.start, diagnostic.length),
    };
}

/**
 * Raw signifies the fact that the output is not being written anywhere
 * WARNING: only call if proj contains the filePath
 */
export function getRawOutput(proj: project.Project, filePath: string): ts.EmitOutput {
    let services = proj.languageService;
    let output: ts.EmitOutput = services.getEmitOutput(filePath);
    return output;
}
