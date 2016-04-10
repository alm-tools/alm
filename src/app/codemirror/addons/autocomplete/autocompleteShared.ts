/**
 * This file is mostly for sharing code between code and template(aka snippet) autocompletes
 */

/**
 * Exists to allow us to pass throught the `original` information around.
 * Code mirror insists on using `CodeMirror.Hint` so we use that
 * But then we put the good stuff in `original` and use it in `render` and `complete` and `move` etc
 */
import * as types from "../../../../common/types";
export interface ExtendedCodeMirrorHint extends CodeMirror.Hint {
    original?: types.Completion;
}

/**
 * A common shared render function
 */
import {kindToColor} from "../../../ui";
namespace AutocompleteStyles {
    /**
     * We have a rows of hints with each hint being
     * `left`      `main`        `right`
     * for type    for content   for docs
     */
    export const leftClassName = 'cm-hint left';
    export const mainClassName = 'cm-hint main';
    export const rightClassName = 'cm-hint right';
}
export function render(elt: HTMLLIElement, data: CodeMirror.Hints, cur: ExtendedCodeMirrorHint) {
    let original: types.Completion = cur.original;
    let [color, colorBackground] = [kindToColor(original.kind), kindToColor(original.kind, true)];

    elt.innerHTML = `
        <strong class="${AutocompleteStyles.leftClassName}" style="color:${color};background:${colorBackground}">${original.kind}</strong>
        <span class="${AutocompleteStyles.mainClassName}">${original.name}</span>
        <span class="${AutocompleteStyles.rightClassName}">${original.display}</span>
    `.replace(/\s+/g,' ');
}
