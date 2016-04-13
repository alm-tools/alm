## TSconfig

The `tsconfig.json` file is the *standard* way of providing compiler options to TypeScript compiler. We use it for all our TypeScript specific configuration as well. You can generate this file with alm using `alm -i`.


The following are the key properties of `tsconfig.json`:

* [`compilerOptions`](#compileroptions)
* [`filesGlob`](#filesglob)
* [`files`](#files)
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

### filesGlob

We support [node style globs](npmjs.com/package/glob). e.g.

```json
"filesGlob": [
  "**/*.ts",
  "**/*.tsx",
  "!node_modules/**"
]
```

Note: The proper way to exclude a directory in node's `glob` module is `!somedirectory/**`. E.g. `!node_modules/**`. Please **don't add** a trailing `*` (e.g. `!node_modules/**/*.ts`) as that will force us to list the directory which can be slow.

### files

You can specify individual files instead of using a glob.

```json
"files": [
  "core.ts",
  "sys.ts",
  "types.ts"
]
```

> 🔴: This option is ignored if you use `filesGlob`. Use either `files` or `filesGlob`

### exclude

You can specify exclude directories using `exclude` property. E.g.

```json
"exclude": [
  "node_modules",
  "wwwroot"
]
```

### compileOnSave

By default true. If set to true we will emit JavaScript for TypeScript files on initial boot as well as *super fast incrementally* if you edit any TypeScript file.

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
