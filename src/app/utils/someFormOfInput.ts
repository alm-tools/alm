/**
 * Returns true if the element is some form of input.
 * There are certain browser actions you don't want to happen if the element is not an input
 */

export function someFormOfInput(element: any) {
    if (!element.tagName) {
        return false;
    }
    const tagName = element.tagName.toUpperCase();
    if (
        (tagName === 'INPUT'
            && (
                element.type.toUpperCase() === 'TEXT' ||
                element.type.toUpperCase() === 'PASSWORD' ||
                element.type.toUpperCase() === 'FILE' ||
                element.type.toUpperCase() === 'SEARCH' ||
                element.type.toUpperCase() === 'EMAIL' ||
                element.type.toUpperCase() === 'NUMBER' ||
                element.type.toUpperCase() === 'DATE')
            )
        || (
            tagName === 'TEXTAREA'
        )
    ){
        return !element.readOnly && !element.disabled;
    }
    else {
        return false;
    }
}
