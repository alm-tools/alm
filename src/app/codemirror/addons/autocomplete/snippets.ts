/** Based on https://github.com/angelozerr/CodeMirror-XQuery/blob/master/codemirror-javascript/addon/hint/javascript/javascript-templates.js#L1 */

export interface TemplateConfig {
    name: string;
    description: string;

    /** A string version of the template. We parse this to TokenStream */
    template: string;

    /**
     * Function completion means that we do not each the preceeding `(` on completing
     * By default its false
     */
    functionCompletion?: boolean;
}

export interface TemplatesForContext {
    context: string;
    templates: TemplateConfig[];
}

export const defaultSnippets: TemplatesForContext[] = [
{
    context: "typescript",
    templates: [
        {
            "name": "for",
            "description": "iterate over array",
            "template": "for (let ${2:index} = 0; ${index} < ${1:array}.length; ${index}++) {\n\t${cursor}\n}"
        },
        {
            "name": "fort",
            "description": "iterate over array with temporary variable",
            "template": "for (let ${index} = 0; ${index} < ${array}.length; ${index}++) {\n\tconst ${array_element} = ${array}[${index}];\n\t${cursor}\n}"
        },
        {
            "name": "forin",
            "description": "iterate using for .. in",
            "template": "for (const ${iterable_element} in ${iterable}) {\n\t${cursor}\n}"
        },
        {
            "name": "forof",
            "description": "iterate using for .. of",
            "template": "for (const ${2:iterable_element} of ${1:iterable}) {\n\t${cursor}\n}"
        },
        {
            "name": "import",
            "description": "ES6 style import",
            "template": "import ${2:name} from '${1:path}';${cursor}"
        },
        {
            "name": "importr",
            "description": "CommonJs Style Import",
            "template": "import ${1:name} = require('${2:path}');${cursor}"
        },
        { "name": "do", "description": "do while statement", "template": "do {\n\t${cursor}\n} while (${condition});" },
        { "name": "switch", "description": "switch case statement", "template": "switch (${key}) {\n\tcase ${value}:\n\t\t${cursor}\n\t\tbreak;\n\n\tdefault:\n\t\tbreak;\n}" },
        { "name": "if", "description": "if statement", "template": "if (${condition}) {\n\t${cursor}\n}" },
        { "name": "ifelse", "description": "if else statement", "template": "if (${condition}) {\n\t${cursor}\n} else {\n\t\n}" },
        { "name": "elseif", "description": "else if block", "template": "else if (${condition}) {\n\t${cursor}\n}" },
        { "name": "else", "description": "else block", "template": "else {\n\t${cursor}\n}" },
        { "name": "try", "description": "try catch block", "template": "try {\n\t${cursor}\n} catch (e) {\n\t// ${todo}: handle exception\n}" },
        { "name": "catch", "description": "catch block", "template": "catch (e) {\n\t${cursor}// ${todo}: handle exception\n}" },
        { "name": "function", "description": "function", "template": "function ${name}(${}) {\n\t${cursor}\n}" },
        { "name": "functiona", "description": "anonymous function", "template": "function (${}) {\n\t${cursor}\n}" },
        { "name": "new", "description": "create new object", "template": "var ${name} = new ${type}(${arguments});" },
        { "name": "lazy", "description": "lazy creation", "template": "if (${name:var} == null) {\n\t${name} = new ${type}(${arguments});\n\t${cursor}\n}\n\nreturn ${name};" },
        { "name": "@author", "description": "author name", "template": "@author ${user}" },
        { "name": "while", "description": "while loop with condition", "template": "while (${condition}) {\n\t${cursor}\n}" }
    ]
}
];
