// https://github.com/atom/fuzzaldrin
declare module 'fuzzaldrin' {
    /** The indexes within the `result` that the `query` matched */
    export var match: (result: string, query: string) => number[];

    export var filter: Function;
    export var score: Function;
}