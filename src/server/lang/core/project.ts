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

    constructor(public projectFile: tsconfig.TypeScriptConfigFileDetails) {
        this.languageServiceHost = new languageServiceHost.LanguageServiceHost(projectFile);

        // Add all the files
        projectFile.project.files.forEach((file) => {
            this.languageServiceHost.addScript(file);
        });


        this.languageService = ts.createLanguageService(this.languageServiceHost, ts.createDocumentRegistry());
    }

    /** all files except lib.d.ts  */
    public getProjectSourceFiles(): ts.SourceFile[] {
        var libFile = languageServiceHost.getDefaultLibFilePath(this.projectFile.project.compilerOptions);
        var files
            = this.languageService.getProgram().getSourceFiles().filter(x=> x.fileName !== libFile);
        return files;
    }

    public includesSourceFile(fileName: string) {
        return (this.getProjectSourceFiles().filter((f) => f.fileName === fileName).length === 1);
    }
}
