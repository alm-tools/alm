/**
 * This is a level above CSX
 *  - It wraps up the CSX primitives into components
 */
import * as csx from "csx";
import * as React from "react";

/**
 * Having a `function.displayName` helps debug stateless function components
 */
declare global {
    interface Function {
        displayName: string;
    }
}


/********
 *
 * Primitives
 *
 ********/

export const SmallVerticalSpace = (props: {space?:number}) => {
    return <div style={{ height: props.space || 10}}></div>;
}
SmallVerticalSpace.displayName = "SmallVerticalSpace";

interface PrimitiveProps extends React.HTMLProps<HTMLDivElement>{};

/**
 * Generally prefer an inline block (as that will wrap).
 * Use this for critical `content` driven *vertical* height
 *
 * Takes as much space as it needs, no more, no less
 */
export const Content = (props: PrimitiveProps) => {
    const style = csx.extend(csx.content, props.style || {});
    return (
        <div data-comment="Content" {...props} style={style}>
            {props.children}
        </div>
    );
};
Content.displayName = "Content";

/**
 * Takes as much space as it needs, no more, no less
 */
export const InlineBlock = (props: PrimitiveProps) => {
    const style = csx.extend({display:'inline-block'},props.style || {});
    return (
        <div data-comment="InlineBlock" {...props} style={style}>
            {props.children}
        </div>
    );
};
InlineBlock.displayName = "InlineBlock";


/**
 * Takes up all the parent space, no more, no less
 */
export const Flex = (props: PrimitiveProps) => {
    const style = csx.extend(csx.pass, csx.flex, props.style || {});
    return (
        <div data-comment="Flex" {...props} style={style}>
            {props.children}
        </div>
    );
};
Flex.displayName = "Flex";

/**
 * Takes up all the parent space, no more, no less and scrolls the children in Y if needed
 */
export const FlexScrollY = (props: PrimitiveProps) => {
    const style = csx.extend(csx.pass, csx.flex, { overflowY: 'auto' }, props.style || {});
    return (
        <div data-comment="FlexScrollY" {...props} style={style}>
            {props.children}
        </div>
    );
};
FlexScrollY.displayName = "FlexScrollY";

/**
 * When you need a general purpose container. Use this instead of a `div`
 */
export const Pass = (props: PrimitiveProps) => {
    const style = csx.extend(csx.pass, props.style || {});
    return (
        <div data-comment="Pass" {...props} style={style}>
            {props.children}
        </div>
    );
};
Pass.displayName = "Pass";

/**
 * Provides a Vertical Container. For the parent it behaves like content.
 */
export const ContentVertical = (props: PrimitiveProps) => {
    const style = csx.extend(csx.content, csx.vertical, props.style || {});
    return (
        <div data-comment="ContentVertical" {...props} style={style}>
            {props.children}
        </div>
    );
};
ContentVertical.displayName = "ContentVertical";

/**
 * Provides a Horizontal Container. For the parent it behaves like content.
 */
export const ContentHorizontal = (props: PrimitiveProps) => {
    const style = csx.extend(csx.content, csx.horizontal, props.style || {});
    return (
        <div data-comment="ContentHorizontal" {...props} style={style}>
            {props.children}
        </div>
    );
};
ContentHorizontal.displayName = "ContentHorizontal";

/**
 * Provides a Vertical Container. For the parent it behaves like flex.
 */
export const FlexVertical = (props: PrimitiveProps) => {
    const style = csx.extend(csx.flex,csx.vertical,{maxWidth:'100%' /*normalizing browser bugs*/}, props.style || {});
    return (
        <div data-comment="FlexVertical" {...props} style={style}>
            {props.children}
        </div>
    );
};
FlexVertical.displayName = "FlexVertical";

/**
 * Provides a Horizontal Container. For the parent it behaves like flex.
 */
export const FlexHorizontal = (props: PrimitiveProps) => {
    const style = csx.extend(csx.flex, csx.horizontal, props.style || {});
    return (
        <div data-comment="FlexHorizontal" {...props} style={style}>
            {props.children}
        </div>
    );
};
FlexHorizontal.displayName = "FlexHorizontal";

/********
 *
 * Grid System
 *
 ********/
interface PaddedProps extends PrimitiveProps {
    padding: number | string;
}

/**
 * Lays out the children horizontally with
 * - ThisComponent: gets the overall Height (by max) of the children
 * - Children: get the Width : equally distributed from the parent Width
 * - Children: get the Height : sized by content
 * - ThisComponent: Puts a horizontal padding between each item
 */
export const ContentHorizontalFlexPadded = (props:PaddedProps) => {
    const basicPadding = props.padding;

    const children = React.Children.toArray(props.children).filter(c=>!!c);
    const last = children.length - 1;
    const itemPadding = (index: number) => {
        if (index == last) {
            return csx.Box.padding(0);
        }
        else {
            return csx.Box.padding(0, basicPadding, 0, 0);
        }
    }

    return (
        <ContentHorizontal {...props}>
            {
                children.map((child, i) => <Flex key={i} style={itemPadding(i)}>{child}</Flex>)
            }
        </ContentHorizontal>
    );
}
ContentHorizontalFlexPadded.displayName = "ContentHorizontalFlexPadded";

/**
 * Lays out the children horizontally with
 * - Parent: gets to chose the Width
 * - ThisComponent: gets the overall Height (by max) of the children
 * - Children: get the Width : equally distributed from the parent Width
 * - Children: get the Height : sized by content
 * - ThisComponent: Puts a horizontal padding between each item
 */
export const FlexHorizontalFlexPadded = (props:PaddedProps) => {
    const basicPadding = props.padding;

    const children = React.Children.toArray(props.children).filter(c=>!!c);
    const last = children.length - 1;
    const itemPadding = (index: number) => {
        if (index == last) {
            return csx.Box.padding(0);
        }
        else {
            return csx.Box.padding(0, basicPadding, 0, 0);
        }
    }

    return (
        <FlexHorizontal {...props}>
            {
                children.map((child, i) => <Flex key={i} style={itemPadding(i)}>{child}</Flex>)
            }
        </FlexHorizontal>
    );
}
FlexHorizontalFlexPadded.displayName = "FlexHorizontalFlexPadded";


/**
 * Lays out the children horizontally with
 * - Parent: gets to chose the Width
 * - ThisComponent: gets the overall Height (by max) of the children
 * - Children: get the Width : equally distributed from the parent Width
 * - Children: get the Height : sized by content
 * - ThisComponent: Puts a horizontal padding between each item
 */
export const ContentHorizontalContentPadded = (props:PaddedProps) => {
    const basicPadding = props.padding;

    const children = React.Children.toArray(props.children).filter(c=>!!c);
    const last = children.length - 1;
    const itemPadding = (index: number) => {
        if (index == last) {
            return csx.Box.padding(0);
        }
        else {
            return csx.Box.padding(0, basicPadding, 0, 0);
        }
    }

    return (
        <ContentHorizontal {...props}>
            {
                children.map((child, i) => <Content key={i} style={itemPadding(i)}>{child}</Content>)
            }
        </ContentHorizontal>
    );
}
ContentHorizontalContentPadded.displayName = "ContentHorizontalContentPadded";

/**
 * Lays out the children vertically with
 * - Parent: gets to chose the Width
 * - ThisComponent: gets the Height : (by sum) of the children
 * - Children: get the Width : parent
 * - Children: get the Height : sized by content
 * - ThisComponent: Puts a vertical padding between each item
 */
export const ContentVerticalContentPadded  = (props:PaddedProps) => {
    const basicPadding = props.padding;

    const children = React.Children.toArray(props.children).filter(c=>!!c);
    const last = children.length - 1;
    const itemPadding = (index: number) => {
        if (index == last) {
            return csx.Box.padding(0);
        }
        else {
            return csx.Box.padding(0, 0, basicPadding, 0);
        }
    }

    return (
        <ContentVertical {...props}>
            {
                children.map((child, i) => <Content key={i} style={itemPadding(i)}>{child}</Content>)
            }
        </ContentVertical>
    );
}
ContentVerticalContentPadded.displayName = "ContentVerticalContentPadded";

interface GridMarginedProps extends PrimitiveProps {
    margin: number | string;
}
/**
 * Lays out the children vertically with
 * - Parent: gets to chose the overall Width
 * - ThisComponent: gets the Height : (by sum) of the children
 * - Children: get the Width : sized by content
 * - Children: get the Height : sized by content
 * - ThisComponent: Puts a margin between each item.
 * - ThisComponent: Puts a negative margin on itself to offset the margins of the children (prevents them from leaking out)
 */
export const GridMargined  = (props:GridMarginedProps) => {
    const style = csx.extend(csx.wrap, { marginTop: '-' + props.margin, marginLeft: '-' + props.margin }, props.style || {});
    const children = React.Children.toArray(props.children).filter(c=>!!c);
    return (
        <ContentHorizontal {...props} style={style}>
            {
                children.map((child, i) => <Content key={i} style={{marginLeft:props.margin,marginTop:props.margin}}>{child}</Content>)
            }
        </ContentHorizontal>
    );
}
GridMargined.displayName = "GridMargined";
