// courtesy @blakeembrey
declare module 'strip-bom' {
    import Buffer = require('buffer')

    function stripBom(value: string): string
    function stripBom(value: Buffer): Buffer

    export = stripBom
}