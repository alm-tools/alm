/**
 * Had a look at https://github.com/Microsoft/vscode/blob/6e8f6596175fda10b69ee9ba33caf45b5ad7e579/extensions/javascript/src/features/packageJSONContribution.ts#L206
 *
 * To figure out how to get this.
 *
 * Basically the `jsonc-parser` is really handy:
 *
 * ```ts
 * const doc = Parser.parse(contents);
 * let node = doc.getNodeFromOffsetEndInclusive(offset);
 * let location = node.getNodeLocation();
 * ```
 * Both `node` and `location` are extremely handy
 *
 * Also validation:
 *
 ```ts
 const doc = Parser.parse(contents);

 // TODO: validation :)
 if (!doc.errors.length) {
     doc.validate(schema);
     // console.log('Schema Validation:',doc.errors,doc.warnings);
 }
 else {
     // console.log('Parse Errors:', doc.errors);
 }
 ```
 *
 */
import Parser = require('./core/jsonParser');

const packageJsonDependenciesSections = [
    'dependencies',
    'devDependencies',
    'optionalDependencies',
    'peerDependencies',
]

import * as utils from "../../../../common/utils";
import {Types} from "../../../../socket/socketContract";

// TODO: mon : provide `editorPosition`
export function getQuickInfo(query: { filePath: string, position: number, contents: string }): Promise<Types.QuickInfoResponse> {
    const response: Types.QuickInfoResponse = {
        valid: false,
        info: {
            name: null,
            comment: null,
            range: null
        },
        errors: []
    }

    const {filePath} = query;
    const fileName = utils.getFileName(filePath).toLowerCase();
    const offset = query.position;

    const contents = query.contents;
    const doc = Parser.parse(contents);
    let node = doc.getNodeFromOffsetEndInclusive(offset);
    const location = node.getNodeLocation();

    /**
     * Provide intelligence based on file name
     */
    if (fileName === "package.json") {
        /** Provide latest version hint for depencencies */
        if (packageJsonDependenciesSections.some(section => location.matches([section, '*']))) {
            const path = location.getSegments(); // e.g. ["devDependencies", "mocha"]
            let pack = path[path.length - 1];
            if (typeof pack === 'string') {
                return getInfo(pack).then(res => {
                    if (!res.description && !res.version) return response;

                    response.valid = true;
                    const comments = [];
                    res.description && comments.push(res.description);
                    res.version && comments.push(`Latest version: ${res.version}`);
                    response.info = {
                        name: pack,
                        comment: comments.join('\n'),
                        range: null
                    }

                    return response;
                });
            }
        }
    }

    return utils.resolve(response)
}

import * as fetch from "node-fetch";
function getInfo(pack: string): Promise<{description?: string, version?: string}> {
    const queryUrl = 'http://registry.npmjs.org/' + encodeURIComponent(pack) + '/latest';

    return fetch(queryUrl)
        .then(function(response) {
            return response.json()
        })
        .then(function(obj) {
            let result: {
                description?: string,
                version?: string
            } = {};
            if (obj.description) {
                result.description = obj.description;
            }
            if (obj.version) {
                result.version = obj.version;
            }
            return result;
        })
        .catch((error) => {
            return {};
        });
}
