// Type definitions for chrome only apis
// Project: http://google.com/chrome
// Definitions by: basarat <https://github.com/basarat/>
// Definitions: https://github.com/borisyankov/DefinitelyTyped


interface Element {
    /**
     * https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoViewIfNeeded
     * the element is centered if center is true (default), otherwise it stays to the nearest edge.
     */
    scrollIntoViewIfNeeded(center?: boolean): void;
}
