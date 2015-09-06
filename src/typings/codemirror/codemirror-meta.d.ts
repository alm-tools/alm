// Type definitions for CodeMirror
// Project: https://github.com/marijnh/CodeMirror
// Definitions by: basarat <https://github.com/basarat>
// Definitions: https://github.com/borisyankov/DefinitelyTyped

declare module CodeMirror {
    interface ModeInfo {
        name: string;

        // One of:
        mime: string; mimes?: string[];

        mode: string;
        ext: string[];

        file?: RegExp;
        alias?: string[];
    }
    
    export var modeInfo: ModeInfo[];
    export function findModeByMIME(mime: string): ModeInfo;
    export function findModeByExtension(mime: string): ModeInfo;
    export function findModeByFileName(mime: string): ModeInfo;
    export function findModeByName(mime: string): ModeInfo;
}

declare module "codemirror/mode/meta" {
    export = CodeMirror;
}