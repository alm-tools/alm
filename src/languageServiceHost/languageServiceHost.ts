import liner = require('./liner');
import {TypedEvent} from "../common/events";

let toPath = ts.toPath;
import Path = ts.Path;
import LineIndex = liner.LineIndex;
let unorderedRemoveItem = ts.unorderedRemoveItem;
interface ILineInfo extends liner.ILineInfo { }
let createFileMap = ts.createFileMap;
/** BAS : a function I added, useful as we are working without true fs host */
const toSimplePath = (fileName: string): Path => toPath(fileName, '', (x) => x);
/** our compiler settings for simple tokenization */
const defaultCompilerOptions: ts.CompilerOptions = {
    jsx: ts.JsxEmit.React,
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.Latest,
    experimentalDecorators: true,
    noLib: true,
}


/**
 * These classes are modified version of session.ts
 * Same names but modified to not use `fs` / `sys` / `host`
 */
export class ScriptInfo {
    svc: ScriptVersionCache;
    children: ScriptInfo[] = [];     // files referenced by this file
    path: Path;

    constructor(public fileName: string, public content: string, public isOpen = false) {
        this.path = toSimplePath(fileName);
        this.svc = ScriptVersionCache.fromString(content);
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

    static fromString(script: string) {
        const svc = new ScriptVersionCache();
        const snap = new LineIndexSnapshot(0, svc);
        svc.versions[svc.currentVersion] = snap;
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

// text change information
export class TextChange {
    constructor(public pos: number, public deleteLen: number, public insertedText?: string) {
    }

    getTextChangeRange() {
        return ts.createTextChangeRange(ts.createTextSpan(this.pos, this.deleteLen),
            this.insertedText ? this.insertedText.length : 0);
    }
}


export class LSHost implements ts.LanguageServiceHost {
    ls: ts.LanguageService;
    filenameToScript: ts.FileMap<ScriptInfo>;
    roots: ScriptInfo[] = [];

    /**
     * BAS: add configuration arguments
     * - projectDirectory,
     * - compilerOptions
     */
    constructor(public projectDirectory: string | undefined, public compilerOptions = defaultCompilerOptions) {
        this.filenameToScript = createFileMap<ScriptInfo>();
    }

    getDefaultLibFileName = () => null;

    getScriptSnapshot(filename: string): ts.IScriptSnapshot {
        const scriptInfo = this.getScriptInfo(filename);
        if (scriptInfo) {
            return scriptInfo.snap();
        }
    }

    lineAffectsRefs(filename: string, line: number) {
        const info = this.getScriptInfo(filename);
        const lineInfo = info.getLineInfo(line);
        if (lineInfo && lineInfo.text) {
            const regex = /reference|import|\/\*|\*\//;
            return regex.test(lineInfo.text);
        }
    }

    // BAS change this to return active project settings for file
    getCompilationSettings() {
        return this.compilerOptions;
    }

    getScriptFileNames() {
        return this.roots.map(root => root.fileName);
    }

    getScriptVersion(filename: string) {
        return this.getScriptInfo(filename).svc.latestVersion().toString();
    }

    // BAS : wired to config. Needed for proper `@types` expansion.
    // See the child class `LanguageServiceHost` implementation below (with more comments).
    getCurrentDirectory = () => this.projectDirectory;

    getScriptIsOpen(filename: string) {
        return this.getScriptInfo(filename).isOpen;
    }

    getScriptInfo(filename: string): ScriptInfo {
        const path = toSimplePath(filename);
        let scriptInfo = this.filenameToScript.get(path);
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
            unorderedRemoveItem(this.roots, info)
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

    /**
     * Add a file with contents
     */
    addScript(filePath: string, contents: string) {
        let path = toSimplePath(filePath);
        if (!this.filenameToScript.contains(path)) {
            let info = new ScriptInfo(filePath, contents);
            this.addRoot(info);
        }
    }

    /**
     *  @param line 1 based index
     */
    lineToTextSpan(filename: string, line: number): ts.TextSpan {
        const path = toSimplePath(filename);
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
        const path = toSimplePath(filename);
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
        const path = toSimplePath(filename);
        const script: ScriptInfo = this.filenameToScript.get(path);
        const index = script.snap().index;
        const lineOffset = index.charOffsetToLineNumberAndPos(position);
        return { line: lineOffset.line, offset: lineOffset.offset + 1 };
    }
}

/**
 * BAS:
 * This class is my own creation.
 */
export class LanguageServiceHost extends LSHost {
    removeFile(filename: string){
        const script = this.getScriptInfo(filename);
        this.removeRoot(script);
    }
    /**
     * Basically having setContents ensure long term stability even if stuff does get out of sync due to errors in above implementation
     */
    setContents(filename: string, contents: string) {
        const script = this.getScriptInfo(filename);
        if (script) {
            script.svc.reload(contents);
            return;
        }
        throw new Error("No script with name '" + filename + "'");
    }
    /**
     * Note : This can be slow
     */
    getContents(filename: string) {
        const script = this.getScriptInfo(filename);
        if (script) {
            return script.getText();
        }
        throw new Error("No script with name '" + filename + "'");
    }

    /** 0 based */
    getPositionOfLineAndCharacter(filePath: string, line: number, ch: number) {
        return this.lineOffsetToPosition(filePath, line + 1, ch + 1);
    }
    /** 0 based */
    getLineAndCharacterOfPosition(filePath: string, pos: number): EditorPosition {
        let res = this.positionToLineOffset(filePath, pos);
        return { line: res.line - 1, ch: res.offset - 1 };
    }

    /** Like parent EditScript but works on EditorPosition */
    applyCodeEdit(fileName: string, start: EditorPosition, end: EditorPosition, newText: string) {
        var minChar = this.getPositionOfLineAndCharacter(fileName, start.line, start.ch);
        var limChar = this.getPositionOfLineAndCharacter(fileName, end.line, end.ch);
        super.editScript(fileName, minChar, limChar, newText);
    }

    /*
     * LS host can optionally implement these methods to support getImportModuleCompletionsAtPosition.
     * Without these methods, only completions for ambient modules will be provided.
     */
    readDirectory = ts.sys ? ts.sys.readDirectory : undefined;
    readFile = ts.sys ? ts.sys.readFile: undefined;
    fileExists = ts.sys ? ts.sys.fileExists : undefined;

    /**
     * getDirectories is also required for full import and type reference completions.
     * Without it defined, certain completions will not be provided
     */
    getDirectories = ts.sys ? ts.sys.getDirectories : undefined;

    /**
     * For @types expansion, these two functions are needed.
     */
    directoryExists = ts.sys ? ts.sys.directoryExists : undefined;
    getCurrentDirectory = () => {
        /**
         * TODO: use the same path as the path of tsconfig.json (if any)
         * `undefined` is handled correctly in the compiler source :
         * https://github.com/Microsoft/TypeScript/blob/02493de5ccd9e8c4c901bb154ba584dee392bd14/src/compiler/moduleNameResolver.ts#L98
         */
        return this.projectDirectory;
    }

    /**
     * We allow incremental loading of resources.
     * Needed for node_modules and for stuff like `user types a require statement`
     */
    incrementallyAddedFile = new TypedEvent<{filePath: string}>();

    getScriptSnapshot(fileName: string): ts.IScriptSnapshot {
        let snap = super.getScriptSnapshot(fileName);
        if (!snap) {
            // This script should be a part of the project if it exists
            // But we only do this in the server
            if (typeof process !== "undefined" && typeof require !== "undefined") {
                if (require('fs').existsSync(fileName)) {
                    try {
                        /** Just because the file exists doesn't mean we can *read* it. Hence the try */
                        const contents = require('fs').readFileSync(fileName, 'utf8');
                        this.addScript(fileName, contents);
                        snap = super.getScriptSnapshot(fileName);
                        this.incrementallyAddedFile.emit({filePath:fileName});
                    }
                    catch (e) {

                    }
                }
            }
        }
        return snap;
    }
}
