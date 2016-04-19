import path = require('path');
import tsconfig = require('./tsconfig');
import {selectMany}  from "../../../../common/utils";
import * as types from "../../../../common/types";
import * as typescriptDir from "./typeScriptDir";

import {master as masterType} from "../projectServiceContract";
let master: typeof masterType;
export function setMaster(m: typeof masterType) {
    master = m;
}

import * as lsh from "../../../../languageServiceHost/languageServiceHost";

/**
 * Wraps up `langaugeService` `languageServiceHost` and `projectFile` in a single package
 */
export class Project {
    public languageServiceHost: LanguageServiceHost;
    public languageService: ts.LanguageService;
    public configFile: types.TypeScriptConfigFileDetails;

    init(_configFile: types.TypeScriptConfigFileDetails) {
        this.configFile = _configFile;
        let initialized = Promise.resolve();

        this.languageServiceHost = new LanguageServiceHost(_configFile.project.compilerOptions);
        const addFile = (filePath:string) => {
            return master
                .getFileContents({filePath})
                .then((res)=>{
                    this.languageServiceHost.addScript(filePath, res.contents);
                });
        }

        // Add the `lib.d.ts`
        if (!_configFile.project.compilerOptions.noLib) {
            initialized = addFile(typescriptDir.getDefaultLibFilePath(_configFile.project.compilerOptions));
        }

        // Add all the files
        //
        // chained as parent asks us to create a project
        //  ->  and then we start asking parent for files.
        //  Something aweful happens if all this is tailing off the "create project" request from the parent
        _configFile.project.files.forEach((filePath) => initialized = initialized.then(() => addFile(filePath)));
        initialized.then(()=>this.languageService = ts.createLanguageService(this.languageServiceHost, ts.createDocumentRegistry()));
        return initialized;
    }

    /**
     * all files except lib.d.ts
     * Note: this function is exceedingly slow on cold boot (13s on vscode codebase) as it calls getProgram.getSourceFiles
     */
    public getProjectSourceFiles(): ts.SourceFile[] {
        var libFile = typescriptDir.getDefaultLibFilePath(this.configFile.project.compilerOptions);
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
 * Similar to the base, just adds stuff that uses `require.resolve` to load lib.d.ts
 */
export class LanguageServiceHost extends lsh.LanguageServiceHost {
    getDefaultLibFileName = ()=> typescriptDir.getDefaultLibFilePath(this.compilerOptions);
}
