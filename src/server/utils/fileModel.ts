import os = require('os');
import fsu = require('./fsu');

/**
 * Loads a file from disk or keeps it in memory 
 * watches it on fs and then if it changes sends the new content to the client
 * File is *always* saved to cache for recovery
 */
export class FileModel {
    /** either the os default or whatever was read from the file */
    private newLine;
    private content: string = '';

    constructor(public filePath?: string) {
        if (filePath) {
            this.content = fsu.readFile(filePath);
        }
        this.newLine = this.getExpectedNewline(this.content);
    }

    updateFileContent(newContent) {
        // write to cache if file is not on disk
        
    }

    save(filePath?: string) {
        if (filePath) {
            this.filePath = filePath;
        }

        let lines = this.splitlines(this.content);
        let content = lines.join(this.newLine);
        fsu.writeFile(this.filePath, content);
    }

    close() { this.dispose(); }
    dispose() {

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