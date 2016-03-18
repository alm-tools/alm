import path = require('path');
import fs = require('fs');
import os = require('os');

export import languageServiceHost = require('./languageServiceHost');
import tsconfig = require('./tsconfig');
import {selectMany}  from "../../../../common/utils";

/**
 * Wraps up `langaugeService` `languageServiceHost` and `projectFile` in a single package
 */
export class Project {
    public languageServiceHost: languageServiceHost.LanguageServiceHost;
    public languageService: ts.LanguageService;

    constructor(public configFile: tsconfig.TypeScriptConfigFileDetails) {
        this.languageServiceHost = new languageServiceHost.LanguageServiceHost(configFile.project.compilerOptions);

        // Add all the files
        configFile.project.files.forEach((file) => {
            this.languageServiceHost.addScript(file);
        });

        this.languageService = ts.createLanguageService(this.languageServiceHost, ts.createDocumentRegistry());
    }

    /**
     * all files except lib.d.ts
     * Note: this function is exceedingly slow on cold boot (13s on vscode codebase) as it calls getProgram.getSourceFiles
     */
    public getProjectSourceFiles(): ts.SourceFile[] {
        var libFile = languageServiceHost.getDefaultLibFilePath(this.configFile.project.compilerOptions);
        var files
            = this.languageService.getProgram().getSourceFiles().filter(x=> x.fileName !== libFile);
        return files;
    }

    public includesSourceFile(filePath: string) {
        return (this.configFile.project.files.filter((f) => f === filePath).length === 1);
    }

    public getFilePaths(): string[]{
        return (this.configFile.project.files);
    }

    public getDiagnosticsForFile(filePath: string) {
        var diagnostics = this.languageService.getSyntacticDiagnostics(filePath);
        if (diagnostics.length === 0) {
            diagnostics = this.languageService.getSemanticDiagnostics(filePath);
        }
        return diagnostics;
    }

    public getDiagnostics() {
        const program = this.languageService.getProgram();

        return program.getGlobalDiagnostics()
            .concat(program.getSemanticDiagnostics())
            .concat(program.getSyntacticDiagnostics());
    }
}
