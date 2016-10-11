/**
 * The stuff from project that the frontend queries.
 * Stuff like autocomplete is a good example.
 * Errors etc are pushed automatically from `activeProject` and do not belong here :)
 */

import {Project} from "./core/project";
import * as activeProject from "./activeProject";
let getProject = activeProject.GetProject.ifCurrentOrErrorOut;

import {Types} from "../../../socket/socketContract";
import * as types from "../../../common/types";

import * as utils from "../../../common/utils";
let {resolve} = utils;
import * as fsu from "../../utils/fsu";
import {errorsCache} from "./cache/tsErrorsCache";
import {getPathCompletionsForAutocomplete} from "./modules/getPathCompletions";

export function getCompletionsAtPosition(query: Types.GetCompletionsAtPositionQuery): Promise<Types.GetCompletionsAtPositionResponse> {
    const {filePath, position, prefix} = query;
    const project = getProject(query.filePath);
    const service = project.languageService;
    const languageServiceHost = project.languageServiceHost;

    const completions: ts.CompletionInfo = service.getCompletionsAtPosition(filePath, position);
    let completionList = completions ? completions.entries.filter(x => !!x) : [];
    const endsInPunctuation = utils.prefixEndsInPunctuation(prefix);

    /** Doing too many suggestions is slowing us down in some cases */
    let maxSuggestions = 10000;

    // limit to maxSuggestions
    if (completionList.length > maxSuggestions) completionList = completionList.slice(0, maxSuggestions);

    let completionsToReturn: Types.Completion[] = completionList.map((c, index) => {
        return {
            name: c.name,
            kind: c.kind,
            comment: '',
            display: ''
        };
    });

    /**
     * Add function signature help
     */
    if (query.prefix == '(') {
        const signatures = service.getSignatureHelpItems(query.filePath, query.position);
        if (signatures && signatures.items) {
            signatures.items.forEach((item, index) => {
                const template: string = item.parameters.map((p, i) => {
                    const display = '{{' + (i + 1) + ':' + ts.displayPartsToString(p.displayParts) + '}}';
                    return display;
                }).join(ts.displayPartsToString(item.separatorDisplayParts));

                const name: string = item.parameters.map((p) => ts.displayPartsToString(p.displayParts))
                    .join(ts.displayPartsToString(item.separatorDisplayParts));

                // e.g. test(something:string):any;
                // prefix: test(
                // template: {{something}}
                // suffix: ): any;
                const description: string =
                    ts.displayPartsToString(item.prefixDisplayParts)
                    + template
                    + ts.displayPartsToString(item.suffixDisplayParts);

                completionsToReturn.unshift({
                    kind: types.completionKindSnippet,
                    /** We use `(sig)` prefix to make sure its sorted by monaco to be at the top */
                    name: '(sig) ' + name,
                    insertText: template,

                    display: 'function signature',
                    comment: `Overload ${index + 1} of ${signatures.items.length}`
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
    if (pathCompletions.length) {
        completionsToReturn = pathCompletions.map(f => {
            const result: types.Completion = {
                kind: types.completionKindPath,
                name: f.relativePath,
                display: f.fileName,
                comment: f.fullPath,

                textEdit: {
                    from: languageServiceHost.getLineAndCharacterOfPosition(filePath, f.pathStringRange.from),
                    to: languageServiceHost.getLineAndCharacterOfPosition(filePath, f.pathStringRange.to),
                    newText: f.relativePath
                }
            };
            return result;
        }).concat(completionsToReturn);
    }

    return resolve({
        completions: completionsToReturn,
        endsInPunctuation: endsInPunctuation
    });
}

export function getCompletionEntryDetails(query: Types.GetCompletionEntryDetailsQuery): Promise<Types.GetCompletionEntryDetailsResponse> {
    const project = getProject(query.filePath);
    const service = project.languageService;
    const {filePath,position,label} = query;

    const completionDetails = project.languageService.getCompletionEntryDetails(filePath, position, label);

    /**
     * For JS Projects, TS will add all sorts of globals as members (because it cannot know for sure)
     * However if you try to `getCompletionEntryDetails` for them, you will get `undefined`.
     */
    if (!completionDetails) return resolve({ display: label, comment: '' });

    const comment = ts.displayPartsToString(completionDetails.documentation || []);
    const display = ts.displayPartsToString(completionDetails.displayParts || []);

    const result = { display: display, comment: comment };
    return resolve(result);
}

export function quickInfo(query: Types.QuickInfoQuery): Promise<Types.QuickInfoResponse> {
    let project = getProject(query.filePath);
    const {languageServiceHost} = project;
    const errors = positionErrors({filePath: query.filePath, position: query.position});
    var info = project.languageService.getQuickInfoAtPosition(query.filePath, query.position);
    if (!info && !errors.length) {
        return Promise.resolve({ valid: false });
    } else {
        return resolve({
            valid: true,
            info: info && {
                name: ts.displayPartsToString(info.displayParts || []),
                comment: ts.displayPartsToString(info.documentation || []),
                range: {
                    from: project.languageServiceHost.getLineAndCharacterOfPosition(query.filePath, info.textSpan.start),
                    to: project.languageServiceHost.getLineAndCharacterOfPosition(query.filePath, info.textSpan.start + info.textSpan.length),
                }
            },
            errors: errors
        });
    }
}

/** Utility */
function positionErrors(query: Types.FilePathPositionQuery): types.CodeError[] {
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
    let quickInfoPromised = quickInfo({ filePath, position: position });

    return defPromised.then((defRes) => {
        return quickInfoPromised.then((infoRes) => {
            return getReferences({ filePath, position }).then(refRes => {
                const valid = !!defRes.definitions.length || infoRes.valid || !!refRes.references.length || !!langHelp;
                return {
                    valid,
                    definitions: defRes.definitions,
                    quickInfo: infoRes.valid && infoRes.info.name ? {
                        name: infoRes.info.name,
                        comment: infoRes.info.comment
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
    const {languageServiceHost, languageService} = project;

    let tsresult = formatting.formatDocument(project, query.filePath, query.editorOptions);
    const edits = tsresult.map(res => {
        const result: Types.FormattingEdit = {
            from: languageServiceHost.getLineAndCharacterOfPosition(query.filePath, res.span.start),
            to: languageServiceHost.getLineAndCharacterOfPosition(query.filePath, res.span.start + res.span.length),
            newText: res.newText
        };
        return result;
    });

    return resolve({edits});
}
export function formatDocumentRange(query: Types.FormatDocumentRangeQuery): Promise<Types.FormatDocumentRangeResponse> {
    let project = getProject(query.filePath);
    const {languageServiceHost, languageService} = project;

    let tsresult = formatting.formatDocumentRange(project, query.filePath, query.from, query.to, query.editorOptions);
    const edits = tsresult.map(res => {
        const result: Types.FormattingEdit = {
            from: languageServiceHost.getLineAndCharacterOfPosition(query.filePath, res.span.start),
            to: languageServiceHost.getLineAndCharacterOfPosition(query.filePath, res.span.start + res.span.length),
            newText: res.newText
        };
        return result;
    });

    return resolve({edits});
}

export function getFormattingEditsAfterKeystroke(query: Types.FormattingEditsAfterKeystrokeQuery): Promise<Types.FormattingEditsAfterKeystrokeResponse> {
    let project = getProject(query.filePath);
    const {languageServiceHost, languageService} = project;
    const position = languageServiceHost.getPositionOfLineAndCharacter(query.filePath, query.editorPosition.line, query.editorPosition.ch);
    const options = formatting.completeFormatCodeOptions(query.editorOptions, project.configFile.project.formatCodeOptions);

    const tsresult = languageService.getFormattingEditsAfterKeystroke(query.filePath, position, query.key, options) || [];
    const edits = tsresult.map(res => {
        const result: Types.FormattingEdit = {
            from: languageServiceHost.getLineAndCharacterOfPosition(query.filePath, res.span.start),
            to: languageServiceHost.getLineAndCharacterOfPosition(query.filePath, res.span.start + res.span.length),
            newText: res.newText
        };
        return result;
    });

    return resolve({edits});
}

import {removeUnusedImports as removeUnusedImportsCore} from './modules/removeUnusedImports';
export function removeUnusedImports(query: Types.FilePathQuery): Promise<types.RefactoringsByFilePath> {
    let project = getProject(query.filePath);
    const {languageServiceHost, languageService} = project;
    return resolve(removeUnusedImportsCore(query.filePath, languageService));
}

/**
 * Symbol search
 */
//--------------------------------------------------------------------------
//  getNavigateToItems
//--------------------------------------------------------------------------

// Look at
// https://github.com/Microsoft/TypeScript/blob/master/src/services/navigateTo.ts
// for inspiration
// Reason for forking:
//  didn't give all results
//  gave results from lib.d.ts
//  I wanted the practice

function getSymbolsForFile(project: Project, sourceFile: ts.SourceFile): types.NavigateToItem[] {
    let getNodeKind = ts.getNodeKind;
    function getDeclarationName(declaration: ts.Declaration): string {
        let result = getTextOfIdentifierOrLiteral(declaration.name);
        if (result !== undefined) {
            return result;
        }

        if (declaration.name.kind === ts.SyntaxKind.ComputedPropertyName) {
            let expr = (<ts.ComputedPropertyName>declaration.name).expression;
            if (expr.kind === ts.SyntaxKind.PropertyAccessExpression) {
                return (<ts.PropertyAccessExpression>expr).name.text;
            }

            return getTextOfIdentifierOrLiteral(expr);
        }

        return undefined;
    }
    function getTextOfIdentifierOrLiteral(node: ts.Node) {
        if (node.kind === ts.SyntaxKind.Identifier ||
            node.kind === ts.SyntaxKind.StringLiteral ||
            node.kind === ts.SyntaxKind.NumericLiteral) {

            return (<ts.Identifier | ts.LiteralExpression>node).text;
        }

        return undefined;
    }

    var items: types.NavigateToItem[] = [];
    let declarations = sourceFile.getNamedDeclarations();
    for (let index in declarations) {
        for (let declaration of declarations[index]) {
            let item: types.NavigateToItem = {
                name: getDeclarationName(declaration),
                kind: getNodeKind(declaration),
                filePath: sourceFile.fileName,
                fileName: utils.getFileName(sourceFile.fileName),
                position: project.languageServiceHost.getLineAndCharacterOfPosition(sourceFile.fileName, declaration.getStart())
            }
            items.push(item);
        }
    }
    return items;
}

export function getNavigateToItems(query: {}): Promise<types.GetNavigateToItemsResponse> {
    let project = activeProject.GetProject.getCurrentIfAny();
    var languageService = project.languageService;

    let items: types.NavigateToItem[] = [];
    for (let file of project.getProjectSourceFiles()) {
        getSymbolsForFile(project, file).forEach(i => items.push(i));
    }

    return utils.resolve({ items });
}

export function getNavigateToItemsForFilePath(query: { filePath: string }): Promise<types.GetNavigateToItemsResponse> {
    let project = activeProject.GetProject.getCurrentIfAny();
    var languageService = project.languageService;

    const file = project.getSourceFile(query.filePath)
    const items = getSymbolsForFile(project, file);

    return utils.resolve({ items });
}

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
import {getRawJsOutput} from "./modules/building";
export function getJSOutputStatus(query: Types.FilePathQuery, autoEmit = true): types.GetJSOutputStatusResponse {
    const project = activeProject.GetProject.ifCurrent(query.filePath);
    if (!project) {
        return {
            inActiveProject: false
        }
    }
    const jsFile = getRawJsOutput(project, query.filePath);

    /**
     * We just read/write from disk for now
     * Would be better if it interacted with master
     */
    const getContents = (filePath: string) => fsu.existsSync(filePath) ? fsu.readFile(filePath) : '';
    const setContents = fsu.writeFile;

    /**
     * Note: If we have compileOnSave as false then the output status isn't relevant
     */
    const noJsFile = (project.configFile.project.compileOnSave === false)
        || (project.configFile.inMemory === true)
        || !jsFile;

    let state
        = noJsFile
            ? types.JSOutputState.NoJSFile
                : getContents(jsFile.filePath) === jsFile.contents
                    ? types.JSOutputState.JSUpToDate
                    : types.JSOutputState.JSOutOfDate;

    /**
     * If the state is JSOutOfDate we can easily fix that to bring it up to date for `compileOnSave`
     */
    if (autoEmit && state === types.JSOutputState.JSOutOfDate && project.configFile.project.compileOnSave !== false) {
        setContents(jsFile.filePath, jsFile.contents);
        state = types.JSOutputState.JSUpToDate;
    }

    const outputStatus: types.JSOutputStatus = {
        inputFilePath: query.filePath,
        state,
        outputFilePath: jsFile && jsFile.filePath
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

/**
 * Semantic Tree
 */
function sortNavbarItemsBySpan(items: ts.NavigationBarItem[]) {
    items.sort((a, b) => a.spans[0].start - b.spans[0].start);

    // sort children recursively
    for (let item of items) {
        if (item.childItems) {
            sortNavbarItemsBySpan(item.childItems);
        }
    }
}
function flattenNavBarItems(items: ts.NavigationBarItem[]): ts.NavigationBarItem[] {
    if (!items.length) return [];
    const root = items[0];

    /**
     * Where we store the final good ones
     */
    const results: ts.NavigationBarItem[] = [];

    /** Just to remove the dupes for different keys */
    const resultMapBig: { [key: string]: ts.NavigationBarItem } = Object.create(null);
    /**
     * The same items apprear with differnt indent, and different `spans`
     * But at least one span seems to match, hence this key(s) function
     */
    const getKeys = (item: ts.NavigationBarItem): string[] => {
        return item.spans.map(span => {
            return `${span.start}-${item.text}`
        });
    };


    /** This is used to unflatten the resulting map */
    const getParentMapKey = (item: ts.NavigationBarItem): string => {
        return `${item.spans[0].start}-${item.text}`
    };
    const parentMap: { [key: string]: ts.NavigationBarItem } = {};

    /**
     * First create a map of everything
     */
    const addToMap = (item: ts.NavigationBarItem, parent: ts.NavigationBarItem) => {
        const keys = getKeys(item);

        const previous = keys.some(key => !!resultMapBig[key]);
        // If we already have it no need to add it.
        // This is because the first time it gets added the parent then is the best one
        if (!previous) {
            keys.forEach(key => resultMapBig[key] = item);
            results.push(item);
            if (item !== root) {
                const parentMapKey = getParentMapKey(item)
                parentMap[parentMapKey] = parent;
            }
        }

        // Whatever is in the final map is the version we want to use for parent pointers
        const itemToUseAsParent = resultMapBig[getParentMapKey(item)];
        // Also visit all children
        item.childItems && item.childItems.forEach((child) => addToMap(child, itemToUseAsParent));

        // Now delete the childItems as they are supposed to be restored by `parentMap`
        delete item.childItems;
    }

    // Flatten into the map
    items.forEach(item => addToMap(item,root));

    // Now restore based on child pointers
    results.forEach(item => {
        if (item == root) return;

        const key = getParentMapKey(item);
        const parent = parentMap[key];

        if (!parent.childItems) parent.childItems = [];
        parent.childItems.push(item);
    });

    // Now we only need the children of the root :)
    return results[0].childItems || [];
}
function navigationBarItemToSemanticTreeNode(item: ts.NavigationBarItem, project: Project, query: Types.FilePathQuery): Types.SemanticTreeNode {
    let toReturn: Types.SemanticTreeNode = {
        text: item.text,
        kind: item.kind,
        kindModifiers: item.kindModifiers,
        start: project.languageServiceHost.getLineAndCharacterOfPosition(query.filePath, item.spans[0].start),
        end: project.languageServiceHost.getLineAndCharacterOfPosition(query.filePath, item.spans[0].start + item.spans[0].length),
        subNodes: item.childItems ? item.childItems.map(ci => navigationBarItemToSemanticTreeNode(ci, project, query)) : []
    }
    return toReturn;
}
export function getSemanticTree(query: Types.GetSemanticTreeQuery): Promise<Types.GetSemanticTreeReponse> {
    let project = getProject(query.filePath);

    let navBarItems = project.languageService.getNavigationBarItems(query.filePath);

    // The nav bar from the language service has nodes at various levels (with duplication)
    // We want a flat version
    navBarItems = flattenNavBarItems(navBarItems);

    // Sort items by first spans:
    sortNavbarItemsBySpan(navBarItems);

    // convert to SemanticTreeNodes
    let nodes = navBarItems.map(nbi => navigationBarItemToSemanticTreeNode(nbi, project, query));
    return resolve({ nodes });
}

/**
 * Document highlights
 */
export function getOccurrencesAtPosition(query: Types.GetOccurancesAtPositionQuery) : Promise<Types.GetOccurancesAtPositionResponse> {
    let project = getProject(query.filePath);
    const {languageServiceHost} = project;
    const position = languageServiceHost.getPositionOfLineAndCharacter(query.filePath, query.editorPosition.line, query.editorPosition.ch);
    const tsresults = project.languageService.getOccurrencesAtPosition(query.filePath, position) || [];
    const results: Types.GetOccurancesAtPositionResult[] = tsresults.map(res=>{
        const result: Types.GetOccurancesAtPositionResult = {
            filePath: res.fileName,
            isWriteAccess: res.isWriteAccess,
            start: project.languageServiceHost.getLineAndCharacterOfPosition(res.fileName, res.textSpan.start),
            end: project.languageServiceHost.getLineAndCharacterOfPosition(res.fileName, res.textSpan.start + res.textSpan.length),
        }
        return result;
    });
    return resolve({results});
}
