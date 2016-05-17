/**
 * Draws the icon for a type
 *
 * The TypeDoc icons a pretty expansive 🌹 with a few ideas that I disagree with / or think are too difficult.
 * E.g the type `event`. The "grey" coloring of the global functions.
 *
 * Here is the design language I am going for:
 *
 * We have Globals (same for Namespaces) and some stuff (variable, function, function with type) in global (all color purple)
 * Interfaces are Green (same for type aliases)
 * Enums + enum members have a custom stack icon
 * Class stuff is blue
 *
 *
 */
export enum IconType {
    Namespace, // same for module / global
}

/**
 * This maps into the iconTypes.svg [x,y]
 *
 * (0,0)-------x
 * |
 * |
 * y
 *
 */
const iconLocations = {
    [IconType.Namespace]: { x: 0, y: 6 },

}
const _typeIconLocations: { [key: number]: { x: number, y: number } } = iconLocations;

import * as ui from "../ui";
import * as React from "react";
import * as pure from "../../common/pure";
import * as csx from "csx";

interface Props {
    iconType: IconType
}
interface State {

}

namespace TypeIconStyles {
    export const spriteSize = 17; // px

    export const root = {
        width: `${spriteSize}px`,
        height: `${spriteSize}px`,
        display: 'inline-block',
        overflow: 'hidden',
        position: 'relative'
    }
}

export class TypeIcon extends ui.BaseComponent<Props, State>{
    shouldComponentUpdate = pure.shouldComponentUpdate;
    render() {
        const imageLocation = iconLocations[this.props.iconType];
        const [left,top] = [imageLocation.x * -TypeIconStyles.spriteSize, imageLocation.y * -TypeIconStyles.spriteSize]
        return <div style={TypeIconStyles.root}>
            <img src="assets/typeIcons.svg" style={{top,left, position:'relative'}}/>
        </div>
    }
}
