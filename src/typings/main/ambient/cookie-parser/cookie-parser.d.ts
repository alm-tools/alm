// Compiled using typings@0.6.1
// Source: https://raw.githubusercontent.com/DefinitelyTyped/DefinitelyTyped/e95958ac847d9a343bdc8d7cbc796a5f6da29f71/cookie-parser/cookie-parser.d.ts
// Type definitions for cookie-parser
// Project: https://github.com/expressjs/cookie-parser
// Definitions by: Santi Albo <https://github.com/santialbo/>
// Definitions: https://github.com/borisyankov/DefinitelyTyped


declare module "cookie-parser" {
    import express = require('express');
    function e(secret?: string, options?: any): express.RequestHandler;
    export = e;
}