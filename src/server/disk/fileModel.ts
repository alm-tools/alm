import utils = require("../../common/utils");
import os = require('os');
import fsu = require('../utils/fsu');
import fs = require('fs');
import chokidar = require('chokidar');
import {TypedEvent} from "../../common/events";

/**
 * Loads a file from disk
 * watches it on fs and then if it changes sends the new content to the client
 * TODO: File is *always* saved to cache for recovery
 *
 * Have a model like code mirror ... just use lines at all places ... till we actually write to disk
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
    public didEdit = new TypedEvent<{codeEdit: CodeEdit}>();

    constructor(public config: {
        filePath: string;
    }) {
        let contents = fsu.readFile(config.filePath);
        this.newLine = this.getExpectedNewline(contents);

        this.text = this.splitlines(contents);
        this.savedText = this.text.slice();
        this.watchFile();
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

        this.didEdit.emit({codeEdit});

        return { saved: this.saved() };
    }

    save() {
        let contents = this.text.join(this.newLine);
        fsu.writeFile(this.config.filePath, contents);
        this.savedText = this.text.slice();
    }

    saved(): boolean {
        return utils.arraysEqual(this.text, this.savedText);
    }

    fileListener = () => {
        let contents = fsu.readFile(this.config.filePath);
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
        this.fsWatcher = chokidar.watch(this.config.filePath);
        this.fsWatcher.on('all',this.fileListener);
    }
    unwatchFile() {
        this.fsWatcher.close();
        this.fsWatcher = null;
    }

    /** splitLinesAuto from codemirror */
    private splitlines(string: string) { return string.split(/\r\n?|\n/); };

    /** Couldn't find one online. Hopefully this is good enough */
    private getExpectedNewline(str: string) {
        let CR = str.match(/\r/g);
        let CRCount = CR ? CR.length : 0;
        let CRLF = str.match(/\r\n/g);
        let CRLFCount = CRLF ? CRLF.length : 0;

        return CRCount == 0
            ? os.EOL
            : CRCount > 1.5 * CRLFCount
                ? '\r'
                : '\r\n';
    }
}
