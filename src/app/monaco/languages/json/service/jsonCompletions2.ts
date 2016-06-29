/**
 * This file is just a simple wrapper around jsonCompmletion
 * - Instead of putting my logic there I chose to consume it in a manner that
 * allows us to potentailly extend it with more completions
 */
/** Imports */
import * as utils from "../../../../../common/utils";
import Parser = require('../core/jsonParser');
import SchemaService = require('./jsonSchemaService');
import JsonSchema = require('../core/jsonSchema');
import {localize} from "../core/localize";
type Thenable<T> = Promise<T>;

import {JSONCompletion} from "./jsonCompletions";
const jsoncompletion = new JSONCompletion();

/**
 * BAS: My functions
 */
import {Types}  from "../../../../../socket/socketContract";
import {schemas} from "./jsonSchemaService";
export function getCompletionsAtPosition(model: monaco.editor.IReadOnlyModel, position: monaco.Position) {
    const doc = Parser.parse(model.getValue());
    const normalCompletions = jsoncompletion.doComplete(model, position, doc);
    return normalCompletions;
}
