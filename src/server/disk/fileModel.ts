import utils = require("../../common/utils");
import os = require('os');
import fsu = require('../utils/fsu');
import fs = require('fs');
import chokidar = require('chokidar');
import {TypedEvent} from "../../common/events";

import {getEditorOptions} from "./editorOptions";
import {EditorOptions} from "../../common/types";

/**
 * Loads a file from disk
 * watches it on fs and then if it changes sends the new content to the client
 * TODO: File is *always* saved to cache for recovery
 *
 * Has a model like code mirror ... just use lines at all places ... till we actually write to disk
 */
export class FileModel {
    /** either the os default or whatever was read from the file */
    private newLine: string;
    private text: string[] = [];

    /** last known state of the file system text */
    private savedText: string[] = [];

    /**
     * New contents is only sent if the file has no pending changes. Otherwise it is silently ignored
     */
    public onSavedFileChangedOnDisk = new TypedEvent<{ contents: string }>();

    /**
     * Always emit
     */
    public didEdits = new TypedEvent<{codeEdits: CodeEdit[];}>();

    /**
     * Always emit
     */
    public didStatusChange = new TypedEvent<{saved:boolean;eol:string}>();

    /**
     * Editor config changed
     * Only after initial load
     */
    public editorOptionsChanged = new TypedEvent<EditorOptions>();

    /**
     * Editor config
     */
    editorOptions: EditorOptions;

    constructor(public config: {
        filePath: string;
    }) {
        let contents = fsu.readFile(config.filePath);
        this.newLine = this.getExpectedNewline(contents);

        this.text = this.splitlines(contents);
        this.savedText = this.text.slice();
        this.watchFile();
        this.editorOptions = getEditorOptions(config.filePath);
    }

    getContents() {
        return this.text.join('\n');
    }

    /** Returns true if the file is same as what was on disk */
    edits(codeEdits: CodeEdit[]): { saved: boolean } {
        /** PREF: This batching can probably be made more efficient */
        codeEdits.forEach(edit => {
            this.edit(edit);
        });

        let saved = this.saved();
        this.didEdits.emit({ codeEdits });
        this.didStatusChange.emit({ saved, eol: this.newLine });

        return { saved };
    }

    private edit(codeEdit: CodeEdit) {
        let lastLine = this.text.length - 1;

        let beforeLines = this.text.slice(0, codeEdit.from.line);
        // there might not be any after lines. This just might be a new line :)
        let afterLines = codeEdit.to.line === lastLine ? [] : this.text.slice(codeEdit.to.line + 1, this.text.length);

        let lines = this.text.slice(codeEdit.from.line, codeEdit.to.line + 1);
        let content = lines.join('\n');
        let contentBefore = content.substr(0, codeEdit.from.ch);
        let contentAfter = lines[lines.length - 1].substr(codeEdit.to.ch);
        content = contentBefore + codeEdit.newText + contentAfter;
        lines = content.split('\n');

        this.text = beforeLines.concat(lines).concat(afterLines);
    }

    delete() {
        this.unwatchFile();
        fsu.deleteFile(this.config.filePath);
    }

    _justWroteFileToDisk = false;
    save() {
        // NOTE we can never easily mutate our local `text` otherwise we have to send the changes out and sync them which is going to be nightmare
        const textToWrite = this.editorOptions.trimTrailingWhitespace ? this.text.map(t => t.replace(/[ \f\t\v]*$/gm, '')) : this.text;
        let contents = textToWrite.join(this.newLine);
        if (this.editorOptions.insertFinalNewline && !contents.endsWith(this.newLine)) {
            contents = contents + this.newLine;
        }

        fsu.writeFile(this.config.filePath, contents);
        this._justWroteFileToDisk = true;
        this.savedText = this.text.slice();
        this.didStatusChange.emit({saved:true, eol: this.newLine});
    }

    saved(): boolean {
        return utils.arraysEqual(this.text, this.savedText);
    }

    fileListener = (eventName: string, path: string) => {
        let contents = fsu.existsSync(this.config.filePath) ? fsu.readFile(this.config.filePath) : '';
        let text = this.splitlines(contents);

        // If we wrote the file no need to do any further checks
        // Otherwise sometime we end up editing the file and change event fires too late and we think its new content
        if (this._justWroteFileToDisk) {
            this._justWroteFileToDisk = false;
            return;
        }

        // If new text same as current text nothing to do.
        if (arraysEqualWithWhitespace(text, this.savedText)) {
            return;
        }

        if (this.saved()) {
            this.text = text;
            this.savedText = this.text.slice();

            this.onSavedFileChangedOnDisk.emit({ contents: this.getContents() });
        }
    };

    /** The chokidar watcher */
    private fsWatcher: fs.FSWatcher = null;
    watchFile() {
        this.fsWatcher = chokidar.watch(this.config.filePath,{ignoreInitial: true});
        this.fsWatcher.on('change',this.fileListener);
    }
    unwatchFile() {
        this.fsWatcher.close();
        this.fsWatcher = null;
    }

    /** Just updates `text` saves */
    setContents(contents: string) {
        this.text = this.splitlines(contents);
        this.save();
    }

    /**
     * Someone else should call this if an editor config file changes
     * Here we need to re-evalute our options
     */
    recheckEditorOptions() {
        this.editorOptions = getEditorOptions(this.config.filePath);
        this.editorOptionsChanged.emit(this.editorOptions);
    }

    /** Great for error messages etc. Ofcourse `0` based */
    getLinePreview(line: number) {
        return this.text[line];
    }

    /**
     * split lines
     * https://github.com/codemirror/CodeMirror/blob/5738f9b2cff5241ea13e32db3579eb347e56e7a0/lib/codemirror.js#L8594
     */
    private splitlines(string: string) { return string.split(/\r\n?|\n/); };

    /** https://github.com/sindresorhus/detect-newline/blob/master/index.js */
    private getExpectedNewline(str: string) {
        var newlines = (str.match(/(?:\r?\n)/g) || []);
        var crlf = newlines.filter(function (el) { return el === '\r\n'; }).length;
        var lf = newlines.length - crlf;

        // My addition
        if (lf == 0 && crlf == 0) return os.EOL;

        return crlf > lf ? '\r\n' : '\n';
    }
}


/**
 * shallow equality of sorted string arrays that considers whitespace to be insignificant
 */
function arraysEqualWithWhitespace(a: string[], b: string[]): boolean {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (a.length !== b.length) return false;

    for (var i = 0; i < a.length; ++i) {
        if (a[i].trim() !== b[i].trim()) return false;
    }
    return true;
}
