import path = require('path');
import fs = require('fs');
import os = require('os');

export import languageServiceHost = require('./languageServiceHost');
import tsconfig = require('./tsconfig');

/**
 * Wraps up `langaugeService` `languageServiceHost` and `projectFile` in a single package
 */
export class Project {
    public languageServiceHost: languageServiceHost.LanguageServiceHost;
    public languageService: ts.LanguageService;

    constructor(public configFile: tsconfig.TypeScriptConfigFileDetails) {
        this.languageServiceHost = new languageServiceHost.LanguageServiceHost(configFile);

        // Add all the files
        configFile.project.files.forEach((file) => {
            this.languageServiceHost.addScript(file);
        });

        this.languageService = ts.createLanguageService(this.languageServiceHost, ts.createDocumentRegistry());
    }

    /** all files except lib.d.ts  */
    public getProjectSourceFiles(): ts.SourceFile[] {
        var libFile = languageServiceHost.getDefaultLibFilePath(this.configFile.project.compilerOptions);
        var files
            = this.languageService.getProgram().getSourceFiles().filter(x=> x.fileName !== libFile);
        return files;
    }

    public includesSourceFile(filePath: string) {
        return (this.getProjectSourceFiles().filter((f) => f.fileName === filePath).length === 1);
    }
}
