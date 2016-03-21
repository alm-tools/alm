import path = require('path');
import tsconfig = require('./tsconfig');
import {selectMany}  from "../../../../common/utils";

import {master} from "../projectServiceContract";
import * as lsh from "../../../../languageServiceHost/languageServiceHost";

/**
 * Wraps up `langaugeService` `languageServiceHost` and `projectFile` in a single package
 */
export class Project {
    public languageServiceHost: LanguageServiceHost;
    public languageService: ts.LanguageService;

    constructor(public configFile: tsconfig.TypeScriptConfigFileDetails) {
        this.languageServiceHost = new LanguageServiceHost(configFile.project.compilerOptions);

        const addFile = (filePath:string) => {
            var content = '';
            try {
                if (!content) {
                    var content = master.getOrCreateOpenFile(filePath).getContents();
                }
            }
            catch (ex) { // if we cannot read the file for whatever reason
                // TODO: in next version of TypeScript langauge service we would add it with "undefined"
                // For now its just an empty string
            }
            this.languageServiceHost.addScript(filePath, content);
        }

        // Add the `lib.d.ts`
        if (!configFile.project.compilerOptions.noLib) {
            addFile(getDefaultLibFilePath(configFile.project.compilerOptions));
        }

        // Add all the files
        configFile.project.files.forEach(addFile);

        this.languageService = ts.createLanguageService(this.languageServiceHost, ts.createDocumentRegistry());
    }

    /**
     * all files except lib.d.ts
     * Note: this function is exceedingly slow on cold boot (13s on vscode codebase) as it calls getProgram.getSourceFiles
     */
    public getProjectSourceFiles(): ts.SourceFile[] {
        var libFile = getDefaultLibFilePath(this.configFile.project.compilerOptions);
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

/**
 * Lib file handling
 */
export var getDefaultLibFilePath = (options: ts.CompilerOptions) => {
    var filename = ts.getDefaultLibFileName(options);
    return (path.join(path.dirname(require.resolve('ntypescript')), filename)).split('\\').join('/');
}
export var typescriptDirectory = path.dirname(require.resolve('ntypescript')).split('\\').join('/');

/**
 * Similar to the base, just adds stuff that uses `require.resolve` to load lib.d.ts
 */
export class LanguageServiceHost extends lsh.LanguageServiceHost {
    getDefaultLibFileName = ()=>getDefaultLibFilePath(this.compilerOptions);
}
