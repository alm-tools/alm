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
'use strict';

import Parser = require('../jsonParser');
import SchemaService = require('./jsonSchemaService');
import JsonSchema = require('../jsonSchema');
import {localize} from "../localize";
type Thenable<T> = Promise<T>;

/**
 * Register our schemas
 * Mostly downloaded from http://json.schemastore.org/
 */
const schemas: { fileName: string, content: JsonSchema.IJSONSchema }[] = [
    {
        fileName: 'tsconfig.json',
        content: require('./schemas/tsconfig.json')
    }
];
schemas.forEach(config => {
    SchemaService.resolveSchemaContent(config.content);
});


/**
 * BAS: My functions
 */
import {Types}  from "../../../../../socket/socketContract";
import * as utils from "../../../../../common/utils";
import * as fmc from "../../../../disk/fileModelCache";
export function getCompletionsAtPosition(query: Types.GetCompletionsAtPositionQuery): Promise<Types.GetCompletionsAtPositionResponse> {
    const {filePath, prefix} = query;
    const completionsToReturn: Types.Completion[] = [];
    const endsInPunctuation = utils.prefixEndsInPunctuation(prefix);
    const rawSchema = schemas[0].content;

    const contents = fmc.getOrCreateOpenFile(filePath).getContents();
    const doc = Parser.parse(contents);

    if (!doc.errors.length) {
        doc.validate(rawSchema);
        console.log('Schema Validation:',doc.errors,doc.warnings);
    }
    else {
        console.log('Parse Errors:', doc.errors);
    }

    return utils.resolve({
        completions: completionsToReturn,
        endsInPunctuation: endsInPunctuation
    });
}
