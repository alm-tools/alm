import * as fmc from "../../../disk/fileModelCache";
import * as fsu from "../../../utils/fsu";
import fs = require('fs');
import ts = require('ntypescript');
import * as json from "../../../../common/json";
import {makeBlandError,reverseKeysAndValues, uniq, extend} from "../../../../common/utils";
import {PackageJsonParsed, TsconfigJsonParsed, TypeScriptConfigFileDetails} from "../../../../common/types";
import {increaseCompilationContext, getDefinitionsForNodeModules} from "./compilationContextExpander";

import simpleValidator = require('./simpleValidator');
var types = simpleValidator.types;

// Most compiler options come from require('typescript').CompilerOptions, but
// 'module' and 'target' cannot use the same enum as that interface since we
// do not want to force users to put magic numbers in their tsconfig files
// NOTE: see the changes in `commandLineParser.ts` in the TypeScript sources to see what needs updating
/**
 * When adding you need to
 *  0 Add in this interface
 * 	1 Add to the validation
 * 	2 If its an enum : Update `typescriptEnumMap`
 * 	3 If its a path : Update the `make relative` code
 */
interface CompilerOptions {
    allowNonTsExtensions?: boolean;
    allowSyntheticDefaultImports?: boolean;
    allowUnreachableCode?: boolean;
    allowUnusedLabels?: boolean;
    charset?: string;
    codepage?: number;
    declaration?: boolean;
    diagnostics?: boolean;
    emitBOM?: boolean;
    experimentalAsyncFunctions?: boolean;
    experimentalDecorators?: boolean;                 // Experimental. Needed for the next option `emitDecoratorMetadata` see : https://github.com/Microsoft/TypeScript/pull/3330
    emitDecoratorMetadata?: boolean;                  // Experimental. Emits addition type information for this reflection API https://github.com/rbuckton/ReflectDecorators
    help?: boolean;
    isolatedModules?: boolean;
    inlineSourceMap?: boolean;
    inlineSources?: boolean;
    jsx?: string;
    locale?: string;
    listFiles?: boolean;
    mapRoot?: string;                                 // Optionally Specifies the location where debugger should locate map files after deployment
    module?: string;
    moduleResolution?: string;
    newLine?: string;
    noEmit?: boolean;
    noEmitHelpers?: boolean;
    noEmitOnError?: boolean;
    noErrorTruncation?: boolean;
    noFallthroughCasesInSwitch?: boolean;
    noImplicitAny?: boolean;                          // Error on inferred `any` type
    noImplicitReturns?: boolean;
    noLib?: boolean;
    noLibCheck?: boolean;
    noResolve?: boolean;
    out?: string;
    outFile?: string;                                 // new name for out
    outDir?: string;                                  // Redirect output structure to this directory
    preserveConstEnums?: boolean;
    removeComments?: boolean;                         // Do not emit comments in output
    rootDir?: string;
    sourceMap?: boolean;                              // Generates SourceMaps (.map files)
    sourceRoot?: string;                              // Optionally specifies the location where debugger should locate TypeScript source files after deployment
    stripInternal?: boolean;
    suppressExcessPropertyErrors?: boolean;           // Optionally disable strict object literal assignment checking
    suppressImplicitAnyIndexErrors?: boolean;
    target?: string;                                  // 'es3'|'es5' (default)|'es6'
    version?: boolean;
    watch?: boolean;
}

var compilerOptionsValidation: simpleValidator.ValidationInfo = {
    allowNonTsExtensions: { type: types.boolean },
    allowSyntheticDefaultImports: { type: types.boolean },
    allowUnreachableCode: { type: types.boolean },
    allowUnusedLabels: { type: types.boolean },
    charset: { type: types.string },
    codepage: { type: types.number },
    declaration: { type: types.boolean },
    diagnostics: { type: types.boolean },
    emitBOM: { type: types.boolean },
    experimentalAsyncFunctions: { type: types.boolean },
    experimentalDecorators: { type: types.boolean },
    emitDecoratorMetadata: { type: types.boolean },
    help: { type: types.boolean },
    inlineSourceMap: { type: types.boolean },
    inlineSources: { type: types.boolean },
    isolatedModules: { type: types.boolean },
    jsx: { type: types.string, validValues: ['preserve', 'react'] },
    locals: { type: types.string },
    listFiles: { type: types.boolean },
    mapRoot: { type: types.string },
    module: { type: types.string, validValues: ['commonjs', 'amd', 'system', 'umd', 'es6', 'es2015'] },
    moduleResolution: { type: types.string, validValues: ['classic', 'node'] },
    newLine: { type: types.string },
    noEmit: { type: types.boolean },
    noEmitHelpers: { type: types.boolean },
    noEmitOnError: { type: types.boolean },
    noErrorTruncation: { type: types.boolean },
    noFallthroughCasesInSwitch: { type: types.boolean },
    noImplicitAny: { type: types.boolean },
    noImplicitReturns: { type: types.boolean },
    noLib: { type: types.boolean },
    noLibCheck: { type: types.boolean },
    noResolve: { type: types.boolean },
    out: { type: types.string },
    outFile: { type: types.string },
    outDir: { type: types.string },
    preserveConstEnums: { type: types.boolean },
    removeComments: { type: types.boolean },
    rootDir: { type: types.string },
    sourceMap: { type: types.boolean },
    sourceRoot: { type: types.string },
    stripInternal: { type: types.boolean },
    suppressExcessPropertyErrors: { type: types.boolean },
    suppressImplicitAnyIndexErrors: { type: types.boolean },
    target: { type: types.string, validValues: ['es3', 'es5', 'es6'] },
    version: { type: types.boolean },
    watch: { type: types.boolean },
}
var validator = new simpleValidator.SimpleValidator(compilerOptionsValidation);


/**
 * This is the JSON.parse result of a tsconfig.json
 */
interface TypeScriptProjectRawSpecification {
    compilerOptions?: CompilerOptions;
    exclude?: string[];                                 // optional: An array of 'glob / minimatch / RegExp' patterns to specify directories / files to exclude
    files?: string[];                                   // optional: paths to files
    filesGlob?: string[];                               // optional: An array of 'glob / minimatch / RegExp' patterns to specify source files
    formatCodeOptions?: formatting.FormatCodeOptions;   // optional: formatting options
    compileOnSave?: boolean;                            // optional: compile on save. Ignored to build tools. Used by IDEs
    buildOnSave?: boolean;
}

//////////////////////////////////////////////////////////////////////

export var errors = {
    GET_PROJECT_INVALID_PATH: 'The path used to query for tsconfig.json does not exist',
    GET_PROJECT_NO_PROJECT_FOUND: 'No Project Found',
    GET_PROJECT_FAILED_TO_OPEN_PROJECT_FILE: 'Failed to fs.readFileSync the project file',
    GET_PROJECT_JSON_PARSE_FAILED: 'Failed to JSON.parse the project file',
    GET_PROJECT_GLOB_EXPAND_FAILED: 'Failed to expand filesGlob in the project file',
    GET_PROJECT_PROJECT_FILE_INVALID_OPTIONS: 'Project file contains invalid options',

    CREATE_FILE_MUST_EXIST: 'The Typescript file must exist on disk in order to create a project',
    CREATE_PROJECT_ALREADY_EXISTS: 'Project file already exists',
};
export interface ProjectFileErrorDetails {
    projectFilePath: string;
    error: CodeError;
}

function errorWithDetails(error: Error, details: ProjectFileErrorDetails): Error {
    error.details = details;
    return error;
}

import path = require('path');
import expand = require('glob-expand');
import os = require('os');
import formatting = require('./formatCodeOptions');

var projectFileName = 'tsconfig.json';
/**
 * This is what we use when the user doens't specify a files / filesGlob
 */
var invisibleFilesGlob = ["./**/*.ts", "./**/*.tsx"];

export const defaults: ts.CompilerOptions = {
    target: ts.ScriptTarget.ES5,
    module: ts.ModuleKind.CommonJS,
    moduleResolution: ts.ModuleResolutionKind.NodeJs,
    isolatedModules: false,
    jsx: ts.JsxEmit.React,
    experimentalDecorators: true,
    emitDecoratorMetadata: true,
    declaration: false,
    noImplicitAny: false,
    removeComments: true,
    noLib: false,
    preserveConstEnums: true,
    suppressImplicitAnyIndexErrors: true
};

var typescriptEnumMap = {
    target: {
        'es3': ts.ScriptTarget.ES3,
        'es5': ts.ScriptTarget.ES5,
        'es6': ts.ScriptTarget.ES6,
        'latest': ts.ScriptTarget.Latest
    },
    module: {
        'none': ts.ModuleKind.None,
        'commonjs': ts.ModuleKind.CommonJS,
        'amd': ts.ModuleKind.AMD,
        'umd': ts.ModuleKind.UMD,
        'system': ts.ModuleKind.System,
        'es6': ts.ModuleKind.ES6,
        'es2015': ts.ModuleKind.ES2015,
    },
    moduleResolution: {
        'node': ts.ModuleResolutionKind.NodeJs,
        'classic': ts.ModuleResolutionKind.Classic
    },
    jsx: {
        'preserve': ts.JsxEmit.Preserve,
        'react': ts.JsxEmit.React
    },
    newLine: {
        'CRLF': ts.NewLineKind.CarriageReturnLineFeed,
        'LF': ts.NewLineKind.LineFeed
    }
};

var jsonEnumMap: any = {};
Object.keys(typescriptEnumMap).forEach(name => {
    jsonEnumMap[name] = reverseKeysAndValues(typescriptEnumMap[name]);
});

function rawToTsCompilerOptions(jsonOptions: CompilerOptions, projectDir: string): ts.CompilerOptions {
    // Cannot use Object.create because the compiler checks hasOwnProperty
    const compilerOptions = extend(defaults);
    for (var key in jsonOptions) {
        if (typescriptEnumMap[key]) {
            let name = jsonOptions[key];
            let map = typescriptEnumMap[key];
            compilerOptions[key] = map[name.toLowerCase()] || map[name.toUpperCase()];
        }
        else {
            compilerOptions[key] = jsonOptions[key];
        }
    }

    if (compilerOptions.outDir !== undefined) {
        compilerOptions.outDir = path.resolve(projectDir, compilerOptions.outDir);
    }

    if (compilerOptions.rootDir !== undefined) {
        compilerOptions.rootDir = path.resolve(projectDir, compilerOptions.rootDir);
    }

    if (compilerOptions.out !== undefined) {
        compilerOptions.out = path.resolve(projectDir, compilerOptions.out);
    }

    if (compilerOptions.outFile !== undefined) {
        // Till out is removed. Support outFile by just copying it to `out`
        compilerOptions.out = path.resolve(projectDir, compilerOptions.outFile);
    }

    // The default for moduleResolution as implemented by the compiler
    if (!jsonOptions.moduleResolution && compilerOptions.module !== ts.ModuleKind.CommonJS) {
        compilerOptions.moduleResolution = ts.ModuleResolutionKind.Classic;
    }

    return compilerOptions;
}

function tsToRawCompilerOptions(compilerOptions: ts.CompilerOptions): CompilerOptions {
    // Cannot use Object.create because JSON.stringify will only serialize own properties
    const jsonOptions = extend({}, compilerOptions);

    Object.keys(compilerOptions).forEach((key) => {
        if (jsonEnumMap[key] && compilerOptions[key]) {
            var value = <string>compilerOptions[key];
            jsonOptions[key] = jsonEnumMap[key][value];
        }
    });

    return jsonOptions;
}

export function getDefaultInMemoryProject(srcFile: string): TypeScriptConfigFileDetails {
    var dir = fs.lstatSync(srcFile).isDirectory() ? srcFile : path.dirname(srcFile);

    var files = [srcFile];
    var typings = getDefinitionsForNodeModules(dir, files);
    files = increaseCompilationContext(files);
    files = uniq(files.map(fsu.consistentPath));

    let project: TsconfigJsonParsed = {
        compilerOptions: defaults,
        files,
        typings: typings.ours.concat(typings.implicit),
        formatCodeOptions: formatting.defaultFormatCodeOptions(),
        compileOnSave: true,
        buildOnSave: false,
    };

    return {
        projectFileDirectory: dir,
        projectFilePath: dir + '/' + projectFileName,
        project: project,
        inMemory: true
    };
}

/** Given an src (source file or directory) goes up the directory tree to find the project specifications.
 * Use this to bootstrap the UI for what project the user might want to work on.
 * Note: Definition files (.d.ts) are considered thier own project
 */
export function getProjectSync(pathOrSrcFile: string): TypeScriptConfigFileDetails {

    if (!fsu.existsSync(pathOrSrcFile)) {
        throw new Error(errors.GET_PROJECT_INVALID_PATH);
    }

    // Get the path directory
    var dir = fs.lstatSync(pathOrSrcFile).isDirectory() ? pathOrSrcFile : path.dirname(pathOrSrcFile);

    // Keep going up till we find the project file
    var projectFile = '';
    try {
        projectFile = fsu.travelUpTheDirectoryTreeTillYouFind(dir, projectFileName);
    }
    catch (e) {
        let err: Error = e;
        if (err.message == "not found") {
            let bland = makeBlandError(fsu.consistentPath(pathOrSrcFile),err.message);
            throw errorWithDetails(
                new Error(errors.GET_PROJECT_NO_PROJECT_FOUND), { projectFilePath: fsu.consistentPath(pathOrSrcFile), error: bland });
        }
    }
    projectFile = path.normalize(projectFile);
    var projectFileDirectory = path.dirname(projectFile);
    let projectFilePath = fsu.consistentPath(projectFile);

    // We now have a valid projectFile. Parse it:
    var projectSpec: TypeScriptProjectRawSpecification;
    try {
        var projectFileTextContent = fmc.getOrCreateOpenFile(projectFile).getContents();
    } catch (ex) {
        throw new Error(errors.GET_PROJECT_FAILED_TO_OPEN_PROJECT_FILE);
    }
    let res = json.parse(projectFileTextContent);
    if (res.data) {
        projectSpec = res.data;
    }
    else {
        throw errorWithDetails(
            new Error(errors.GET_PROJECT_JSON_PARSE_FAILED), { projectFilePath, error: json.parseErrorToCodeError(projectFilePath,res.error)});
    }

    // Setup default project options
    if (!projectSpec.compilerOptions) projectSpec.compilerOptions = {};

    // Our customizations for "tsconfig.json"
    // Use grunt.file.expand type of logic
    var cwdPath = path.relative(process.cwd(), path.dirname(projectFile));
    if (!projectSpec.files && !projectSpec.filesGlob) { // If there is no files and no filesGlob, we create an invisible one.
        var toExpand = invisibleFilesGlob;
    }
    if (projectSpec.filesGlob) { // If there is a files glob we will use that
        var toExpand = projectSpec.filesGlob;
    }
    if (projectSpec.exclude) { // If there is an exclude we will use that
        toExpand = toExpand.concat(projectSpec.exclude.map(x=>`!./${x}`)) // as it is (for files)
        toExpand = toExpand.concat(projectSpec.exclude.map(x=>`!./${x}/**`)) // any sub directories (for dirs)
    }
    if (toExpand) { // Expand whatever needs expanding
        try {
            projectSpec.files = expand({ filter: 'isFile', cwd: cwdPath }, toExpand);
        }
        catch (ex) {
            throw errorWithDetails(
                new Error(errors.GET_PROJECT_GLOB_EXPAND_FAILED),
                { projectFilePath , error: makeBlandError(projectFilePath,ex.message)});
        }
    }

    // Remove all relativeness
    projectSpec.files = projectSpec.files.map((file) => path.resolve(projectFileDirectory, file));

    var pkg: PackageJsonParsed = null;
    try {
        const packageJSONPath = fsu.travelUpTheDirectoryTreeTillYouFind(projectFileDirectory, 'package.json');
        if (packageJSONPath) {
            const parsedPackage = JSON.parse(fmc.getOrCreateOpenFile(packageJSONPath).getContents());
            pkg = {
                main: parsedPackage.main,
                name: parsedPackage.name,
                directory: path.dirname(packageJSONPath),
                definition: parsedPackage.typescript && parsedPackage.typescript.definition
            };
        }
    }
    catch (ex) {
        // console.error('no package.json found', projectFileDirectory, ex.message);
    }

    var project: TsconfigJsonParsed = {
        compilerOptions: {},
        files: projectSpec.files.map(x => path.resolve(projectFileDirectory, x)),
        filesGlob: projectSpec.filesGlob,
        formatCodeOptions: formatting.makeFormatCodeOptions(projectSpec.formatCodeOptions),
        compileOnSave: projectSpec.compileOnSave == undefined ? true : projectSpec.compileOnSave,
        package: pkg,
        typings: [],
        buildOnSave: !!projectSpec.buildOnSave,
    };

    // Validate the raw compiler options before converting them to TS compiler options
    var validationResult = validator.validate(projectSpec.compilerOptions);
    if (validationResult.errorMessage) {
        throw errorWithDetails(
            new Error(errors.GET_PROJECT_PROJECT_FILE_INVALID_OPTIONS),
            { projectFilePath, error: makeBlandError(projectFilePath, validationResult.errorMessage) }
        );
    }

    // Convert the raw options to TS options
    project.compilerOptions = rawToTsCompilerOptions(projectSpec.compilerOptions, projectFileDirectory);

    // Expand files to include references
    project.files = increaseCompilationContext(project.files);

    // Expand files to include node_modules / package.json / typescript.definition
    var typings = getDefinitionsForNodeModules(dir, project.files);
    project.files = project.files.concat(typings.implicit);
    project.typings = typings.ours.concat(typings.implicit);
    project.files = project.files.concat(typings.packagejson);

    // Normalize to "/" for all files
    // And take the uniq values
    project.files = uniq(project.files.map(fsu.consistentPath));
    projectFileDirectory = fsu.consistentPath(projectFileDirectory);

    return {
        projectFileDirectory: projectFileDirectory,
        projectFilePath: projectFileDirectory + '/' + projectFileName,
        project: project,
        inMemory: false
    };

}

/** Creates a project by source file location. Defaults are assumed unless overriden by the optional spec. */
export function createProjectRootSync(srcFile: string, defaultOptions: ts.CompilerOptions = defaults, overWrite = true) {
    if (!fs.existsSync(srcFile)) {
        throw new Error(errors.CREATE_FILE_MUST_EXIST);
    }

    // Get directory
    var dir = fs.lstatSync(srcFile).isDirectory() ? srcFile : path.dirname(srcFile);
    var projectFilePath = path.normalize(dir + '/' + projectFileName);

    if (!overWrite && fs.existsSync(projectFilePath))
        throw new Error(errors.CREATE_PROJECT_ALREADY_EXISTS);

    // We need to write the raw spec
    var projectSpec: TypeScriptProjectRawSpecification = {};
    projectSpec.compilerOptions = tsToRawCompilerOptions(defaultOptions);
    projectSpec.compileOnSave = true;
    projectSpec.exclude = ["node_modules", "typings/browser", "typings/browser.d.ts"];

    fs.writeFileSync(projectFilePath, json.stringify(projectSpec, os.EOL));
    return getProjectSync(srcFile);
}
