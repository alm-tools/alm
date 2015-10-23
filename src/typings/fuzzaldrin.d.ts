// https://github.com/atom/fuzzaldrin
declare module 'fuzzaldrin' {
    /** The indexes within the `result` that the `query` matched */
    export var match: (result: string, query: string) => number[];

    export var filter: <T>(list: T[], prefix: string, property?: { key: string }) => T[];
    export var score: Function;
}
