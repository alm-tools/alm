import os = require('os');
import fsu = require('./fsu');
import fs = require('fs');

// TODO: support files not on disk
/**
 * Loads a file from disk or keeps it in memory 
 * watches it on fs and then if it changes sends the new content to the client
 * File is *always* saved to cache for recovery
 */
export class FileModel {
    /** either the os default or whatever was read from the file */
    private newLine;
    private text: string[] = [];

    constructor(public filePath?: string) {
        let content = fsu.readFile(filePath);
        this.newLine = this.getExpectedNewline(content);
        
        // Have a model like code mirror ... just use lines at all places ... till we actually write to disk
        this.text = this.splitlines(content);

        if (filePath) {
            this.watchFile();
        }
    }

    edit(codeEdit: CodeEdit) {
        let lastLine = this.text.length - 1;

        let beforeLines = this.text.slice(0, codeEdit.from.line);
        // there might not be any after lines. This just might be a new line :)
        let afterLines = codeEdit.to.line === lastLine ? [] : this.text.slice(codeEdit.to.line + 1, this.text.length);

        let lines = this.text.slice(codeEdit.from.line, codeEdit.to.line + 1);
        let content = lines.join('\n');
        content = content.substr(0, codeEdit.from.ch) + codeEdit.newText + content.substr(content.length - codeEdit.to.ch);
        lines = content.split('\n');

        this.text = beforeLines.concat(lines).concat(afterLines);
    }

    save(filePath?: string) {
        if (filePath) {
            this.filePath = filePath;
        }

        let content = this.text.join(this.newLine);
        fsu.writeFile(this.filePath, content);
    }

    close() {
        this.unwatchFile();
    }

    fileListener = () => {

    };
    watchFile() {
        fs.watchFile(this.filePath, this.fileListener);
    }
    unwatchFile() {
        fs.unwatchFile(this.filePath, this.fileListener);
    }
    
    /** splitLinesAuto from codemirror */
    private splitlines(string: string) { return string.split(/\r\n?|\n/); };
    
    /** Couldn't find one online. Hopefully this is good enough */
    private getExpectedNewline(str: string) {
        let CR = str.match(/\r/g);
        let CRCount = CR ? CR.length : 0;
        let CRLF = str.match(/\r\n/g);
        let CRLFCount = CRLF ? CRLF.length : 0;

        this.newLine = CRCount == 0
            ? os.EOL
            : CRCount > 1.5 * CRLFCount
                ? '\r'
                : '\r\n';
    }
}