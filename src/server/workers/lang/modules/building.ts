import project = require('../core/project');
import mkdirp = require('mkdirp');
import path = require('path');
import fs = require('fs');
import {makeAbsoluteIfNeeded} from "../../../disk/workingDir";
import {consistentPath} from "../../../utils/fsu";
import {createMap} from "../../../../common/utils";

export function diagnosticToCodeError(diagnostic: ts.Diagnostic): CodeError {

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
        filePath,
        from: { line: startPosition.line, ch: startPosition.character },
        to: { line: endPosition.line, ch: endPosition.character },
        message: ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
        preview,
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


type EmitOuputWithInputFile = (ts.EmitOutput & { inputFilePath: string });

/**
 * Taken from services.ts and modified to not take a filePath
 * see discussion : https://gitter.im/Microsoft/TypeScript?at=570742b8c65c9a6f7f27c94c
 */
export function getWholeProgramRawOutput(proj: project.Project): EmitOuputWithInputFile[] {
    const services = proj.languageService;
    const program = services.getProgram();
    const result: EmitOuputWithInputFile[] = program.getSourceFiles().map(sourceFile => {
        // The following is pretty much a verbatim copy paste of services.ts `getEmitOuput`
        const outputFiles: ts.OutputFile[] = [];
        function writeFile(fileName: string, data: string, writeByteOrderMark: boolean) {
            outputFiles.push({
                name: fileName,
                writeByteOrderMark: writeByteOrderMark,
                text: data
            });
        }

        const emitOutput = program.emit(sourceFile, writeFile);
        return {
            inputFilePath: sourceFile.fileName,
            outputFiles,
            emitSkipped: emitOutput.emitSkipped
        };
    });
    return result;
}
