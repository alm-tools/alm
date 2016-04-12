// Type definitions for editorconfig
// Project: http://npmjs.com/package/editorconfig
// Definitions by: Basarat <https://github.com/basarat/>
// Definitions: https://github.com/borisyankov/DefinitelyTyped

declare module 'editorconfig' {
    export type Options = {
        config?: string;
        version?: string;
        root?: string;
    }
    /**
      {
        indent_style: 'space',
        indent_size: 2,
        end_of_line: 'lf',
        charset: 'utf-8',
        trim_trailing_whitespace: true,
        insert_final_newline: true,
        tab_width: 2
      };
    */
    export type Result = {
        indent_style: 'space' | 'tab',
        indent_size: number,
        end_of_line: 'lf' | 'cr' | 'crlf',
        charset:  'latin1' | 'utf-8' | 'utf-8-bom' | 'utf-16be' | 'utf-16le' ,
        trim_trailing_whitespace: boolean,
        insert_final_newline: boolean,
        tab_width: number
    }
    export function parse(filePath: string, options?: Options): Promise<Result>;
    export function parseSync(filePath: string, options?: Options): Result;
}
