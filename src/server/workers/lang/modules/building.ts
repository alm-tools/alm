import project = require('../core/project');
import mkdirp = require('mkdirp');
import path = require('path');
import fs = require('fs');
import {makeAbsoluteIfNeeded} from "../../../disk/workingDir";
import {consistentPath} from "../../../utils/fsu";
import { createMap } from "../../../../common/utils";
import * as types from '../../../../common/types';

export function diagnosticToCodeError(diagnostic: ts.Diagnostic): types.CodeError {

    let preview = '';
    let filePath = '';
    let startPosition = { line: 0, character: 0 };
    let endPosition = { line: 0, character: 0 };

    if (diagnostic.file) {
        filePath = diagnostic.file.fileName;
        startPosition = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
        endPosition = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start + diagnostic.length);
        preview = diagnostic.file.text.substr(diagnostic.start, diagnostic.length)
    }

    return {
        source: 'projectService',
        filePath,
        from: { line: startPosition.line, ch: startPosition.character },
        to: { line: endPosition.line, ch: endPosition.character },
        message: ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
        preview,
        level: 'error'
    };
}

/**
 * Raw signifies the fact that the output is not being written anywhere
 * WARNING: only call if proj contains the filePath
 */
export function getRawJsOutput(proj: project.Project, filePath: string): {
    filePath: string,
    contents: string,
} | undefined {
    let services = proj.languageService;

    let output: ts.EmitOutput = services.getEmitOutput(filePath);

    /** We only care about the js output */
    const jsFile = output.outputFiles.filter(x => x.name.endsWith(".js"))[0];
    if (!jsFile) return;

    return {
        filePath: jsFile.name,
        contents: jsFile.text
    }
}
