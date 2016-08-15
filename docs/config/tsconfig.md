## TSconfig

The `tsconfig.json` file is the *standard* way of providing compiler options to TypeScript compiler. We use it for all our TypeScript specific configuration as well. You can generate this file with alm using `alm -i`.

## Autocomplete
We support autocomplete for many of the TSConfig options:

![](https://raw.githubusercontent.com/alm-tools/alm-tools.github.io/master/screens/tsconfigCompletion.gif)


## TSConfig contents
The following are the key properties of `tsconfig.json`:

* [`compilerOptions`](#compileroptions)
* [`files`](#files)
* [`include`](#include)
* [`exclude`](#exclude)
* [`compileOnSave`](#compileonsave)
* [`formatCodeOptions`](#formatcodeoptions)

### compilerOptions
The key compiler options. e.g:

```json
"compilerOptions": {
  "target": "es5",
  "module": "commonjs",
  "sourceMap": true,
  "jsx": "react"
}
```
The docs for these compiler options [exist here](https://github.com/Microsoft/TypeScript-Handbook/blob/master/pages/Compiler%20Options.md).

### files
### include
### exclude
Please see the docs here : https://basarat.gitbooks.io/typescript/content/docs/project/files.html

### compileOnSave

By default true. If set to true we will emit JavaScript (*super fast incrementally*) for any TypeScript files you edit.

```json
"compileOnSave": true
```

> You can use this property to switch off any compilation (e.g. if you are using an external tool to generate JavaScript).

### formatCodeOptions

You can use this property to fine tune the result of running a TypeScript code format command. The following are the various options supported along with their default values:

```json
{
    "formatCodeOptions": {
        "insertSpaceAfterCommaDelimiter": true,
        "insertSpaceAfterSemicolonInForStatements": true,
        "insertSpaceBeforeAndAfterBinaryOperators": true,
        "insertSpaceAfterKeywordsInControlFlowStatements": true,
        "insertSpaceAfterFunctionKeywordForAnonymousFunctions": false,
        "insertSpaceAfterOpeningAndBeforeClosingNonemptyParenthesis": false,
        "placeOpenBraceOnNewLineForFunctions": false,
        "placeOpenBraceOnNewLineForControlBlocks": false
    }
}
```

### More
The *official* options of `tsconfig.json` (ones understood by `tsc`) are documented [in the schema](http://json.schemastore.org/tsconfig)

## TSConfig selection
You can select the tsconfig.json in various ways:
* By default we check common locations (e.g. `.`, `./src`, `./ts` etc.)
* See if the last session had one and use that
* You can select one when you start the app `alm -p ./super-special/tsconfig.json`
* You can select one using project search command from the UI. When you have multiple `tsconfig.json` files in your project this allows you to switch between them.


## Contributing
[Details on the features implementation](/contributing/tsconfig.md)
