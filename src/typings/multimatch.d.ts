// https://github.com/sindresorhus/multimatch
declare module 'multimatch' {
    /** Returns the paths that match the patterns */
    function multimatch(paths:string[],patterns:string[]): string[];
    export = multimatch;
}
