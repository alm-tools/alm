/**
 * Just a simple abastraction over FreeStyle to handle styles in a single stylesheet.
 * Basically does debouncing + provide some neat APIs
 */

/** Imports */
import * as FreeStyle from "free-style";
import {debounce, extend} from "../../common/utils";

/** Just for autocomplete convinience */
import * as React from "react";
export interface CSSProperties extends React.CSSProperties {
    '&:hover'?: React.CSSProperties;
}

const freeStyle = FreeStyle.create();
const singletonStyle = document.createElement('style');
document.head.appendChild(singletonStyle)
const styleUpdated = debounce(() => {
    singletonStyle.innerHTML = freeStyle.getStyles();
}, 100);


/**
 * Returns a class name that has `normal` and `small` rules based on media query driven by minWidth
 */
export function getMediaClassName(config: {
    breakWidth: number;
    normal: CSSProperties;
    small: CSSProperties;
}): string {
    const result = freeStyle
        .registerStyle(
        extend(config.normal,
            {
                [`@media (max-width: ${config.breakWidth}px)`]: config.small
            }));
    styleUpdated();
    return result;
}


export function style(object: CSSProperties) {
    const result = freeStyle.registerStyle(object);
    styleUpdated();
    return result;
}
