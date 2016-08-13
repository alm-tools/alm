/**
 * Maintains a single stylesheet to insert CSS classes for stuff like
 * - animation
 * - media queries
 */

import * as FreeStyle from "free-style";
import * as React from "react";

/** For nodejs testing mock out requestAnimationFrame */
if (typeof requestAnimationFrame === 'undefined') {
  (global as any).requestAnimationFrame = (cb)=>cb();
}

/** Just for autocomplete convinience */
export interface CSSProperties extends React.CSSProperties {
  '&:hover'?: React.CSSProperties;
}

/**
 * We have a single stylesheet that we update as components register themselves
 */
const freeStyle = FreeStyle.create();
const singletonStyle = typeof window === 'undefined' ? { innerHTML: '' } : document.createElement('style');
if (typeof document !== 'undefined') document.head.appendChild(singletonStyle as any);
const styleUpdated = () => requestAnimationFrame(() => {
  singletonStyle.innerHTML = freeStyle.getStyles();
});

/**
 * Allows use to use the stylesheet in a node.js environment
 */
export const getRawStyles = () => freeStyle.getStyles();

/**
 * Takes CSSProperties and return a generated className you can use on your component
 */
export function style(...objects: CSSProperties[]) {
  const object = extend(...objects);
  const className = freeStyle.registerStyle(object);
  styleUpdated();
  return className;
}

/**
 * Takes Keyframes and returns a generated animation name
 */
export function keyframes(frames: {
  [key /** stuff like `from`, `to` or `10%` etc*/: string]: CSSProperties
}) {
  const animationName = freeStyle.registerKeyframes(frames);
  styleUpdated();
  return animationName;
}

/**
 * Merges various styles into a single style object.
 * Note: if two objects have the same property the last one wins
 */
export function extend(...objects: CSSProperties[]): CSSProperties{
  /** The final result we will return */
  const result: CSSProperties = {};
  for (const object of objects) {
    for (const key in object) {
      if (
        // Some psuedo state or media query
        (key.indexOf('&:') === 0 || key.indexOf('@media') === 0)
        // And we already have something for this key
        && result[key]
      ) {
        // Then extend in the final result
        result[key] = extend(result[key], object);
      }
      // Otherwise just copy to output
      else {
        result[key] = object[key];
      }
    }
  }
  return result;
}

/**
 * Returns a class name that has `normal` (>breakWidth) and `small`(<=breakWidth) styles
 * based on media query.
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
