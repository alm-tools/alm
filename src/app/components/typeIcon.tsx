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
 * Places that need to be kept in sync:
 * - the location in type icons.svg
 * - the legend component
 * - the server responses
 */
export enum IconType {
    Namespace, // same for module / global
    Variable,
    Function,
    FunctionGeneric,

    Enum,
    EnumMember,

    Interface,
    InterfaceGeneric,
    InterfaceConstructor,
    InterfaceProperty,
    InterfaceMethod,
    InterfaceMethodGeneric,
    InterfaceIndexSignature,
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
    [IconType.Variable]: { x: 0, y: 1 },
    [IconType.Function]: { x: 8, y: 4 },
    [IconType.FunctionGeneric]: { x: 8, y: 5 },

    [IconType.Enum]: { x: 0, y: 7 },
    [IconType.EnumMember]: { x: 0, y: 8 },

    [IconType.Interface]: { x: 0, y: 4 },
    [IconType.InterfaceGeneric]: { x: 0, y: 5 },
    [IconType.InterfaceConstructor]: { x: 12, y: 6 },
    [IconType.InterfaceProperty]: { x: 12, y: 0 },
    [IconType.InterfaceMethod]: { x: 12, y: 4 },
    [IconType.InterfaceMethodGeneric]: { x: 12, y: 5 },
    [IconType.InterfaceIndexSignature]: { x: 12, y: 7 },
}
const _typeIconLocations: { [key: number]: { x: number, y: number } } = iconLocations;

import * as ui from "../ui";
import * as React from "react";
import * as pure from "../../common/pure";
import * as csx from "csx";
import * as styles from "../styles/styles";

interface Props {
    iconType: IconType
}
interface State {

}

namespace TypeIconStyles {
    export const spriteSize = 17; // px

    /** We want to eat a bit of the icon otherwise we get neighbours at certain scales */
    export const iconClipWidth = 1;

    export const root = {
        width: `${spriteSize - iconClipWidth}px`,
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
        const left = imageLocation.x * -TypeIconStyles.spriteSize - TypeIconStyles.iconClipWidth;
        const top = imageLocation.y * -TypeIconStyles.spriteSize;
        return <div style={TypeIconStyles.root}>
            <img src="assets/typeIcons.svg" style={{ top, left, position: 'relative' }}/>
        </div>
    }
}

namespace TypeIconLegendStyles {
    export const root = csx.extend(
        csx.horizontal,
        {
            fontWeight: 'bold',
            fontSize: '.6rem',
            color: styles.textColor,
        });
    export const legendColumn = csx.extend(
        csx.vertical,
        {
            padding: '10px'
        });
    export const legendItemRoot = csx.extend(
        {
            display: 'flex',
            alignItems: 'center',
            whiteSpace: 'pre'
        }
    )
}
export class TypeIconLegend extends ui.BaseComponent<{}, {}>{
    render() {
        return <div style={TypeIconLegendStyles.root}>
            <div style={TypeIconLegendStyles.legendColumn}>
                <div style={TypeIconLegendStyles.legendItemRoot}><TypeIcon iconType={IconType.Namespace}/> Namespace</div>
                <div style={TypeIconLegendStyles.legendItemRoot}><TypeIcon iconType={IconType.Variable}/> Variable</div>
                <div style={TypeIconLegendStyles.legendItemRoot}><TypeIcon iconType={IconType.Function}/> Function</div>
                <div style={TypeIconLegendStyles.legendItemRoot}><TypeIcon iconType={IconType.FunctionGeneric}/> Function Generic</div>

                <div style={{ height: TypeIconStyles.spriteSize + 'px' }}/>

                <div style={TypeIconLegendStyles.legendItemRoot}><TypeIcon iconType={IconType.Enum}/> Enum</div>
                <div style={TypeIconLegendStyles.legendItemRoot}><TypeIcon iconType={IconType.EnumMember}/> EnumMember</div>
            </div>
            <div style={TypeIconLegendStyles.legendColumn}>
                <div style={TypeIconLegendStyles.legendItemRoot}><TypeIcon iconType={IconType.Interface}/> Interface</div>
                <div style={TypeIconLegendStyles.legendItemRoot}><TypeIcon iconType={IconType.InterfaceGeneric}/> Interface Generic</div>
                <div style={TypeIconLegendStyles.legendItemRoot}><TypeIcon iconType={IconType.InterfaceConstructor}/> Interface Constructor</div>
                <div style={TypeIconLegendStyles.legendItemRoot}><TypeIcon iconType={IconType.InterfaceProperty}/> Interface Property</div>
                <div style={TypeIconLegendStyles.legendItemRoot}><TypeIcon iconType={IconType.InterfaceMethod}/> Interface Method</div>
                <div style={TypeIconLegendStyles.legendItemRoot}><TypeIcon iconType={IconType.InterfaceMethodGeneric}/> Interface Method Generic</div>
                <div style={TypeIconLegendStyles.legendItemRoot}><TypeIcon iconType={IconType.InterfaceIndexSignature}/> Interface Index Signature</div>
            </div>
        </div>
    }
}
