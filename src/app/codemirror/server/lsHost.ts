require('ntypescript');
require('./liner');

namespace ts.awesome {

    export class ScriptInfo {
        svc: ScriptVersionCache;
        children: ScriptInfo[] = [];     // files referenced by this file
        fileWatcher: FileWatcher;
        path: Path;

        constructor(private host: ServerHost, public fileName: string, public content: string, public isOpen = false) {
            this.path = toPath(fileName, host.getCurrentDirectory(), createGetCanonicalFileName(host.useCaseSensitiveFileNames));
            this.svc = ScriptVersionCache.fromString(host, content);
        }

        close() {
            this.isOpen = false;
        }

        addChild(childInfo: ScriptInfo) {
            this.children.push(childInfo);
        }

        snap() {
            return this.svc.getSnapshot();
        }

        getText() {
            const snap = this.snap();
            return snap.getText(0, snap.getLength());
        }

        getLineInfo(line: number) {
            const snap = this.snap();
            return snap.index.lineNumberToInfo(line);
        }

        editContent(start: number, end: number, newText: string): void {
            this.svc.edit(start, end - start, newText);
        }

        getTextChangeRangeBetweenVersions(startVersion: number, endVersion: number): ts.TextChangeRange {
            return this.svc.getTextChangesBetweenVersions(startVersion, endVersion);
        }

        getChangeRange(oldSnapshot: ts.IScriptSnapshot): ts.TextChangeRange {
            return this.snap().getChangeRange(oldSnapshot);
        }
    }

    export class ScriptVersionCache {
        changes: TextChange[] = [];
        versions: LineIndexSnapshot[] = [];
        minVersion = 0;  // no versions earlier than min version will maintain change history
        private currentVersion = 0;
        private host: ServerHost;

        static changeNumberThreshold = 8;
        static changeLengthThreshold = 256;
        static maxVersions = 8;

        // REVIEW: can optimize by coalescing simple edits
        edit(pos: number, deleteLen: number, insertedText?: string) {
            this.changes[this.changes.length] = new TextChange(pos, deleteLen, insertedText);
            if ((this.changes.length > ScriptVersionCache.changeNumberThreshold) ||
                (deleteLen > ScriptVersionCache.changeLengthThreshold) ||
                (insertedText && (insertedText.length > ScriptVersionCache.changeLengthThreshold))) {
                this.getSnapshot();
            }
        }

        latest() {
            return this.versions[this.currentVersion];
        }

        latestVersion() {
            if (this.changes.length > 0) {
                this.getSnapshot();
            }
            return this.currentVersion;
        }

        reloadFromFile(filename: string, cb?: () => any) {
            const content = this.host.readFile(filename);
            this.reload(content);
            if (cb)
                cb();
        }

        // reload whole script, leaving no change history behind reload
        reload(script: string) {
            this.currentVersion++;
            this.changes = []; // history wiped out by reload
            const snap = new LineIndexSnapshot(this.currentVersion, this);
            this.versions[this.currentVersion] = snap;
            snap.index = new LineIndex();
            const lm = LineIndex.linesFromText(script);
            snap.index.load(lm.lines);
            // REVIEW: could use linked list
            for (let i = this.minVersion; i < this.currentVersion; i++) {
                this.versions[i] = undefined;
            }
            this.minVersion = this.currentVersion;

        }

        getSnapshot() {
            let snap = this.versions[this.currentVersion];
            if (this.changes.length > 0) {
                let snapIndex = this.latest().index;
                for (let i = 0, len = this.changes.length; i < len; i++) {
                    const change = this.changes[i];
                    snapIndex = snapIndex.edit(change.pos, change.deleteLen, change.insertedText);
                }
                snap = new LineIndexSnapshot(this.currentVersion + 1, this);
                snap.index = snapIndex;
                snap.changesSincePreviousVersion = this.changes;
                this.currentVersion = snap.version;
                this.versions[snap.version] = snap;
                this.changes = [];
                if ((this.currentVersion - this.minVersion) >= ScriptVersionCache.maxVersions) {
                    const oldMin = this.minVersion;
                    this.minVersion = (this.currentVersion - ScriptVersionCache.maxVersions) + 1;
                    for (let j = oldMin; j < this.minVersion; j++) {
                        this.versions[j] = undefined;
                    }
                }
            }
            return snap;
        }

        getTextChangesBetweenVersions(oldVersion: number, newVersion: number) {
            if (oldVersion < newVersion) {
                if (oldVersion >= this.minVersion) {
                    const textChangeRanges: ts.TextChangeRange[] = [];
                    for (let i = oldVersion + 1; i <= newVersion; i++) {
                        const snap = this.versions[i];
                        for (let j = 0, len = snap.changesSincePreviousVersion.length; j < len; j++) {
                            const textChange = snap.changesSincePreviousVersion[j];
                            textChangeRanges[textChangeRanges.length] = textChange.getTextChangeRange();
                        }
                    }
                    return ts.collapseTextChangeRangesAcrossMultipleVersions(textChangeRanges);
                }
                else {
                    return undefined;
                }
            }
            else {
                return ts.unchangedTextChangeRange;
            }
        }

        static fromString(host: ServerHost, script: string) {
            const svc = new ScriptVersionCache();
            const snap = new LineIndexSnapshot(0, svc);
            svc.versions[svc.currentVersion] = snap;
            svc.host = host;
            snap.index = new LineIndex();
            const lm = LineIndex.linesFromText(script);
            snap.index.load(lm.lines);
            return svc;
        }
    }

    export class LineIndexSnapshot implements ts.IScriptSnapshot {
        index: LineIndex;
        changesSincePreviousVersion: TextChange[] = [];

        constructor(public version: number, public cache: ScriptVersionCache) {
        }

        getText(rangeStart: number, rangeEnd: number) {
            return this.index.getText(rangeStart, rangeEnd - rangeStart);
        }

        getLength() {
            return this.index.root.charCount();
        }

        // this requires linear space so don't hold on to these
        getLineStartPositions(): number[] {
            const starts: number[] = [-1];
            let count = 1;
            let pos = 0;
            this.index.every((ll, s, len) => {
                starts[count++] = pos;
                pos += ll.text.length;
                return true;
            }, 0);
            return starts;
        }

        getLineMapper() {
            return ((line: number) => {
                return this.index.lineNumberToInfo(line).offset;
            });
        }

        getTextChangeRangeSinceVersion(scriptVersion: number) {
            if (this.version <= scriptVersion) {
                return ts.unchangedTextChangeRange;
            }
            else {
                return this.cache.getTextChangesBetweenVersions(scriptVersion, this.version);
            }
        }
        getChangeRange(oldSnapshot: ts.IScriptSnapshot): ts.TextChangeRange {
            const oldSnap = <LineIndexSnapshot>oldSnapshot;
            return this.getTextChangeRangeSinceVersion(oldSnap.version);
        }
    }

    export interface ProjectOptions {
        // these fields can be present in the project file
        files?: string[];
        compilerOptions?: ts.CompilerOptions;
    }

    export interface ServerHost extends ts.System {
    }

    /**
     * Format options
     */
    export interface FormatOptions extends EditorOptions {

        /** Defines space handling after a comma delimiter. Default value is true. */
        insertSpaceAfterCommaDelimiter?: boolean;

        /** Defines space handling after a semicolon in a for statemen. Default value is true */
        insertSpaceAfterSemicolonInForStatements?: boolean;

        /** Defines space handling after a binary operator. Default value is true. */
        insertSpaceBeforeAndAfterBinaryOperators?: boolean;

        /** Defines space handling after keywords in control flow statement. Default value is true. */
        insertSpaceAfterKeywordsInControlFlowStatements?: boolean;

        /** Defines space handling after function keyword for anonymous functions. Default value is false. */
        insertSpaceAfterFunctionKeywordForAnonymousFunctions?: boolean;

        /** Defines space handling after opening and before closing non empty parenthesis. Default value is false. */
        insertSpaceAfterOpeningAndBeforeClosingNonemptyParenthesis?: boolean;

        /** Defines space handling after opening and before closing non empty brackets. Default value is false. */
        insertSpaceAfterOpeningAndBeforeClosingNonemptyBrackets?: boolean;

        /** Defines whether an open brace is put onto a new line for functions or not. Default value is false. */
        placeOpenBraceOnNewLineForFunctions?: boolean;

        /** Defines whether an open brace is put onto a new line for control blocks or not. Default value is false. */
        placeOpenBraceOnNewLineForControlBlocks?: boolean;

        /** Index operator */
        [key: string] : string | number | boolean;
    }

    function mergeFormatOptions(formatCodeOptions: FormatCodeOptions, formatOptions: FormatOptions): void {
        const hasOwnProperty = Object.prototype.hasOwnProperty;
        Object.keys(formatOptions).forEach((key) => {
            const codeKey = key.charAt(0).toUpperCase() + key.substring(1);
            if (hasOwnProperty.call(formatCodeOptions, codeKey)) {
                formatCodeOptions[codeKey] = formatOptions[key];
            }
        });
    }

    // text change information
    export class TextChange {
        constructor(public pos: number, public deleteLen: number, public insertedText?: string) {
        }

        getTextChangeRange() {
            return ts.createTextChangeRange(ts.createTextSpan(this.pos, this.deleteLen),
                this.insertedText ? this.insertedText.length : 0);
        }
    }

    interface TimestampedResolvedModule extends ResolvedModuleWithFailedLookupLocations {
        lastCheckTime: number;
    }

    export class LSHost implements ts.LanguageServiceHost {
        ls: ts.LanguageService;
        compilationSettings: ts.CompilerOptions;
        filenameToScript: ts.FileMap<ScriptInfo>;
        roots: ScriptInfo[] = [];
        private resolvedModuleNames: ts.FileMap<Map<TimestampedResolvedModule>>;
        private moduleResolutionHost: ts.ModuleResolutionHost;
        private getCanonicalFileName: (fileName: string) => string;

        constructor(public host: ServerHost) {
            this.getCanonicalFileName = createGetCanonicalFileName(host.useCaseSensitiveFileNames);
            this.resolvedModuleNames = createFileMap<Map<TimestampedResolvedModule>>();
            this.filenameToScript = createFileMap<ScriptInfo>();
            this.moduleResolutionHost = {
                fileExists: fileName => this.fileExists(fileName),
                readFile: fileName => this.host.readFile(fileName)
            };
        }

        resolveModuleNames(moduleNames: string[], containingFile: string): ResolvedModule[] {
            const path = toPath(containingFile, this.host.getCurrentDirectory(), this.getCanonicalFileName);
            const currentResolutionsInFile = this.resolvedModuleNames.get(path);

            const newResolutions: Map<TimestampedResolvedModule> = {};
            const resolvedModules: ResolvedModule[] = [];

            const compilerOptions = this.getCompilationSettings();

            for (const moduleName of moduleNames) {
                // check if this is a duplicate entry in the list
                let resolution = lookUp(newResolutions, moduleName);
                if (!resolution) {
                    const existingResolution = currentResolutionsInFile && ts.lookUp(currentResolutionsInFile, moduleName);
                    if (moduleResolutionIsValid(existingResolution)) {
                        // ok, it is safe to use existing module resolution results
                        resolution = existingResolution;
                    }
                    else {
                        resolution = <TimestampedResolvedModule>resolveModuleName(moduleName, containingFile, compilerOptions, this.moduleResolutionHost);
                        resolution.lastCheckTime = Date.now();
                        newResolutions[moduleName] = resolution;
                    }
                }

                ts.Debug.assert(resolution !== undefined);

                resolvedModules.push(resolution.resolvedModule);
            }

            // replace old results with a new one
            this.resolvedModuleNames.set(path, newResolutions);
            return resolvedModules;

            function moduleResolutionIsValid(resolution: TimestampedResolvedModule): boolean {
                if (!resolution) {
                    return false;
                }

                if (resolution.resolvedModule) {
                    // TODO: consider checking failedLookupLocations
                    // TODO: use lastCheckTime to track expiration for module name resolution
                    return true;
                }

                // consider situation if we have no candidate locations as valid resolution.
                // after all there is no point to invalidate it if we have no idea where to look for the module.
                return resolution.failedLookupLocations.length === 0;
            }
        }

        getDefaultLibFileName() {
            const nodeModuleBinDir = ts.getDirectoryPath(ts.normalizePath(this.host.getExecutingFilePath()));
            return ts.combinePaths(nodeModuleBinDir, ts.getDefaultLibFileName(this.compilationSettings));
        }

        getScriptSnapshot(filename: string): ts.IScriptSnapshot {
            const scriptInfo = this.getScriptInfo(filename);
            if (scriptInfo) {
                return scriptInfo.snap();
            }
        }

        setCompilationSettings(opt: ts.CompilerOptions) {
            this.compilationSettings = opt;
            // conservatively assume that changing compiler options might affect module resolution strategy
            this.resolvedModuleNames.clear();
        }

        lineAffectsRefs(filename: string, line: number) {
            const info = this.getScriptInfo(filename);
            const lineInfo = info.getLineInfo(line);
            if (lineInfo && lineInfo.text) {
                const regex = /reference|import|\/\*|\*\//;
                return regex.test(lineInfo.text);
            }
        }

        getCompilationSettings() {
            // change this to return active project settings for file
            return this.compilationSettings;
        }

        getScriptFileNames() {
            return this.roots.map(root => root.fileName);
        }

        getScriptVersion(filename: string) {
            return this.getScriptInfo(filename).svc.latestVersion().toString();
        }

        getCurrentDirectory(): string {
            return "";
        }

        getScriptIsOpen(filename: string) {
            return this.getScriptInfo(filename).isOpen;
        }

        removeReferencedFile(info: ScriptInfo) {
            if (!info.isOpen) {
                this.filenameToScript.remove(info.path);
                this.resolvedModuleNames.remove(info.path);
            }
        }

        getScriptInfo(filename: string): ScriptInfo {
            const path = toPath(filename, this.host.getCurrentDirectory(), this.getCanonicalFileName);
            let scriptInfo = this.filenameToScript.get(path);
            if (!scriptInfo) {
                // TODO bas scriptInfo = this.project.openReferencedFile(filename);
                if (scriptInfo) {
                    this.filenameToScript.set(path, scriptInfo);
                }
            }
            return scriptInfo;
        }

        addRoot(info: ScriptInfo) {
            if (!this.filenameToScript.contains(info.path)) {
                this.filenameToScript.set(info.path, info);
                this.roots.push(info);
            }
        }

        removeRoot(info: ScriptInfo) {
            if (!this.filenameToScript.contains(info.path)) {
                this.filenameToScript.remove(info.path);
                this.roots = copyListRemovingItem(info, this.roots);
                this.resolvedModuleNames.remove(info.path);
            }
        }

        saveTo(filename: string, tmpfilename: string) {
            const script = this.getScriptInfo(filename);
            if (script) {
                const snap = script.snap();
                this.host.writeFile(tmpfilename, snap.getText(0, snap.getLength()));
            }
        }

        reloadScript(filename: string, tmpfilename: string, cb: () => any) {
            const script = this.getScriptInfo(filename);
            if (script) {
                script.svc.reloadFromFile(tmpfilename, cb);
            }
        }

        editScript(filename: string, start: number, end: number, newText: string) {
            const script = this.getScriptInfo(filename);
            if (script) {
                script.editContent(start, end, newText);
                return;
            }

            throw new Error("No script with name '" + filename + "'");
        }

        resolvePath(path: string): string {
            const start = new Date().getTime();
            const result = this.host.resolvePath(path);
            return result;
        }

        fileExists(path: string): boolean {
            const start = new Date().getTime();
            const result = this.host.fileExists(path);
            return result;
        }

        directoryExists(path: string): boolean {
            return this.host.directoryExists(path);
        }

        /**
         *  @param line 1 based index
         */
        lineToTextSpan(filename: string, line: number): ts.TextSpan {
            const path = toPath(filename, this.host.getCurrentDirectory(), this.getCanonicalFileName);
            const script: ScriptInfo = this.filenameToScript.get(path);
            const index = script.snap().index;

            const lineInfo = index.lineNumberToInfo(line + 1);
            let len: number;
            if (lineInfo.leaf) {
                len = lineInfo.leaf.text.length;
            }
            else {
                const nextLineInfo = index.lineNumberToInfo(line + 2);
                len = nextLineInfo.offset - lineInfo.offset;
            }
            return ts.createTextSpan(lineInfo.offset, len);
        }

        /**
         * @param line 1 based index
         * @param offset 1 based index
         */
        lineOffsetToPosition(filename: string, line: number, offset: number): number {
            const path = toPath(filename, this.host.getCurrentDirectory(), this.getCanonicalFileName);
            const script: ScriptInfo = this.filenameToScript.get(path);
            const index = script.snap().index;

            const lineInfo = index.lineNumberToInfo(line);
            // TODO: assert this offset is actually on the line
            return (lineInfo.offset + offset - 1);
        }

        /**
         * @param line 1-based index
         * @param offset 1-based index
         */
        positionToLineOffset(filename: string, position: number): ILineInfo {
            const path = toPath(filename, this.host.getCurrentDirectory(), this.getCanonicalFileName);
            const script: ScriptInfo = this.filenameToScript.get(path);
            const index = script.snap().index;
            const lineOffset = index.charOffsetToLineNumberAndPos(position);
            return { line: lineOffset.line, offset: lineOffset.offset + 1 };
        }
    }
}
