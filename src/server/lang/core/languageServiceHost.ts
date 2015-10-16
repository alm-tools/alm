import path = require('path');
import fs = require('fs');
import fmc = require('../../disk/fileModelCache');
var textBuffer = require('basarat-text-buffer');

import tsconfig = require('./tsconfig');

interface ScriptInfo {
    getFileName(): string;
    getContent(): string;
    getVersion(): number;
    getIsOpen(): boolean;
    setIsOpen(val: boolean): void;
    getEditRanges(): ts.TextChangeRange[];
    getLineStarts(): number[];


    updateContent(newContent: string): void;
    editContent(minChar: number, limChar: number, newText: string): void;
    getPositionFromLine(line: number, ch: number): number;
    getLineAndColForPositon(position: number): EditorPosition;
    getLinePreview(line: number): string;
}

/**
 * Allows you to easily create a "script snapshot" < which is something that the actual language service wants to work with
 */
function createScriptInfo(fileName: string, text: string, isOpen = false): ScriptInfo {


    var version: number = 1;
    var editRanges: ts.TextChangeRange[] = [];

    var _lineStarts: number[];
    var _lineStartIsDirty = true;
    var buffer = new textBuffer(text);

    function getLineStarts() {
        if (_lineStartIsDirty) {
            // TODO: pref
            _lineStarts = [];
            var totalLength = 0;
            buffer.lines.forEach((line, index) => {
                _lineStarts.push(totalLength);
                var lineLength = line.length;
                totalLength = totalLength + lineLength + buffer.lineEndings[index].length;
            });

            _lineStartIsDirty = false;
        }
        return _lineStarts;
    }

    /**
     * update the content of the script
     *
     * @param newContent the new script content
     */
    function updateContent(newContent: string): void {
        buffer = new textBuffer(newContent);
        _lineStartIsDirty = true;
        editRanges = [];
        version++;
    }


    /**
     * edit the script content
     *
     * @param minChar the index in the file content where the edition begins
     * @param limChar the index  in the file content where the edition ends
     * @param newText the text inserted
     */
    function editContent(minChar: number, limChar: number, newText: string): void {

        // Apply edits
        var start = getLineAndColForPositon(minChar);
        var end = getLineAndColForPositon(limChar);

        // console.error('initial text:',buffer.getText()==newText);
        // console.error({minChar,limChar,newText:newText.length});
        // console.error(start,end);
        buffer.setTextInRange([[start.line, start.ch], [end.line, end.ch]], newText, {normalizeLineEndings: false});
        // console.error(buffer.getText().length);
        // console.error(JSON.stringify({newText, final:buffer.getText()}));

        _lineStartIsDirty = true;

        // Store edit range + new length of script
        editRanges.push({
            span: { start: minChar, length: limChar - minChar },
            newLength: newText.length
        });

        // Update version #
        version++;
    }



    /**
     * return an index position from line an character position
     *
     * @param line line number
     * @param character charecter poisiton in the line
     */
    function getPositionFromLine(line: number, ch: number) {
        return buffer.characterIndexForPosition([line, ch]);
    }

    /**
     * return line and chararacter position from index position
     *
     * @param position
     */
    function getLineAndColForPositon(position: number) {
        var {row, column} = buffer.positionForCharacterIndex(position);
        return {
            line: row,
            ch: column
        };
    }

    function getLinePreview(line: number) {
        return (buffer.lines[line] || '').trim();
    }


    return {
        getFileName: () => fileName,
        getContent: () => buffer.getText(),
        getVersion: () => version,
        getIsOpen: () => isOpen,
        setIsOpen: val => isOpen = val,
        getEditRanges: () => editRanges,
        getLineStarts: getLineStarts,

        updateContent: updateContent,
        editContent: editContent,
        getPositionFromLine: getPositionFromLine,
        getLineAndColForPositon: getLineAndColForPositon,
        getLinePreview: getLinePreview
    }
}



function getScriptSnapShot(scriptInfo: ScriptInfo): ts.IScriptSnapshot {
    var lineStarts = scriptInfo.getLineStarts();
    var textSnapshot = scriptInfo.getContent();
    var version = scriptInfo.getVersion()
    var editRanges = scriptInfo.getEditRanges()


    function getChangeRange(oldSnapshot: ts.IScriptSnapshot): ts.TextChangeRange {
        var unchanged = { span: { start: 0, length: 0 }, newLength: 0 };

        function collapseChangesAcrossMultipleVersions(changes: ts.TextChangeRange[]) {
            if (changes.length === 0) {
                return unchanged;
            }
            if (changes.length === 1) {
                return changes[0];
            }
            var change0 = changes[0];
            var oldStartN = change0.span.start;
            var oldEndN = change0.span.start + change0.span.length;
            var newEndN = oldStartN + change0.newLength;
            for (var i = 1; i < changes.length; i++) {
                var nextChange = changes[i];
                var oldStart1 = oldStartN;
                var oldEnd1 = oldEndN;
                var newEnd1 = newEndN;
                var oldStart2 = nextChange.span.start;
                var oldEnd2 = nextChange.span.start + nextChange.span.length;
                var newEnd2 = oldStart2 + nextChange.newLength;
                oldStartN = Math.min(oldStart1, oldStart2);
                oldEndN = Math.max(oldEnd1, oldEnd1 + (oldEnd2 - newEnd1));
                newEndN = Math.max(newEnd2, newEnd2 + (newEnd1 - oldEnd2));
            }
            return { span: { start: oldStartN, length: oldEndN - oldStartN }, newLength: newEndN - oldStartN };
        };

        var scriptVersion: number = (<any>oldSnapshot).version || 0;
        if (scriptVersion === version) {
            return unchanged;
        }
        var initialEditRangeIndex = editRanges.length - (version - scriptVersion);

        if (initialEditRangeIndex < 0) {
            return null;
        }

        var entries = editRanges.slice(initialEditRangeIndex);
        return collapseChangesAcrossMultipleVersions(entries);
    }

    return {
        getText: (start: number, end: number) => textSnapshot.substring(start, end),
        getLength: () => textSnapshot.length,
        getChangeRange: getChangeRange,
    }
}

export var getDefaultLibFilePath = (options: ts.CompilerOptions) => {
    var filename = ts.getDefaultLibFileName(options);
    return (path.join(path.dirname(require.resolve('ntypescript')), filename)).split('\\').join('/');
}

export var typescriptDirectory = path.dirname(require.resolve('ntypescript')).split('\\').join('/');


// NOTES:
// * fileName is * always * the absolute path to the file
// * content is *always* the string content of the file
export class LanguageServiceHost implements ts.LanguageServiceHost {

    /**
     * a map associating file absolute path to ScriptInfo
     */
    fileNameToScript: { [fileName: string]: ScriptInfo } = Object.create(null);

    constructor(private config: tsconfig.TypeScriptConfigFileDetails) {
        // Add the `lib.d.ts`
        if (!config.project.compilerOptions.noLib) {
          this.addScript(getDefaultLibFilePath(config.project.compilerOptions));
        }
    }

    addScript = (fileName: string, content?: string) => {
        try {
            if (!content) {
                content = fmc.getOrCreateOpenFile(fileName).getContents();
            }
        }
        catch (ex) { // if we cannot read the file for whatever reason
            // TODO: in next version of TypeScript langauge service we would add it with "undefined"
            // For now its just an empty string
            content = '';
        }

        var script = createScriptInfo(fileName, content);
        this.fileNameToScript[fileName] = script;
    }

    removeScript = (fileName: string) => {
        delete this.fileNameToScript[fileName];
    }

    removeAll = () => {
        this.fileNameToScript = Object.create(null);
    }

    updateScript = (fileName: string, content: string) => {
        var script = this.fileNameToScript[fileName];
        if (script) {
            script.updateContent(content);
            return;
        }
        else {
            this.addScript(fileName, content);
        }
    }

    editScript = (fileName: string, start: EditorPosition, end: EditorPosition, newText: string) => {
        var script = this.fileNameToScript[fileName];
        if (script) {
            var minChar = script.getPositionFromLine(start.line, start.ch);
            var limChar = script.getPositionFromLine(end.line, end.ch);
            script.editContent(minChar, limChar, newText);
            return;
        }

        throw new Error('No script with name \'' + fileName + '\'');
    }

    setScriptIsOpen = (fileName: string, isOpen: boolean) => {
        var script = this.fileNameToScript[fileName];
        if (script) {
            script.setIsOpen(isOpen);
            return;
        }

        throw new Error('No script with name \'' + fileName + '\'');
    }

    getScriptContent = (fileName: string): string => {
        var script = this.fileNameToScript[fileName];
        if (script) {
            return script.getContent();
        }
        return null;
    }

    hasScript = (fileName: string) => {
        return !!this.fileNameToScript[fileName];
    }

    getIndexFromPosition = (fileName: string, position: { col: number; line: number }): number => {
        var script = this.fileNameToScript[fileName];
        if (script) {
            return script.getPositionFromLine(position.line, position.col);
        }
        return -1;
    }

    getPositionFromIndex = (fileName: string, index: number): { ch: number; line: number } => {
        if (!this.fileNameToScript[fileName]) this.addScript(fileName);
        var script = this.fileNameToScript[fileName];
        if (script) {
            return script.getLineAndColForPositon(index);
        }
        return null;
    }

    getPositionFromTextSpanWithLinePreview = (fileName: string, textSpan: ts.TextSpan): { position: EditorPosition, preview: string } => {
        var position = this.getPositionFromIndex(fileName, textSpan.start);
        var script = this.fileNameToScript[fileName];
        var preview = script.getLinePreview(position.line);

        return { preview, position };
    }

    ////////////////////////////////////////
    // ts.LanguageServiceHost implementation
    ////////////////////////////////////////

    getCompilationSettings = () => this.config.project.compilerOptions;
    getScriptFileNames = (): string[]=> Object.keys(this.fileNameToScript);
    getScriptVersion = (fileName: string): string => {
        var script = this.fileNameToScript[fileName];
        if (script) {
            return '' + script.getVersion();
        }
        return '0';
    }
    getScriptIsOpen = (fileName: string): boolean => {
        var script = this.fileNameToScript[fileName];
        if (script) {
            return script.getIsOpen();
        }
        return false;
    }
    getScriptSnapshot = (fileName: string): ts.IScriptSnapshot  => {
        var script = this.fileNameToScript[fileName];
        if (script) {
            return getScriptSnapShot(script);
        }
        // This script should be a part of the project if it exists
        else if (fs.existsSync(fileName)){
            this.config.project.files.push(fileName);
            this.addScript(fileName);
            return this.getScriptSnapshot(fileName);
        }
        return null;
    }
    getCurrentDirectory = (): string  => {
        return this.config.projectFileDirectory;
    }
    getDefaultLibFileName = ts.getDefaultLibFileName;
}
