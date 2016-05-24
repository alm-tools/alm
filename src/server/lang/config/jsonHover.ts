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

import * as utils from "../../../common/utils";
export function getQuickInfo(query: { filePath: string, position: number }): Promise<{ comment: string }> {
    const comment = '';
    return utils.resolve({ comment })
}
