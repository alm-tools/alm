import path = require('path');
import tsconfig = require('./tsconfig');
import {selectMany,createMap}  from "../../../../common/utils";
import * as types from "../../../../common/types";
import * as typescriptDir from "./typeScriptDir";
import * as utils from "../../../../common/utils";

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

    constructor(projectData: types.ProjectDataLoaded) {
        this.configFile = projectData.configFile;

        this.languageServiceHost = new LanguageServiceHost(projectData.configFile.projectFilePath, projectData.configFile.project.compilerOptions);

        // Add all the files
        projectData.filePathWithContents.forEach(({filePath,contents}) => {
            this.languageServiceHost.addScript(filePath, contents);
        });

        this.languageServiceHost.incrementallyAddedFile.on((data)=>{
            // console.log(data); // DEBUG
            master.receiveIncrementallyAddedFile(data)
        });

        this.languageService = ts.createLanguageService(this.languageServiceHost, ts.createDocumentRegistry());
    }


    public getAllSourceFiles(): ts.SourceFile[] {
        return this.languageService.getProgram().getSourceFiles();
    }

    /**
     * all files
     * - except lib.d.ts
     * - And files in `node_modules
     * Note: this function is exceedingly slow on cold boot (13s on vscode codebase) as it calls getProgram.getSourceFiles
     */
    public getProjectSourceFiles(): ts.SourceFile[] {
        var libFileLookup = createMap(typescriptDir.getDefaultLibFilePaths(this.configFile.project.compilerOptions));
        var files
            = this.getAllSourceFiles().filter(x=> !libFileLookup[x.fileName]);
        return files;
    }

    public getSourceFile(filePath: string): ts.SourceFile | undefined {
        return this.getAllSourceFiles().find(f => f.fileName === filePath);
    }

    public includesSourceFile(filePath: string) {
        return (this.getAllSourceFiles().filter((f) => f.fileName === filePath).length === 1);
    }

    /**
     * Gets all the files in the project that are not `.json` files
     */
    public getFilePaths(): string[]{
        return (this.configFile.project.files).filter(f=>!f.endsWith('.json'));
    }

    public getDiagnosticsForFile(filePath: string) {
        var diagnostics = this.languageService.getSyntacticDiagnostics(filePath);
        if (diagnostics.length === 0) {
            if (this.configFile.project.compilerOptions.skipLibCheck && filePath.endsWith('.d.ts')) {
                // Nothing to do
            }
            else {
                diagnostics = this.languageService.getSemanticDiagnostics(filePath);
            }
        }
        return diagnostics;
    }

    public getDiagnostics(cancellationToken: utils.CancellationToken): Promise<ts.Diagnostic[]> {
        const program = this.languageService.getProgram();
        return new Promise<ts.Diagnostic[]>((resolve, reject) => {
            let allDiagnostics: ts.Diagnostic[] = [];
            allDiagnostics = program.getGlobalDiagnostics();

            const sourceFiles = program.getSourceFiles();

            utils
                .cancellableForEach({
                    cancellationToken,
                    items: sourceFiles,
                    cb: (sourceFile) => {
                        ts.addRange(allDiagnostics, program.getSyntacticDiagnostics(sourceFile));
                    },
                })
                .then(() => {
                    return utils.cancellableForEach({
                        cancellationToken,
                        items: sourceFiles,
                        cb: (sourceFile) => {
                            if (this.configFile.project.compilerOptions.skipLibCheck && sourceFile.isDeclarationFile) {
                                // Nothing to do
                            }
                            else {
                                ts.addRange(allDiagnostics, program.getSemanticDiagnostics(sourceFile));
                            }
                        },
                    });
                })
                .then(() => {
                    allDiagnostics = ts.sortAndDeduplicateDiagnostics(allDiagnostics);
                    resolve(allDiagnostics);
                })
                .catch((res) => {
                    reject(res);
                });
        });
    }
}

/**
 * Similar to the base, just adds stuff that uses `require.resolve` to load lib.d.ts
 */
export class LanguageServiceHost extends lsh.LanguageServiceHost {
    getDefaultLibFileName = () => typescriptDir.getDefaultLibFilePaths(this.compilerOptions)[0];
}
