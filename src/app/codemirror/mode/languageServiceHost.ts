'use strict';

/**
 * The LanguageServiceHost module provides an ts.LanguageServiceHost implementations
 */
export interface LanguageServiceHost extends ts.LanguageServiceHost {
    /**
     * Add a script to the LanguageServiceHost.
     *
     * @param fileName the absolute path of the file.
     * @param content the file content.
     */
    addScript(fileName: string, content: string): void;

    /**
     * Remove a script from the LanguageServiceHost.
     *
     * @param fileName the absolute path of the file.
     */
    removeScript(fileName: string): void;

    /**
     * Remove all script from the LanguageServiceHost.
     *
     * @param fileName the absolute path of the file.
     */
    removeAll(): void;

    /**
     * Update a script.
     *
     * @param fileName the absolute path of the file.
     * @param content the new file content.
     */
    updateScript(fileName: string, content: string): void;

    hasScript(fileName): boolean;

    /**
     * Edit a script.
     *
     * @param fileName the absolute path of the file
     * @param minChar the index in the file content where the edition begins.
     * @param limChar the index  in the file content where the edition ends.
     * @param newText the text inserted.
     */
    editScript(fileName: string, minChar: number, limChar: number, newText: string): void;

    /**
     * Set the `isOpen` status of a script.
     *
     * @param fileName the absolute file name.
     * @param isOpen open status.
     */
    setScriptIsOpen(fileName: string, isOpen: boolean): void;

    /**
     * The the language service host compilater options.
     *
     * @param the settings to be applied to the host.
     */
    setCompilationSettings(settings: ts.CompilerOptions): void;

    /**
     * Retrieve the content of a given file.
     *
     * @param fileName the absolute file name.
     */
    getScriptContent(fileName: string): string;

}

//--------------------------------------------------------------------------
//
//  LanguageServiceHost factory
//
//--------------------------------------------------------------------------

/**
 * LanguageServiceHost factory.
 *
 * @param currentDir the current directory opened in the editor
 * @param defaultLibFileName the absolute file name of the `lib.d.ts` files associated to the language service host instance.
 */
export function createLanguageServiceHost(currentDir: string, defaultLibFileName: string): LanguageServiceHost {

    /**
     * CompilationSettings;
     */
    var compilationSettings: ts.CompilerOptions;

    /**
     * A map associating absolute file name to ScriptInfo.
     */
    var fileNameToScript: ts.Map<ScriptInfo> = Object.create(null);

    /**
     * Add a script to the LanguageServiceHost.
     *
     * @param fileName the absolute path of the file.
     * @param content the file content.
     */
    function addScript(fileName: string, content: string) {
        var script = createScriptInfo(content);
        fileNameToScript[fileName] = script;
    }

    /**
     * Remove a script from the LanguageServiceHost.
     *
     * @param fileName the absolute path of the file.
     */
    function removeScript(fileName: string) {
        delete fileNameToScript[fileName];
    }

    /**
     * Remove all script from the LanguageServiceHost.
     *
     * @param fileName the absolute path of the file.
     */
    function removeAll(): void {
        fileNameToScript = Object.create(null);
    }

    function hasScript(fileName){
        return !!fileNameToScript[fileName];
    }

    /**
     * Update a script.
     *
     * @param fileName the absolute path of the file.
     * @param content the new file content.
     */
    function updateScript(fileName: string, content: string) {
        var script = fileNameToScript[fileName];
        if (script) {
            if(script.getContent() == content){
                return;
            }

            script.updateContent(content);
            return;
        }
        throw new Error('No script with name \'' + fileName + '\'');
    }

    /**
     * Edit a script.
     *
     * @param fileName the absolute path of the file
     * @param minChar the index in the file content where the edition begins.
     * @param limChar the index  in the file content where the edition ends.
     * @param newText the text inserted.
     */
    function editScript(fileName: string, minChar: number, limChar: number, newText: string) {
        var script = fileNameToScript[fileName];
        if (script) {
            script.editContent(minChar, limChar, newText);
            return;
        }

        throw new Error('No script with name \'' + fileName + '\'');
    }

    /**
     * Set the `isOpen` status of a script.
     *
     * @param fileName the absolute file name.
     * @param isOpen open status.
     */
    function setScriptIsOpen(fileName: string, isOpen: boolean) {
        var script = fileNameToScript[fileName];
        if (script) {
            script.setIsOpen(isOpen);
            return;
        }

        throw new Error('No script with name \'' + fileName + '\'');
    }

    /**
     * Set the language service host compilation settings.
     *
     * @param the settings to be applied to the host
     */
    function setCompilationSettings(settings: ts.CompilerOptions): void{
        compilationSettings = settings;
    }

    /**
     * Retrieve the content of a given script.
     *
     * @param fileName the absolute path of the file.
     */
    function getScriptContent(fileName: string): string {
        var script = fileNameToScript[fileName];
        if (script) {
            return script.getContent();
        }
        return null;
    }

    /**
     * Return the version of a script for the given file name.
     *
     * @param fileName the absolute path of the file.
     */
    function getScriptVersion(fileName: string): string {
        var script = fileNameToScript[fileName];
        if (script) {
            return '' + script.getVersion();
        }
        return '0';
    }

    /**
     * Return the 'open status' of a script for the given file name.
     *
     * @param fileName the absolute path of the file.
     */
    function getScriptIsOpen(fileName: string): boolean {
        var script = fileNameToScript[fileName];
        if (script) {
            return script.getIsOpen();
        }
        return false;
    }

    /**
     * Return an IScriptSnapshot instance for the given file name.
     *
     * @param fileName the absolute path of the file.
     */
    function getScriptSnapshot(fileName: string): ts.IScriptSnapshot {
        var script = fileNameToScript[fileName];
        if (script) {
            return script.getScriptSnapshot();
        }
        return null;
    }

    return {
        // LanguageServiceHost implementation
        addScript,
        removeScript,
        removeAll,
        updateScript,
        hasScript,
        editScript,
        getScriptContent,
        setCompilationSettings,
        setScriptIsOpen,

        // ts.LanguageServiceHost implementation
        getCompilationSettings: () => compilationSettings,
        getScriptFileNames: () => Object.keys(fileNameToScript),
        getCurrentDirectory: () => currentDir,
        getDefaultLibFileName: () => defaultLibFileName,
        getScriptVersion,
        getScriptSnapshot,
    };
}

//--------------------------------------------------------------------------
//
//  ScriptInfo
//
//--------------------------------------------------------------------------

/**
 * Internal Script representation.
 */
interface ScriptInfo {
    /**
     * Returns the content of the file associated to the script.
     */
    getContent(): string;

    /**
     * Update the script content.
     *
     * @param newContent the new content of the file associated to the script.
     */
    updateContent(newContent: string): void;

    /**
     * Edit the script content.
     *
     * @param minChar the index in the file content where the edition begins
     * @param limChar the index  in the file content where the edition ends
     * @param newText the text inserted
     */
    editContent(minChar: number, limChar: number, newText: string): void;

    /**
     * Returns the script version.
     */
    getVersion(): number;

    /**
     * Returns the `isOpen` status of the script.
     */
    getIsOpen(): boolean;

    /**
     * Set the `isOpen` status of the script.
     *
     * @param isOpen
     */
    setIsOpen(isOpen: boolean): void;

    /**
     * Returns a `snapshot` of the script.
     */
    getScriptSnapshot(): ts.IScriptSnapshot;

}

/**
 * ScriptInfo factory.
 *
 * @param content the content of the file associated to this script.
 */
function createScriptInfo(content: string): ScriptInfo {

    /**
     * The script current version.
     */
    var scriptVersion: number = 1;

    /**
     * The script edit history.
     */
    var editRanges: ts.TextChangeRange[] = [];

    /**
     * the `isOpen` status of the Script
     */
    var isOpen = false

    /**
     * Update the script content.
     *
     * @param newContent the new content of the file associated to the script.
     */
    function updateContent(newContent: string): void {
        if (newContent !== content) {
            content = newContent;
            editRanges = [];
            scriptVersion++;
        }
    }

    /**
     * Edit the script content.
     *
     * @param minChar the index in the file content where the edition begins
     * @param limChar the index  in the file content where the edition ends
     * @param newText the text inserted
     */
    function editContent(minChar: number, limChar: number, newText: string): void {
        // Apply edits
        var prefix = content.substring(0, minChar);
        var middle = newText;
        var suffix = content.substring(limChar);
        content = prefix + middle + suffix;

        // Store edit range + new length of script
        editRanges.push({
            span: { start: minChar, length: limChar - minChar },
            newLength: newText.length
        });

        // Update version #
        scriptVersion++;
    }

    /**
     * Retrieve the script `_lineStarts`, recompute them if needed.
     */
    function getScriptSnapshot(): ts.IScriptSnapshot {
        // save the state of the script
        var textSnapshot = content;
        var version = scriptVersion;
        var snapshotRanges = editRanges.slice();

        /**
         * Retrieve the edits history between two script snapshot.
         *
         * @param oldSnapshot the old snapshot to compare this one with.
         */
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
            getText: (start, end) => textSnapshot.substring(start, end),
            getLength: () => textSnapshot.length,
            getChangeRange,
        }
    }

    return {
        getContent: () => content,
        getVersion: () => scriptVersion,
        getIsOpen: () => isOpen,
        setIsOpen: val => isOpen = val,
        getScriptSnapshot,

        updateContent,
        editContent
    }
}
