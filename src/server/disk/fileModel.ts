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
     * Always emit ... even if we are the ones that saved
     */
    public onSavedFileChangedOnDisk = new TypedEvent<{ contents: string }>();

    /**
     * Always emit
     */
    public didEdit = new TypedEvent<{codeEdit: CodeEdit;}>();

    /**
     * Always emit
     */
    public didStatusChange = new TypedEvent<{saved:boolean;eol:string}>();

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
    edit(codeEdit: CodeEdit): { saved: boolean } {
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

        let saved = this.saved();
        this.didEdit.emit({ codeEdit });
        this.didStatusChange.emit({ saved, eol: this.newLine });

        return { saved };
    }

    delete() {
        this.unwatchFile();
        fsu.deleteFile(this.config.filePath);
    }

    save() {
        let contents = this.text.join(this.newLine);
        fsu.writeFile(this.config.filePath, contents);
        this.savedText = this.text.slice();
        this.didStatusChange.emit({saved:true, eol: this.newLine});
    }

    saved(): boolean {
        return utils.arraysEqual(this.text, this.savedText);
    }

    fileListener = (eventName: string, path: string) => {
        let contents = fsu.existsSync(this.config.filePath) ? fsu.readFile(this.config.filePath) : '';
        let text = this.splitlines(contents);

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

    /** Great for error messages etc. Ofcourse `0` based */
    getLinePreview(line: number) {
        return this.text[line];
    }

    /** splitLinesAuto from codemirror */
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
