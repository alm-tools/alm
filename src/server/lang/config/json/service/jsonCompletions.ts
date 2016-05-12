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
const schemas = [
    require('./schemas/tsconfig.json')
];
