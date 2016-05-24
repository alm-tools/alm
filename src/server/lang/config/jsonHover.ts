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
 */
import Parser = require('./json/jsonParser');

const packageJsonDependenciesSections = [
    'dependencies',
    'devDependencies',
    'optionalDependencies',
    'peerDependencies',
]

import * as utils from "../../../common/utils";
import * as fmc from "../../disk/fileModelCache";
import {Types} from "../../../socket/socketContract";
export function getQuickInfo(query: { filePath: string, position: number }): Promise<Types.QuickInfoResponse> {
    const response: Types.QuickInfoResponse = {
        valid: false,
        info: {
            name: null,
            comment: null,
        },
        errors: null
    }

    const {filePath} = query;
    const fileName = utils.getFileName(filePath).toLowerCase();
    const offset = query.position;

    const contents = fmc.getOrCreateOpenFile(filePath).getContents();
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
                /** TODO: return this promise */
                getInfo(pack).then(infos => {
                    const comments = [];
                    infos.forEach(info => {
                        /** TODO: Use this */
                        comments.push(`Latest version ${info}`);
                    });
                    /** TODO: Use this */
                    return comments;
                });
            }
        }
    }

    return utils.resolve(response)
}

function getInfo(pack: string): Promise<string[]> {
        const result = [];
        return utils.resolve(result);
        /** TODO: make the XHR */
		// let queryUrl = 'http://registry.npmjs.org/' + encodeURIComponent(pack) + '/latest';
        //
		// return this.xhr({
		// 	url : queryUrl
		// }).then((success) => {
		// 	try {
		// 		let obj = JSON.parse(success.responseText);
		// 		if (obj) {
		// 			let result = [];
		// 			if (obj.description) {
		// 				result.push(obj.description);
		// 			}
		// 			if (obj.version) {
		// 				result.push(localize('json.npm.version.hover', 'Latest version: {0}', obj.version));
		// 			}
		// 			return result;
		// 		}
		// 	} catch (e) {
		// 		// ignore
		// 	}
		// 	return [];
		// }, (error) => {
		// 	return [];
		// });
}
