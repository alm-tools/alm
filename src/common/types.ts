/**
 * Its Types (e.g. enums) + constants :)
 */

export const cacheDir = './.alm';
export const title = "Application Lifecycle Management tools for TypeScript";

export enum TriState {
    Unknown,
    True,
    False,
}

export const errors = {
    CALLED_WHEN_NO_ACTIVE_PROJECT_FOR_FILE_PATH: "A query *that needs an active project* was made when there is no active project for given filePath",
    CALLED_WHEN_NO_ACTIVE_PROJECT_GLOBAL: "A query *that needs an active project* was made when there is no active project"
}

/**
 * Some session constants
 */
/** When a new server stats up */
export const urlHashNormal = "root";
/** When user requests a new window */
export const urlHashNewSession = "new-session";
/** When alm is started ni debug mode */
export const urlHashDebugSession = "debug";

/**
 * FARM : Don't want to crash by running out of memory / ui preference
 */
export const maxCountFindAndReplaceMultiResults = 1000;

export interface FilePathPosition {
    filePath: string;
    position: EditorPosition;
}

/**
 * Session related types
 */
export interface SessionsFileContents {
    sessions: SessionOnDisk[];
    /** Relative path to tsconfig.json including file name */
    relativePathToTsconfig?: string;
}
export interface SessionOnDisk {
    /** unique to each session */
    id: string;
    /** the tabs the user has open */
    tabLayout: TabLayoutOnDisk;
    selectedTabId: string | null;
    /** Duration since epoch */
    lastUsed: number;
    /**
     * NOTE: there can be any number of other settings that are type checked only at the client
     */
}
/**
 * Same as a `TabInstance` but works with `relativeUrl`
 */
export interface TabInstanceOnDisk {
    id: string;
    relativeUrl: string;
    /** Any additional data that the tab wants to serialize */
    additionalData: any;
}

/**
 * What the main application tab container knows about a tab
 */
export interface TabInstance {
    id: string;
    url: string;
    /** Any additional data that the tab wants to serialize */
    additionalData: any;
}

/**
 * Just the layout information we serialize
 * A recursive structure for re-storing tab information
 */
export type TabLayout = {
    type: 'stack' | 'row' | 'column' | string;
    /** out of 100 */
    width: number;
    /** out of 100 */
    height: number;
    /** Only exist on a `stack` */
    tabs: TabInstance[];
    activeItemIndex: number;
    /** Only exists if type is not `stack` */
    subItems: TabLayout[];
}

/** Same as above with `ui` stuff replaced with `disk` stuff */
export type TabLayoutOnDisk = {
    type: 'stack' | 'row' | 'column' | string;
    /** out of 100 */
    width: number;
    /** out of 100 */
    height: number;
    /** Only exist on a `stack` */
    tabs: TabInstanceOnDisk[];
    activeItemIndex: number;
    /** Only exists if type is not `stack` */
    subItems: TabLayoutOnDisk[];
}

/**
 * Refactoring related stuff
 */
export interface Refactoring extends ts.TextChange {
    filePath: string;
}

/**
 * Because you generally want to transact per file
 * You don't need to create this manually. Just use `getRefactoringsByFilePath`
 */
export interface RefactoringsByFilePath {
    [filePath: string]: Refactoring[];
}

/**
 * Reason is we want to transact by file path
 * Also, this function sorts per file so you can apply refactorings in order 🌹
 */
export function getRefactoringsByFilePath(refactorings: Refactoring[]) {
    var loc: RefactoringsByFilePath = {};
    for (let refac of refactorings) {
        if (!loc[refac.filePath]) loc[refac.filePath] = [];
        loc[refac.filePath].push(refac);
    }

    // sort each of these in descending by start location
    for (let filePath in loc) {
        let refactorings = loc[filePath];
        refactorings.sort((a: Refactoring, b: Refactoring) => {
            return (b.span.start - a.span.start);
        });
    }

    return loc;
}

/**
 * For file listing we like to know if its a dir or file
 */
export enum FilePathType {
    File,
    Dir
}
export interface FilePath {
    filePath: string;
    type: FilePathType
}
/** For incremental buffered file listing changes */
export interface FileListingDelta {
    addedFilePaths: FilePath[];
    removedFilePaths: FilePath[];
}

/**
 * File model stuff
 */
export interface FileStatus {
    filePath: string;
    saved: boolean;
    eol: string;
}

/**
 * Project JS File status stuff
 */
export interface JSOutputStatus {
    /** Its convinient to have it hare */
    inputFilePath: string;

    /** One of the various states */
    state: JSOutputState;

    /** Only if the state is for some JS file */
    outputFilePath?: string;
}
/** The JS file can only be in one of these states */
export enum JSOutputState {
    /** If emit skipped (Either emit is blocked or compiler options are noEmit) or perhaps there isn't a JS file emit for this (e.g .d.ts files) */
    NoJSFile = 1,
    /** If JS file then its one of these */
    JSUpToDate,
    JSOutOfDate,
}
export type JSOutputStatusCache = { [inputFilePath: string]: JSOutputStatus }
export type LiveBuildResults = {
    builtCount: number;
    totalCount: number;
}
/** Query response for individual file query */
export type GetJSOutputStatusResponse = {
    inActiveProject: boolean,
    /** Only present if the file as in active project */
    outputStatus?: JSOutputStatus
};

/**
 * Complete related stuff
 */
/** Some constants */
export const completionKindSnippet = "snippet";
export const completionKindPath = "path";

/** A completion */
export interface Completion {
    /** stuff like ("var"|"method"etc)  | "snippet" | "path" etc */
    kind: string;
    /** stuff like "toString", "./relativePath" */
    name: string;

    /**
     * This is displayParts (for functions). Empty for `var` etc.
     */
    display?: string;
    /**
     * the docComment if any
     * Also: `fullPath` for path ;)
     */
    comment?: string;

    /** Only valid if `kind` is snippet */
    insertText?: string;

    /** Only valid if `kind` is path completion */
    textEdit?: CodeEdit;
}

/**
 * Really only used when moving data around.
 * We still map it to `Completion` before we handing it over for *autocomplete*
 */
export interface PathCompletion {
    fileName: string;
    relativePath: string;
    fullPath: string;
}
export interface PathCompletionForAutocomplete extends PathCompletion {
    pathStringRange: {
        from: number,
        to: number,
    }
}

/**
 * Editor Config stuff
 */
export interface EditorOptions {
    tabSize: number;
    newLineCharacter: string;
    convertTabsToSpaces: boolean;
    trimTrailingWhitespace: boolean;
    insertFinalNewline: boolean;
}


/**
 * TSConfig details
 */

/**
 * These are the projects that the user can select from.
 * Just the name and config path really
 */
export interface AvailableProjectConfig {
    name: string;
    /** Virtual projects are projects rooted at some `.ts`/`.js` file */
    isVirtual: boolean;
    /** If the project is virtual than this will point to a `.ts`/`.js` file */
    tsconfigFilePath: string;
}

/**
 * Project Data : the config file + all the file path contents
 */
export interface FilePathWithContent {
    filePath: string;
    contents: string;
}
export interface ProjectDataLoaded {
    configFile: TypeScriptConfigFileDetails;
    filePathWithContents: FilePathWithContent[];
}

/**
 * Our analysis of stuff we want from package.json
 */
export interface PackageJsonParsed {
    /** We need this as this is the name the user is going to import **/
    name: string;
    /** we need this to figure out the basePath (will depend on how `outDir` is relative to this directory) */
    directory: string;
    /** This is going to be typescript.definition */
    definition: string;
    main: string;
}

/**
 * This is `TypeScriptProjectRawSpecification` parsed further
 * Designed for use throughout out code base
 */
export interface TsconfigJsonParsed {
    compilerOptions: ts.CompilerOptions;
    files: string[];
    typings: string[]; // These are considered externs for .d.ts. Note : duplicated in files
    formatCodeOptions: ts.FormatCodeOptions;
    compileOnSave: boolean;
    buildOnSave: boolean;
    package?: PackageJsonParsed;
}

export interface TypeScriptConfigFileDetails {
    /** The path to the project file. This acts as the baseDIR */
    projectFileDirectory: string;
    /** The actual path of the project file (including tsconfig.json) or srcFile if `inMemory` is true */
    projectFilePath: string;
    project: TsconfigJsonParsed;
    inMemory: boolean;
}

/**
 * Git types
 */
/** Note : 0,2 means lines 0,1,2  */
export type GitDiffSpan = {
    from: number;
    to: number;
}
export type GitDiff = {
    added: GitDiffSpan[];
    removed: number[];
    modified: GitDiffSpan[];
}
export type GitAddAllCommitAndPushQuery = {
    message: string;
}
export type GitAddAllCommitAndPushResult
    = {
        type: 'error';
        error: string;
    }
    | {
        type: 'success'
        log: string;
    };

/**
 * Errors
 */
export enum ErrorsDisplayMode {
    all = 1,
    openFiles = 2,
}


/**
 * Documentation related stuff
 */
/** for project symbols view */
export interface NavigateToItem {
    name: string;
    kind: string;
    filePath: string;
    position: EditorPosition;
    fileName: string;
}
export interface GetNavigateToItemsResponse {
    items: NavigateToItem[];
}

/**
 * The TypeDoc icons a pretty expansive 🌹 with a few ideas that I disagree with / or think are too difficult.
 * E.g the type `event`. The "grey" coloring of the global functions. The following is a simpler subset.
 *
 * Places that need to be kept in sync:
 * - typeIcon.tsx: the location in typeIcons.svg
 * - the legend component
 * - the server responses
 */
export enum IconType {
    /**
     * There can be only one global
     * Any of the remaining things can be either in a module or global
     */
    Global,

    Namespace, // same for module
    Variable,
    Function,
    FunctionGeneric,

    Enum,
    EnumMember,

    Interface,
    InterfaceGeneric,
    InterfaceConstructor,
    InterfaceProperty,
    InterfaceMethod,
    InterfaceMethodGeneric,
    InterfaceIndexSignature,

    Class,
    ClassGeneric,
    ClassConstructor,
    ClassProperty,
    ClassMethod,
    ClassMethodGeneric,
    ClassIndexSignature,
}

/**
 * The documentation model
 * We have
 * - global
 * - modules
 *
 * These are just "name" + containers for OtherThings
 *
 * OtherThings are just:
 * - class
 * - namespace
 * - interface / type
 * - enum
 *
 * Where Namespace is just a "name" container for OtherThings
 */
export interface DocumentedType {
    name: string;
    icon: IconType,
    comment: string,
    subItems: DocumentedType[];
    location: DocumentedTypeLocation;
}

export type DocumentedTypeLocation = FilePathPosition;

/** For top level module names */
export interface GetTopLevelModuleNamesResponse {
    /** Present in our project */
    files: DocumentedType[];
}


/**
 *
 *
 *
 * UML View
 *
 *
 *
 */
/** Class */
export interface UMLClass {
    // Similar to Documented type.
    name: string;
    icon: IconType
    location: DocumentedTypeLocation;

    // Unlike DocumentedType.subItems we have `members`
    members: UMLClassMember[];
    // Also extends if any
    extends?: UMLClass;
}
export enum UMLClassMemberVisibility {
    Public = 1,
    Private,
    Protected
}
export enum UMLClassMemberLifetime {
    Instance = 1,
    Static
}
export interface UMLClassMember {
    name: string
    icon: IconType;
    location: DocumentedTypeLocation;

    visibility: UMLClassMemberVisibility;
    lifetime: UMLClassMemberLifetime;
    /** Default is false */
    override?: UMLClassMember;
}

/**
 * Ts Flow types
 */
/**
 * Get the root ts flow points
 */
export interface TsFlowRootQuery {
    filePath: string;
}
export interface TsFlowPoint {
    filePath: string;
    from: EditorPosition;
    to: EditorPosition;
    displayName: string;
}
export interface TsFlowRootResponse {
    flowPoints: TsFlowPoint[];
}

/**
 * Live Analysis
 * e.g. when a member overrides a parent we show a hint.
 */
export interface LiveAnalysisQuery {
    filePath: string;
}
export interface LiveAnalysisResponse {
    overrides: LiveAnalysisOverrideInfo[]
}
export interface LiveAnalysisOverrideInfo {
    line: number;
    overrides: UMLClassMember;
}


/**
 * Monaco command pallete support
 */
export interface MonacoActionInformation {
    label: string,
    id: string;
    kbd: string | null;
}

/**
 * When a worker is *working* it can send us a message
 */
export type Working = {
    working: boolean
}

/**
 * Tested
 */
export enum TestStatus {
    NotRunYet = 1,
    Fail,
    Success,
    Skipped,
}
export type TestErrorStack = FilePathPosition[];
export type TestLogPosition = {
    lastPositionInFile: EditorPosition;
    isActualLastInFile: boolean;
    stack: TestErrorStack;
}
export type TestError = {
    testLogPosition: TestLogPosition;
    message: string;
    stack: TestErrorStack;
}
export type TestResult = {
    description: string;
    status: TestStatus;
    testLogPosition: TestLogPosition;

    /** None if skipped */
    durationMs?: number;

    /** Only in case of test failure */
    error?: TestError;
}
export type TestSuiteResult = {
    description: string;
    testLogPosition: TestLogPosition;

    stats: TestContainerStats;

    /** Can have other TestSuites or Tests */
    suites: TestSuiteResult[];
    tests: TestResult[];
}
export type TestLog = {
    /**
     * The log might not be pointing to the same file. We should still show it against
     * `this` spec execution
     */
    testLogPosition: TestLogPosition;
    /**
     * Arguments.
     * Note: they will be stringified and unstringified by the time they make it to the UI
     */
    args: any[];
}
/** The root of any testing system is a test file */
export type TestModule = {
    filePath: string;

    /** From instrumentation */
    logs: TestLog[];

    /**
     * Also contained in the `suites`
     * But raised up for better module level overview
     */
    testResults: TestResult[];

    /** Present once its been run */
    suites: TestSuiteResult[];
    stats: TestContainerStats;
}

/** Both modules and suites are test containers and have these stats */
export type TestContainerStats = {
    testCount: number;

    passCount: number;
    failCount: number;
    skipCount: number;

    /** milliseconds */
    durationMs: number;
};

export type TestSuitesByFilePath = {
    [filePath: string]: TestModule;
}
/** We just push the modules that have updated */
export type TestResultsDelta = {
    updatedModuleMap: TestSuitesByFilePath,
    clearedModules: string[];
    initial: boolean;
}

export type TestSuitePosition = {
    title: string;
    /**
     * The last origin in the file
     */
    testLogPosition: TestLogPosition;
}
export type TestItPosition = {
    title: string;
    /**
     * The last origin in the file
     */
    testLogPosition: TestLogPosition;
}

//////////////////////
// Error cache
//////////////////////
export type CodeErrorSource =
    'tsconfig'
    | 'projectService'
    | 'linter'
    | 'tested'

export interface CodeError {
    source: CodeErrorSource;
    filePath: string;
    from: EditorPosition;
    to: EditorPosition;
    message: string;
    preview: string;
    level: 'warning' | 'error';
}

export interface ErrorsByFilePath {
    [filePath: string]: CodeError[];
}

/**
 * We don't send all the errors to front end continuously.
 * But we do still tell the total count.
 */
export interface LimitedErrorsUpdate {
    errorsByFilePath: ErrorsByFilePath;
    totalCount: number;
    syncCount: number;
    tooMany: boolean;
}

/**
 * Allows true syncing of one cache with another
 */
export type ErrorCacheDelta = {
    added: ErrorsByFilePath;
    removed: ErrorsByFilePath;
    initial: boolean;
}

/** Lots of things don't have a good error. But we would like to be consistent even with simple errors */
export function makeBlandError(filePath: string, error: string, source: CodeErrorSource): CodeError {
    return {
        source,
        filePath,
        from: {
            line: 0,
            ch: 0
        },
        to: {
            line: 0,
            ch: 0
        },
        message: error,
        preview: null,
        level: 'error'
    }
}
//////////////////////
// Live Demo
//////////////////////
export type LiveDemoData =
    | {
        type: 'start'
    }
    | {
        type: 'data'
        data: string
    }
    | {
        type: 'end'
        code: number
    };
//////////////////////
// Live react demo
//////////////////////
export const liveDemoMountUrl = '/demo';

export type LiveDemoBundleResult =
    | {
        type: 'bundling'
    }
    | {
        type: 'success'
    }
    | {
        type: 'error',
        error: string
    }
