/**
 * The stuff from project that the frontend queries.
 * Stuff like autocomplete is a good example.
 * Errors etc are pushed automatically from `activeProject` and do not belong here :)
 */

import * as activeProject from "./activeProject";
let getProject = activeProject.GetProject.ifCurrentOrErrorOut;

import {Types} from "../../../socket/socketContract";
import * as types from "../../../common/types";

import * as utils from "../../../common/utils";
let {resolve} = utils;
import * as fsu from "../../utils/fsu";
import fuzzaldrin = require('fuzzaldrin');
import {errorsCache} from "./cache/tsErrorsCache";
import {getPathCompletionsForAutocomplete} from "./modules/getPathCompletions";

export function getCompletionsAtPosition(query: Types.GetCompletionsAtPositionQuery): Promise<Types.GetCompletionsAtPositionResponse> {
    const {filePath, position, prefix} = query;
    const project = getProject(query.filePath);
    const service = project.languageService;

    const completions: ts.CompletionInfo = service.getCompletionsAtPosition(filePath, position);
    let completionList = completions ? completions.entries.filter(x => !!x) : [];
    const endsInPunctuation = utils.prefixEndsInPunctuation(prefix);

    if (prefix.length && prefix.trim().length && !endsInPunctuation) {
        // Didn't work good for punctuation
        completionList = fuzzaldrin.filter(completionList, prefix.trim(), { key: 'name' });
    }

    /** Doing too many suggestions is slowing us down in some cases */
    let maxSuggestions = 50;
    /** Doc comments slow us down tremendously */
    let maxDocComments = 10;

    // limit to maxSuggestions
    if (completionList.length > maxSuggestions) completionList = completionList.slice(0, maxSuggestions);

    // Potentially use it more aggresively at some point
    // This queries the langauge service so its a bit slow
    function docComment(c: ts.CompletionEntry): {
        /** The display parts e.g. (a:number)=>string */
        display: string;
        /** The doc comment */
        comment: string;
    } {
        const completionDetails = project.languageService.getCompletionEntryDetails(filePath, position, c.name);
        const comment = ts.displayPartsToString(completionDetails.documentation || []);

        // Show the signatures for methods / functions
        var display: string;
        if (c.kind == "method" || c.kind == "function" || c.kind == "property") {
            let parts = completionDetails.displayParts || [];
            // don't show `(method)` or `(function)` as that is taken care of by `kind`
            if (parts.length > 3) {
                parts = parts.splice(3);
            }
            display = ts.displayPartsToString(parts);
        }
        else {
            display = '';
        }
        display = display.trim();

        return { display: display, comment: comment };
    }

    let completionsToReturn: Types.Completion[] = completionList.map((c, index) => {
        if (index < maxDocComments) {
            var details = docComment(c);
        }
        else {
            details = {
                display: '',
                comment: ''
            }
        }
        return {
            name: c.name,
            kind: c.kind,
            comment: details.comment,
            display: details.display
        };
    });

    /**
     * Add function signature help
     */
    if (query.prefix == '(') {
        const signatures = service.getSignatureHelpItems(query.filePath, query.position);
        if (signatures && signatures.items) {
            signatures.items.forEach((item) => {
                const template: string = item.parameters.map((p, i) => {
                    const display = '${' + (i + 1) + ':' + ts.displayPartsToString(p.displayParts) + '}';
                    return display;
                }).join(ts.displayPartsToString(item.separatorDisplayParts));

                const name: string = item.parameters.map((p) => ts.displayPartsToString(p.displayParts))
                    .join(ts.displayPartsToString(item.separatorDisplayParts));

                // e.g. test(something:string):any;
                // prefix: test(
                // template: ${something}
                // suffix: ): any;
                const description: string =
                    ts.displayPartsToString(item.prefixDisplayParts)
                    + template
                    + ts.displayPartsToString(item.suffixDisplayParts);

                completionsToReturn.unshift({
                    snippet: {
                        template,
                        name,
                        description: description
                    }
                });
            });
        }
    }

    /**
     * Add file path completions
     */
    const pathCompletions = getPathCompletionsForAutocomplete({
        position,
        project,
        filePath,
        prefix
    });
    completionsToReturn =
        pathCompletions.length
            ? pathCompletions.concat(completionsToReturn)
            : completionsToReturn;


    return resolve({
        completions: completionsToReturn,
        endsInPunctuation: endsInPunctuation
    });
}

export function quickInfo(query: Types.QuickInfoQuery): Promise<Types.QuickInfoResponse> {
    let project = getProject(query.filePath);
    if (!project.includesSourceFile(query.filePath)) {
        return Promise.resolve({ valid: false });
    }
    var info = project.languageService.getQuickInfoAtPosition(query.filePath, query.position);
    var errors = positionErrors(query);
    if (!info && !errors.length) {
        return Promise.resolve({ valid: false });
    } else {
        return resolve({
            valid: true,
            info: info && {
                name: ts.displayPartsToString(info.displayParts || []),
                comment: ts.displayPartsToString(info.documentation || [])
            },
            errors: errors
        });
    }
}

/** Utility */
function positionErrors(query: Types.FilePathPositionQuery): CodeError[] {
    let project = getProject(query.filePath);
    if (!project.includesSourceFile(query.filePath)) {
        return [];
    }

    let editorPos = project.languageServiceHost.getLineAndCharacterOfPosition(query.filePath, query.position);
    let errors = errorsCache.getErrorsForFilePath(query.filePath);
    errors = errors.filter(e =>
        // completely contained in the multiline
        (e.from.line < editorPos.line && e.to.line > editorPos.line)
        // error is single line and on the same line and characters match
        || (e.from.line == e.to.line && e.from.line == editorPos.line && e.from.ch <= editorPos.ch && e.to.ch >= editorPos.ch)
    );

    return errors;
}

export function getRenameInfo(query: Types.GetRenameInfoQuery): Promise<Types.GetRenameInfoResponse> {
    let project = getProject(query.filePath);
    var findInStrings = false, findInComments = false;
    var info = project.languageService.getRenameInfo(query.filePath, query.position);
    if (info && info.canRename) {
        var locations: { [filePath: string]: ts.TextSpan[] } = {};
        project.languageService.findRenameLocations(query.filePath, query.position, findInStrings, findInComments)
            .forEach(loc => {
                if (!locations[loc.fileName]) locations[loc.fileName] = [];

                // Using unshift makes them with maximum value on top ;)
                locations[loc.fileName].unshift(loc.textSpan);
            });
        return resolve({
            canRename: true,
            localizedErrorMessage: info.localizedErrorMessage,
            displayName: info.displayName,
            fullDisplayName: info.fullDisplayName,
            kind: info.kind,
            kindModifiers: info.kindModifiers,
            triggerSpan: info.triggerSpan,
            locations: locations
        });
    }
    else {
        return resolve({
            canRename: false
        });
    }
}

export function getDefinitionsAtPosition(query: Types.GetDefinitionsAtPositionQuery): Promise<Types.GetDefinitionsAtPositionResponse> {
    let project = getProject(query.filePath);
    var definitions = project.languageService.getDefinitionAtPosition(query.filePath, query.position);
    var projectFileDirectory = project.configFile.projectFileDirectory;
    if (!definitions || !definitions.length) return resolve({ projectFileDirectory: projectFileDirectory, definitions: [] });

    return resolve({
        projectFileDirectory: projectFileDirectory,
        definitions: definitions.map(d => {
            // If we can get the filename *we are in the same program :P*
            var pos = project.languageServiceHost.getLineAndCharacterOfPosition(d.fileName, d.textSpan.start);
            return {
                filePath: d.fileName,
                position: pos,
                span: d.textSpan,
            };
        })
    });
}

import {getLangHelp} from "./modules/langHelp";
export function getDoctorInfo(query: Types.GetDoctorInfoQuery): Promise<Types.GetDoctorInfoResponse> {
    let project = getProject(query.filePath);
    let filePath = query.filePath;
    let position = project.languageServiceHost.getPositionOfLineAndCharacter(query.filePath, query.editorPosition.line, query.editorPosition.ch);

    // Get langHelp
    const program = project.languageService.getProgram();
    const sourceFile = program.getSourceFile(query.filePath);
    const positionNode = ts.getTokenAtPosition(sourceFile, position);
    const langHelp = getLangHelp(positionNode)

    // Just collect other responses
    let defPromised = getDefinitionsAtPosition({ filePath, position });
    let quickInfoPromised = quickInfo({ filePath, position });

    return defPromised.then((defRes) => {
        return quickInfoPromised.then((infoRes) => {
            return getReferences({ filePath, position }).then(refRes => {
                const valid = !!defRes.definitions.length || infoRes.valid || !!refRes.references.length || !!langHelp;
                return {
                    valid,
                    definitions: defRes.definitions,
                    quickInfo: infoRes.valid && infoRes.info.name ? {
                        name: infoRes.info.name,
                        comment: infoRes.info.name
                    } : null,
                    langHelp,
                    references: refRes.references
                }
            });
        });
    });
}

export function getReferences(query: Types.GetReferencesQuery): Promise<Types.GetReferencesResponse> {
    let project = getProject(query.filePath);
    var languageService = project.languageService;

    var references: ReferenceDetails[] = [];
    var refs = languageService.getReferencesAtPosition(query.filePath, query.position) || [];

    references = refs.map(r => {
        const position = project.languageServiceHost.getLineAndCharacterOfPosition(r.fileName, r.textSpan.start);
        return { filePath: r.fileName, position: position, span: r.textSpan }
    });

    return resolve({
        references
    })
}

/**
 * Formatting
 */
import * as formatting from "./modules/formatting";
export function formatDocument(query: Types.FormatDocumentQuery): Promise<Types.FormatDocumentResponse> {
    let project = getProject(query.filePath);
    return resolve({ refactorings: formatting.formatDocument(project, query.filePath, query.editorOptions) });
}
export function formatDocumentRange(query: Types.FormatDocumentRangeQuery): Promise<Types.FormatDocumentRangeResponse> {
    let project = getProject(query.filePath);
    return resolve({ refactorings: formatting.formatDocumentRange(project, query.filePath, query.from, query.to, query.editorOptions) });
}

/**
 * Documentation
 */
import * as documentation from "./modules/documentation";
export const getNavigateToItems = documentation.getNavigateToItems;

/**
 * Dependency View
 */
import {getProgramDependencies} from "./modules/programDependencies";
export function getDependencies(query: {}): Promise<Types.GetDependenciesResponse> {
    let project = activeProject.GetProject.getCurrentIfAny();
    var links = getProgramDependencies(project.configFile, project.languageService.getProgram());
    return resolve({ links });
}

/**
 * AST View
 */
import {astToText, astToTextFull} from "./modules/astToText";
export function getAST(query: Types.GetASTQuery): Promise<Types.GetASTResponse> {
    let project = getProject(query.filePath);
    var service = project.languageService;

    var files = service.getProgram().getSourceFiles().filter(x => x.fileName == query.filePath);
    if (!files.length) resolve({});

    var sourceFile = files[0];

    let root = query.mode === Types.ASTMode.visitor
        ? astToText(sourceFile)
        : astToTextFull(sourceFile);

    return resolve({ root });
}


/**
 * JS Ouput
 */
import {getRawOutput} from "./modules/building";
export type GetJSOutputStatusResponse = { inActiveProject: boolean, outputStatus?: types.JSOutputStatus };
export function getJSOutputStatus(query: Types.FilePathQuery, autoEmit = true): GetJSOutputStatusResponse {
    const project = activeProject.GetProject.ifCurrent(query.filePath);
    if (!project) {
        return {
            inActiveProject: false
        }
    }
    const output: ts.EmitOutput = getRawOutput(project, query.filePath);
    const jsFile = output.outputFiles.filter(x => x.name.endsWith(".js"))[0];

    /**
     * We just read/write from disk for now
     * Would be better if it interacted with master
     */
    const getContents = (filePath: string) => fsu.existsSync(filePath) ? fsu.readFile(filePath) : '';
    const setContents = fsu.writeFile;

    /**
     * Note: If we have compileOnSave as false then the output status isn't relevant
     */
    let state = output.emitSkipped ? types.JSOutputState.EmitSkipped
        : (project.configFile.project.compileOnSave === false) || !jsFile ? types.JSOutputState.NoJSFile
            : getContents(jsFile.name) === jsFile.text ? types.JSOutputState.JSUpToDate
                : types.JSOutputState.JSOutOfDate;

    /**
     * If the state is JSOutOfDate we can easily fix that to bring it up to date for `compileOnSave`
     */
    if (autoEmit && state === types.JSOutputState.JSOutOfDate && project.configFile.project.compileOnSave !== false) {
        setContents(jsFile.name, jsFile.text);
        state = types.JSOutputState.JSUpToDate;
    }

    const outputStatus: types.JSOutputStatus = {
        inputFilePath: query.filePath,
        state,
        outputFilePath: jsFile && jsFile.name
    };

    return {
        inActiveProject: true,
        outputStatus
    };
}

/**
 * Get Quick Fix
 */
import {QuickFix, QuickFixQueryInformation} from "./quickFix/quickFix";
import * as qf from "./quickFix/quickFix";
import {allQuickFixes} from "./quickFix/quickFixRegistry";
function getDiagnositcsByFilePath(query: Types.FilePathQuery) {
    let project = getProject(query.filePath);
    var diagnostics = project.languageService.getSyntacticDiagnostics(query.filePath);
    if (diagnostics.length === 0) {
        diagnostics = project.languageService.getSemanticDiagnostics(query.filePath);
    }
    return diagnostics;
}
function getInfoForQuickFixAnalysis(query: Types.GetQuickFixesQuery): QuickFixQueryInformation {
    let project = getProject(query.filePath);
    let program = project.languageService.getProgram();
    let sourceFile = program.getSourceFile(query.filePath);
    let sourceFileText: string,
        fileErrors: ts.Diagnostic[],
        positionErrors: ts.Diagnostic[],
        positionErrorMessages: string[],
        positionNode: ts.Node;
    if (project.includesSourceFile(query.filePath)) {
        sourceFileText = sourceFile.getFullText();
        fileErrors = getDiagnositcsByFilePath(query);
        /** We want errors that are *touching* and thefore expand the query position by one */
        positionErrors = fileErrors.filter(e => ((e.start - 1) < query.position) && (e.start + e.length + 1) > query.position);
        positionErrorMessages = positionErrors.map(e => ts.flattenDiagnosticMessageText(e.messageText, '\n'));
        positionNode = ts.getTokenAtPosition(sourceFile, query.position);
    } else {
        sourceFileText = "";
        fileErrors = [];
        positionErrors = [];
        positionErrorMessages = [];
        positionNode = undefined;
    }

    let service = project.languageService;
    let typeChecker = program.getTypeChecker();

    return {
        project,
        program,
        sourceFile,
        sourceFileText,
        fileErrors,
        positionErrors,
        positionErrorMessages,
        position: query.position,
        positionNode,
        service,
        typeChecker,
        filePath: query.filePath,
        indentSize: query.indentSize
    };
}

export function getQuickFixes(query: Types.GetQuickFixesQuery): Promise<Types.GetQuickFixesResponse> {
    let project = getProject(query.filePath);
    var info = getInfoForQuickFixAnalysis(query);

    // We let the quickFix determine if it wants provide any fixes for this file
    var fixes = allQuickFixes
        .map(x => {
            var canProvide = x.canProvideFix(info);
            if (!canProvide)
                return;
            else
                return { key: x.key, display: canProvide.display };
        })
        .filter(x => !!x);

    return resolve({ fixes });
}
export function applyQuickFix(query: Types.ApplyQuickFixQuery): Promise<Types.ApplyQuickFixResponse> {
    var fix = allQuickFixes.filter(x => x.key == query.key)[0];
    var info = getInfoForQuickFixAnalysis(query);
    var res = fix.provideFix(info);
    var refactorings = qf.getRefactoringsByFilePath(res);
    return resolve({ refactorings });
}
