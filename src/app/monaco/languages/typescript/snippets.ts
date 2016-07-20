
export interface TemplateConfig {
    name: string;
    description: string;

    /** A string version of the template. We parse this to TokenStream */
    template: string;
}

export const defaultSnippets: TemplateConfig[] = [
    {
        "name": "for",
        "description": "iterate over array",
        "template": "for (let {{2:index}} = 0; {{2:index}} < {{1:array}}.length; {{2:index}}++) {\n\t{{}}\n}"
    },
    {
        "name": "fort",
        "description": "iterate over array with temporary variable",
        "template": "for (let {{index}} = 0; {{index}} < {{array}}.length; {{index}}++) {\n\tconst {{array_element}} = {{array}}[{{index}}];\n\t{{}}\n}"
    },
    {
        "name": "forin",
        "description": "iterate using for .. in",
        "template": "for (const {{2:key}} in {{1:iterable}}) {\n\t{{}}\n}"
    },
    {
        "name": "forof",
        "description": "iterate using for .. of",
        "template": "for (const {{2:item}} of {{1:iterable}}) {\n\t{{}}\n}"
    },
    {
        "name": "import",
        "description": "ES6 style import",
        "template": "import {{2:name}} from '{{1:path}}';{{}}"
    },
    {
        "name": "importr",
        "description": "CommonJs Style Import",
        "template": "import {{1:name}} = require('{{2:path}}');{{}}"
    },
    {
        "name": "interface",
        "description": "Create a new interface",
        "template": "interface {{1:Name}} {\n\t{{}}\n}"
    },
    {
        "name": "class",
        "description": "Create a new class",
        "template": "class {{1:Name}} {\n\t{{}}\n}"
    },
    {
        "name": "namespace",
        "description": "Create a new namespace",
        "template": "namespace {{1:Name}} {\n\t{{}}\n}"
    },
    {
        "name": "do", "description": "do while statement", "template": "do {\n\t{{}}\n} while ({{condition}});"
    },
    {
        "name": "switch",
        "description": "switch case statement",
        "template": "switch ({{key}}) {\n\tcase {{value}}:\n\t\t{{}}\n\t\tbreak;\n\n\tdefault:\n\t\tbreak;\n}"
    },
    {
        "name": "if",
        "description": "if statement",
        "template": "if ({{condition}}) {\n\t{{}}\n}"
    },
    {
        "name": "ifelse",
        "description": "if else statement",
        "template": "if ({{condition}}) {\n\t{{}}\n} else {\n\t\n}"
    },
    {
        "name": "elseif",
        "description": "else if block",
        "template": "else if ({{condition}}) {\n\t{{}}\n}"
    },
    {
        "name": "else",
        "description": "else block",
        "template": "else {\n\t{{}}\n}"
    },
    {
        "name": "try",
        "description": "try catch block",
        "template": "try {\n\t{{}}\n} catch (e) {\n\t// {{todo}}: handle exception\n}"
    },
    {
        "name": "catch",
        "description": "catch block",
        "template": "catch (e) {\n\t{{}}// {{todo}}: handle exception\n}"
    },
    {
        "name": "function",
        "description": "function",
        "template": "function {{}}({{}}) {\n\t{{}}\n}"
    },
    {
        "name": "new",
        "description": "create new object",
        "template": "var {{name}} = new {{type}}({{arguments}});"
    },
    {
        "name": "lazy",
        "description": "lazy creation",
        "template": "if ({{var}} == null) {\n\t{{var}} = new {{type}}({{arguments}});\n\t{{}}\n}\n\nreturn {{var}};"
    },
    {
        "name": "while",
        "description": "while loop with condition",
        "template": "while ({{condition}}) {\n\t{{}}\n}"
    },
    {
        "name": "log",
        "description": "console.log()",
        template: "console.log({{}})",
    },
    {
        name: 'exhaustive',
        description: 'Exhaustive check for discriminated union',
        template: 'const _exhaustiveCheck: never = {{}};'
    },
    {
        "name": "@author", "description": "author name", "template": "@author {{user}}"
    },
    {
        name: 'ctor',
        description: 'constructor',
        template:[
			"constructor() {",
			"\t{{}}",
			"}"
		].join('\n'),
    },
    {
        name: 'constructor',
        description: 'constructor',
        template:[
			"constructor() {",
			"\t{{}}",
			"}"
		].join('\n'),
    },

    /**
     * Snippets for common imports
     */
     /** React */
     {
         name: 'react',
         description: 'import React',
         template: "import * as React from 'react';"
     },
     {
         name: 'reactdom',
         description: 'import ReactDOM',
         template: "import * as ReactDOM from 'react-dom';"
     },
     {
         name: 'reactdomserver',
         description: 'import ReactDOMServer',
         template: "import * as ReactDOMServer from 'react-dom/server';"
     }
];
