/**
 * Based on https://github.com/Microsoft/vscode/blob/master/extensions/json/server/src/jsonCompletion.ts
 *
 * But with our types etc.
 *
 * I deleted stuff around `jsonContributions` (I have no idea what it is)
 */

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as utils from "../../../../../common/utils";
import Parser = require('../jsonParser');
import SchemaService = require('./jsonSchemaService');
import JsonSchema = require('../jsonSchema');
import {localize} from "../localize";
type Thenable<T> = Promise<T>;

/**
 * Register our schemas
 * Mostly downloaded from http://json.schemastore.org/
 *
 * New additions need to
 * - Download and put in schemas
 * - Update utils.ts for "supportedConfigFileNames"
 */
const schemas: { fileName: string, content: JsonSchema.IJSONSchema }[] = [];
Object.keys(utils.supportedAutocompleteConfigFileNames).forEach(fileName => {
    const rawContent = require(`./schemas/${fileName}`);
    SchemaService.resolveSchemaContent(rawContent); // Mutates it in place
    schemas.push({
        fileName,
        content: rawContent
    });
});

/**
 * BAS: My functions
 */
import {Types}  from "../../../../../socket/socketContract";
import * as fmc from "../../../../disk/fileModelCache";
import fuzzaldrin = require('fuzzaldrin');
export function getCompletionsAtPosition(this:{}, query: Types.GetCompletionsAtPositionQuery): Promise<Types.GetCompletionsAtPositionResponse> {
    const {filePath, prefix} = query;
    const fileName = utils.getFileName(filePath).toLowerCase();
    const offset = query.position;
    let completionsToReturn: Types.Completion[] = [];
    const endsInPunctuation = utils.prefixEndsInPunctuation(prefix);
    const schema = schemas.find(s=>s.fileName === fileName).content;

    const contents = fmc.getOrCreateOpenFile(filePath).getContents();
    const doc = Parser.parse(contents);

    // TODO: validation :)
    if (!doc.errors.length) {
        doc.validate(schema);
        // console.log('Schema Validation:',doc.errors,doc.warnings);
    }
    else {
        // console.log('Parse Errors:', doc.errors);
    }

    // TODO: autocomplete :)
    let node = doc.getNodeFromOffsetEndInclusive(offset);

    /**
     * Collects suggestions
     */
    let proposed: { [key: string]: boolean } = {};
    let collector: ISuggestionsCollector = {
        add: (suggestion: CompletionItem) => {
            if (!proposed[suggestion.label]) {
                proposed[suggestion.label] = true;

                if (
                    (!suggestion.insertText || !suggestion.insertText.match(/\{\{/g))) {
                    let kind = ts.ScriptElementKind.unknown;
                    switch (suggestion.kind) {
                        case CompletionItemKind.Snippet:
                            kind = ts.ScriptElementKind.unknown;
                            break;
                        case CompletionItemKind.Text:
                            kind = ts.ScriptElementKind.unknown;
                            break;
                        case CompletionItemKind.Module:
                            kind = ts.ScriptElementKind.moduleElement;
                            break;
                        case CompletionItemKind.Property:
                            kind = ts.ScriptElementKind.memberVariableElement;
                            break;
                        case CompletionItemKind.Value:
                            kind = ts.ScriptElementKind.memberVariableElement;
                            break;
                    }
                    completionsToReturn.push({
                        kind,
                        name: `${suggestion.label}`,
                        display: '',
                        comment: suggestion.documentation
                    });
                }
                else {
                    let template = suggestion.insertText;
                    /** Replace `{{}}` with `${}` */
                    template = template.replace(/\{\{/g,"${");
                    template = template.replace(/\}\}/g,"}");

                    completionsToReturn.push({
                        kind: "snippet",
                        name: suggestion.label, // Needed for fuzzaldrin
                        snippet: {
                            name: suggestion.label,
                            description: suggestion.documentation,
                            template,
                        }
                    });
                }
            }
        },
        setAsIncomplete: () => {
        },
        error: (message: string) => {
            console.error(message);
        },
        log: (message: string) => {
            console.log(message);
        }
    };

    /**
     * Start the collection. Copied from `doSuggest` in the original file
     */
    (function() {
        let addValue = true;
        let currentKey = '';
        let currentProperty: Parser.PropertyASTNode = null;
        if (node) {
            if (node.type === 'string') {
                let stringNode = <Parser.StringASTNode>node;
                if (stringNode.isKey) {
                    addValue = !(node.parent && ((<Parser.PropertyASTNode>node.parent).value));
                    currentKey = contents.substring(node.start + 1, node.end - 1);
                    currentProperty = node.parent ? <Parser.PropertyASTNode>node.parent : null;
                    if (node.parent) {
                        node = node.parent.parent;
                    }
                }
            }
        }

        // proposals for properties
        if (node && node.type === 'object') {
            // don't suggest keys when the cursor is just before the opening curly brace
            if (node.start === offset) {
                return;
            }
            // don't suggest properties that are already present
            let properties = (<Parser.ObjectASTNode>node).properties;
            properties.forEach(p => {
                if (!currentProperty || currentProperty !== p) {
                    proposed[p.key.value] = true;
                }
            });

            let isLast = properties.length === 0 || offset >= properties[properties.length - 1].start;
            getPropertySuggestions(schema, doc, node, addValue, isLast, collector);

            let location = node.getNodeLocation();
        }

        // proposals for values
        if (node && (node.type === 'string' || node.type === 'number' || node.type === 'boolean' || node.type === 'null')) {
            node = node.parent;
        }

        // value proposals with schema
        getValueSuggestions(schema, doc, node, offset, collector);
    })();


    /**
     * Finally filter and return
     */

    if (prefix.length && prefix.trim().length && !endsInPunctuation) {
        // Didn't work good for punctuation
        completionsToReturn = fuzzaldrin.filter(completionsToReturn, prefix.trim(), { key: 'name' });
    }

    return utils.resolve({
        completions: completionsToReturn,
        endsInPunctuation: endsInPunctuation
    });
}

/**
 * ////////////////////////////////////////////////////////////////////
 * Everything below is just copy pasted from the original code
 * ////////////////////////////////////////////////////////////////////
 */

/**
 *
 *
 *
 *  Value suggestion stuff
 *
 *
 */

function getValueSuggestions(schema: JsonSchema.IJSONSchema, doc: Parser.JSONDocument, node: Parser.ASTNode, offset: number, collector: ISuggestionsCollector): void {

    if (!node) {
        addDefaultSuggestion(schema, collector);
    } else {
        let parentKey: string = null;
        if (node && (node.type === 'property') && offset > (<Parser.PropertyASTNode>node).colonOffset) {
            let valueNode = (<Parser.PropertyASTNode>node).value;
            if (valueNode && offset > valueNode.end) {
                return; // we are past the value node
            }
            parentKey = (<Parser.PropertyASTNode>node).key.value;
            node = node.parent;
        }
        if (node && (parentKey !== null || node.type === 'array')) {
            let matchingSchemas: Parser.IApplicableSchema[] = [];
            doc.validate(schema, matchingSchemas, node.start);

            matchingSchemas.forEach((s) => {
                if (s.node === node && !s.inverted && s.schema) {
                    if (s.schema.items) {
                        addDefaultSuggestion(s.schema.items, collector);
                        addEnumSuggestion(s.schema.items, collector);
                    }
                    if (s.schema.properties) {
                        let propertySchema = s.schema.properties[parentKey];
                        if (propertySchema) {
                            addDefaultSuggestion(propertySchema, collector);
                            addEnumSuggestion(propertySchema, collector);
                        }
                    }
                }
            });

        }
    }
}

function addDefaultSuggestion(schema: JsonSchema.IJSONSchema, collector: ISuggestionsCollector): void {
    if (schema.default) {
        collector.add({
            kind: getSuggestionKind(schema.type),
            label: getLabelForValue(schema.default),
            insertText: getTextForValue(schema.default),
            detail: localize('json.suggest.default', 'Default value'),
        });
    }
    if (Array.isArray(schema.defaultSnippets)) {
        schema.defaultSnippets.forEach(s => {
            collector.add({
                kind: CompletionItemKind.Snippet,
                label: getLabelForSnippetValue(s.body),
                insertText: getTextForSnippetValue(s.body)
            });
        });
    }

    if (Array.isArray(schema.allOf)) {
        schema.allOf.forEach((s) => addDefaultSuggestion(s, collector));
    }
    if (Array.isArray(schema.anyOf)) {
        schema.anyOf.forEach((s) => addDefaultSuggestion(s, collector));
    }
    if (Array.isArray(schema.oneOf)) {
        schema.oneOf.forEach((s) => addDefaultSuggestion(s, collector));
    }
}

function getSuggestionKind(type: any): CompletionItemKind {
    if (Array.isArray(type)) {
        let array = <any[]>type;
        type = array.length > 0 ? array[0] : null;
    }
    if (!type) {
        return CompletionItemKind.Text;
    }
    switch (type) {
        case 'string': return CompletionItemKind.Text;
        case 'object': return CompletionItemKind.Module;
        case 'property': return CompletionItemKind.Property;
        default: return CompletionItemKind.Value;
    }
}

function getLabelForValue(value: any): string {
    let label = JSON.stringify(value);
    if (label.length > 57) {
        return label.substr(0, 57).trim() + '...';
    }
    return label;
}

function getLabelForSnippetValue(value: any): string {
    let label = JSON.stringify(value);
    label = label.replace(/\{\{|\}\}/g, '');
    if (label.length > 57) {
        return label.substr(0, 57).trim() + '...';
    }
    return label;
}

function getTextForSnippetValue(value: any): string {
    return JSON.stringify(value, null, '\t');
}

function addEnumSuggestion(schema: JsonSchema.IJSONSchema, collector: ISuggestionsCollector): void {
    if (Array.isArray(schema.enum)) {
        schema.enum.forEach((enm) => collector.add({ kind: getSuggestionKind(schema.type), label: getLabelForValue(enm), insertText: getTextForValue(enm), documentation: '' }));
    } else {
        if (isType(schema, 'boolean')) {
            addBooleanSuggestion(true, collector);
            addBooleanSuggestion(false, collector);
        }
        if (isType(schema, 'null')) {
            addNullSuggestion(collector);
        }
    }
    if (Array.isArray(schema.allOf)) {
        schema.allOf.forEach((s) => addEnumSuggestion(s, collector));
    }
    if (Array.isArray(schema.anyOf)) {
        schema.anyOf.forEach((s) => addEnumSuggestion(s, collector));
    }
    if (Array.isArray(schema.oneOf)) {
        schema.oneOf.forEach((s) => addEnumSuggestion(s, collector));
    }
}

function isType(schema: JsonSchema.IJSONSchema, type: string) {
    if (Array.isArray(schema.type)) {
        return schema.type.indexOf(type) !== -1;
    }
    return schema.type === type;
}

function addBooleanSuggestion(value: boolean, collector: ISuggestionsCollector): void {
    collector.add({ kind: getSuggestionKind('boolean'), label: value ? 'true' : 'false', insertText: getTextForValue(value), documentation: '' });
}

function addNullSuggestion(collector: ISuggestionsCollector): void {
    collector.add({ kind: getSuggestionKind('null'), label: 'null', insertText: 'null', documentation: '' });
}

/**
 *
 *
 *
 *   Property suggestion stuff
 *
 *
 *
 */
function getPropertySuggestions(schema: JsonSchema.IJSONSchema, doc: Parser.JSONDocument, node: Parser.ASTNode, addValue: boolean, isLast: boolean, collector: ISuggestionsCollector): void {
    let matchingSchemas: Parser.IApplicableSchema[] = [];
    doc.validate(schema, matchingSchemas, node.start);

    matchingSchemas.forEach((s) => {
        if (s.node === node && !s.inverted) {
            let schemaProperties = s.schema.properties;
            if (schemaProperties) {
                Object.keys(schemaProperties).forEach((key: string) => {
                    let propertySchema = schemaProperties[key];
                    collector.add({ kind: CompletionItemKind.Property, label: key, insertText: getTextForProperty(key, propertySchema, addValue, isLast), documentation: propertySchema.description || '' });
                });
            }
        }
    });
}

function getTextForProperty(key: string, propertySchema: JsonSchema.IJSONSchema, addValue: boolean, isLast: boolean): string {

    let result = getTextForValue(key);
    if (!addValue) {
        return result;
    }
    result += ': ';

    if (propertySchema) {
        let defaultVal = propertySchema.default;
        if (typeof defaultVal !== 'undefined') {
            result = result + getTextForEnumValue(defaultVal);
        } else if (propertySchema.enum && propertySchema.enum.length > 0) {
            result = result + getTextForEnumValue(propertySchema.enum[0]);
        } else {
            var type = Array.isArray(propertySchema.type) ? propertySchema.type[0] : propertySchema.type;
            switch (type) {
                case 'boolean':
                    result += '{{true}}';
                    break;
                case 'string':
                    result += '"{{}}"';
                    break;
                case 'object':
                    result += '{\n\t{{}}\n}';
                    break;
                case 'array':
                    result += '[\n\t{{}}\n]';
                    break;
                case 'number':
                    result += '{{0}}';
                    break;
                case 'null':
                    result += '{{null}}';
                    break;
                default:
                    return result;
            }
        }
    } else {
        result += '{{0}}';
    }
    if (!isLast) {
        result += ',';
    }
    return result;
}

function getTextForValue(value: any): string {
    var text = JSON.stringify(value, null, '\t');
    text = text.replace(/[\\\{\}]/g, '\\$&');
    return text;
}

function getTextForEnumValue(value: any): string {
    let snippet = getTextForValue(value);
    switch (typeof value) {
        case 'object':
            if (value === null) {
                return '{{null}}';
            }
            return snippet;
        case 'string':
            return '"{{' + snippet.substr(1, snippet.length - 2) + '}}"';
        case 'number':
        case 'boolean':
            return '{{' + snippet + '}}';
    }
    return snippet;
}

// TODO: repurpose for us
import {CompletionItem, CompletionItemKind} from "./vscode-types";
export interface ISuggestionsCollector {
    add(suggestion: CompletionItem): void;
    error(message: string): void;
    log(message: string): void;
    setAsIncomplete(): void;
}
