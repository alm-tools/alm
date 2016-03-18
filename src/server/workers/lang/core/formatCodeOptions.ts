/**
 * Maintainance:
 * When a new option is added add it to:
 * - the FormatCodeOptions interface
 * - the defaultFormatCodeOptions function
 * - the makeFormatCodeOptions function
 */

import os = require('os');

/// The following two interfaces come from typescript.d.ts but camelCased for JSON parsing
interface EditorOptions {
    indentSize: number;
    tabSize: number;
    newLineCharacter: string;
    convertTabsToSpaces: boolean;
}
export interface FormatCodeOptions extends EditorOptions {
    insertSpaceAfterCommaDelimiter: boolean;
    insertSpaceAfterSemicolonInForStatements: boolean;
    insertSpaceBeforeAndAfterBinaryOperators: boolean;
    insertSpaceAfterKeywordsInControlFlowStatements: boolean;
    insertSpaceAfterFunctionKeywordForAnonymousFunctions: boolean;
    insertSpaceAfterOpeningAndBeforeClosingNonemptyParenthesis: boolean;
    insertSpaceAfterOpeningAndBeforeClosingNonemptyBrackets: boolean;
    insertSpaceAfterOpeningAndBeforeClosingTemplateStringBraces: boolean;
    placeOpenBraceOnNewLineForFunctions: boolean;
    placeOpenBraceOnNewLineForControlBlocks: boolean;
}

export function defaultFormatCodeOptions(): ts.FormatCodeOptions {
    return {
        IndentSize: 4,
        TabSize: 4,
        NewLineCharacter: os.EOL,
        ConvertTabsToSpaces: true,
        IndentStyle: ts.IndentStyle.Smart,
        InsertSpaceAfterCommaDelimiter: true,
        InsertSpaceAfterSemicolonInForStatements: true,
        InsertSpaceBeforeAndAfterBinaryOperators: true,
        InsertSpaceAfterKeywordsInControlFlowStatements: true,
        InsertSpaceAfterFunctionKeywordForAnonymousFunctions: false,
        InsertSpaceAfterOpeningAndBeforeClosingNonemptyParenthesis: false,
        InsertSpaceAfterOpeningAndBeforeClosingNonemptyBrackets: false,
        InsertSpaceAfterOpeningAndBeforeClosingTemplateStringBraces: false,
        PlaceOpenBraceOnNewLineForFunctions: false,
        PlaceOpenBraceOnNewLineForControlBlocks: false,
    };
}

export function makeFormatCodeOptions(config: FormatCodeOptions): ts.FormatCodeOptions {
    var options = defaultFormatCodeOptions();
    if (!config) {
        return options;
    }
    if (typeof config.insertSpaceAfterCommaDelimiter === "boolean") {
        options.InsertSpaceAfterCommaDelimiter = config.insertSpaceAfterCommaDelimiter;
    }
    if (typeof config.insertSpaceAfterSemicolonInForStatements === "boolean") {
        options.InsertSpaceAfterSemicolonInForStatements = config.insertSpaceAfterSemicolonInForStatements;
    }
    if (typeof config.insertSpaceBeforeAndAfterBinaryOperators === "boolean") {
        options.InsertSpaceBeforeAndAfterBinaryOperators = config.insertSpaceBeforeAndAfterBinaryOperators;
    }
    if (typeof config.insertSpaceAfterKeywordsInControlFlowStatements === "boolean") {
        options.InsertSpaceAfterKeywordsInControlFlowStatements = config.insertSpaceAfterKeywordsInControlFlowStatements;
    }
    if (typeof config.insertSpaceAfterFunctionKeywordForAnonymousFunctions === "boolean") {
        options.InsertSpaceAfterFunctionKeywordForAnonymousFunctions = config.insertSpaceAfterFunctionKeywordForAnonymousFunctions;
    }
    if (typeof config.insertSpaceAfterOpeningAndBeforeClosingNonemptyParenthesis === "boolean") {
        options.InsertSpaceAfterOpeningAndBeforeClosingNonemptyParenthesis = config.insertSpaceAfterOpeningAndBeforeClosingNonemptyParenthesis;
    }
    if (typeof config.insertSpaceAfterOpeningAndBeforeClosingNonemptyBrackets === "boolean") {
        options.InsertSpaceAfterOpeningAndBeforeClosingNonemptyBrackets = config.insertSpaceAfterOpeningAndBeforeClosingNonemptyBrackets;
    }
    if (typeof config.insertSpaceAfterOpeningAndBeforeClosingTemplateStringBraces === "boolean") {
        options.InsertSpaceAfterOpeningAndBeforeClosingTemplateStringBraces = config.insertSpaceAfterOpeningAndBeforeClosingTemplateStringBraces;
    }
    if (typeof config.placeOpenBraceOnNewLineForFunctions === "boolean") {
        options.PlaceOpenBraceOnNewLineForFunctions = config.placeOpenBraceOnNewLineForFunctions;
    }
    if (typeof config.placeOpenBraceOnNewLineForControlBlocks === "boolean") {
        options.PlaceOpenBraceOnNewLineForControlBlocks = config.placeOpenBraceOnNewLineForControlBlocks;
    }
    if (typeof config.indentSize === "number") {
        options.IndentSize = config.indentSize;
    }
    if (typeof config.tabSize === "number") {
        options.TabSize = config.tabSize;
    }
    if (typeof config.newLineCharacter === "string") {
        options.NewLineCharacter = config.newLineCharacter;
    }
    if (typeof config.convertTabsToSpaces === "boolean") {
        options.ConvertTabsToSpaces = config.convertTabsToSpaces;
    }

    return options;
}
