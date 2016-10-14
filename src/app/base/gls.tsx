/**
 * This is a level above CSX
 *  - It wraps up the CSX primitives into components
 */
import * as csx from './csx';
import { vendorPrefixed } from './csx';
import * as typestyle from 'typestyle';
import * as React from "react";


/** Creates a copy of an object without the mentioned keys */
function _objectWithoutProperties(obj: any, keys: string[]) {
  var target = {};
  for (var i in obj) {
    if (keys.indexOf(i) >= 0) continue;
    if (!Object.prototype.hasOwnProperty.call(obj, i)) continue;
    target[i] = obj[i];
  }
  return target;
}

declare global {
  interface Function {
    displayName?: string;
  }
}

/********
 *
 * Primitives
 *
 ********/

/**
* For that time you just need a visual vertical seperation
*/
export const SmallVerticalSpace = (props: { space?: number }) => {
  return <div style={{ height: props.space || 24 }}></div>;
}
SmallVerticalSpace.displayName = "SmallVerticalSpace";

/**
 * For that time you just need a visual horizontal seperation
 */
export const SmallHorizontalSpace = (props: { space?: number }) => {
  return <div style={{ width: props.space || 24, display: 'inline-block' }}></div>;
}
SmallVerticalSpace.displayName = "SmallHorizontalSpace";

interface PrimitiveProps extends React.HTMLProps<HTMLDivElement> { };

namespace ClassNames {
  export const content = typestyle.style(vendorPrefixed.content);
  export const flex = typestyle.style(vendorPrefixed.pass, vendorPrefixed.flex);
  export const flexScrollY = typestyle.style(vendorPrefixed.pass, vendorPrefixed.flex, vendorPrefixed.vertical, { overflowY: 'auto' });
  export const pass = typestyle.style(vendorPrefixed.pass);
  export const contentVertical = typestyle.style(vendorPrefixed.content, vendorPrefixed.vertical);
  export const contentVerticalCentered = typestyle.style(vendorPrefixed.content, vendorPrefixed.vertical, vendorPrefixed.center);
  export const contentHorizontal = typestyle.style(vendorPrefixed.content, vendorPrefixed.horizontal);
  export const contentHorizontalCentered = typestyle.style(vendorPrefixed.content, vendorPrefixed.horizontal, vendorPrefixed.center);
  export const flexVertical = typestyle.style(vendorPrefixed.flex, vendorPrefixed.vertical, { maxWidth: '100%' /*normalizing browser bugs*/ });
  export const flexHorizontal = typestyle.style(vendorPrefixed.flex, vendorPrefixed.horizontal);
}

/**
 * Generally prefer an inline block (as that will wrap).
 * Use this for critical `content` driven *vertical* height
 *
 * Takes as much space as it needs, no more, no less
 */
export const Content = (props: PrimitiveProps) => {
  const className = ClassNames.content + (props.className ? ` ${props.className}` : '');
  return (
    <div data-comment="Content" {...props} className={className}>
      {props.children}
    </div>
  );
};
Content.displayName = "Content";

/**
 * Takes as much space as it needs, no more, no less
 */
export const InlineBlock = (props: PrimitiveProps) => {
  const style = csx.extend({ display: 'inline-block' }, props.style || {});
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
  const className = ClassNames.flex + (props.className ? ` ${props.className}` : '');
  return (
    <div data-comment="Flex" {...props} className={className}>
      {props.children}
    </div>
  );
};
Flex.displayName = "Flex";

/**
 * Takes up all the parent space, no more, no less and scrolls the children in Y if needed
 */
export const FlexScrollY = (props: PrimitiveProps) => {
  const className = ClassNames.flexScrollY + (props.className ? ` ${props.className}` : '');
  return (
    <div data-comment="FlexScrollY" {...props} className={className}>
      {props.children}
    </div>
  );
};
FlexScrollY.displayName = "FlexScrollY";

/**
 * When you need a general purpose container. Use this instead of a `div`
 */
export const Pass = (props: PrimitiveProps) => {
  const className = ClassNames.pass + (props.className ? ` ${props.className}` : '');
  return (
    <div data-comment="Pass" {...props} className={className}>
      {props.children}
    </div>
  );
};
Pass.displayName = "Pass";

/**
 * Provides a Vertical Container. For the parent it behaves like content.
 */
export const ContentVertical = (props: PrimitiveProps) => {
  const className = ClassNames.contentVertical + (props.className ? ` ${props.className}` : '');
  return (
    <div data-comment="ContentVertical" {...props} className={className}>
      {props.children}
    </div>
  );
};
ContentVertical.displayName = "ContentVertical";

/**
 * Quite commonly need horizontally centered text
 */
export const ContentVerticalCentered = (props: PrimitiveProps) => {
  const className = ClassNames.contentVerticalCentered + (props.className ? ` ${props.className}` : '');
  return (
    <div data-comment="ContentVerticalCentered" {...props} className={className}>
      {props.children}
    </div>
  );
}
ContentVerticalCentered.displayName = "ContentVerticalCentered";

/**
 * Provides a Horizontal Container. For the parent it behaves like content.
 */
export const ContentHorizontal = (props: PrimitiveProps) => {
  const className = ClassNames.contentHorizontal + (props.className ? ` ${props.className}` : '');
  return (
    <div data-comment="ContentHorizontal" {...props} className={className}>
      {props.children}
    </div>
  );
};
ContentHorizontal.displayName = "ContentHorizontal";

/**
 * Provides a Horizontal Container and centers its children in the cross dimension
 */
export const ContentHorizontalCentered = (props: PrimitiveProps) => {
  const className = ClassNames.contentHorizontalCentered + (props.className ? ` ${props.className}` : '');
  return (
    <div data-comment="ContentHorizontalCentered" {...props} className={className}>
      {props.children}
    </div>
  );
};
ContentHorizontalCentered.displayName = "ContentHorizontalCentered";

/**
 * Provides a Vertical Container. For the parent it behaves like flex.
 */
export const FlexVertical = (props: PrimitiveProps) => {
  const className = ClassNames.flexVertical + (props.className ? ` ${props.className}` : '');
  return (
    <div data-comment="FlexVertical" {...props} className={className}>
      {props.children}
    </div>
  );
};
FlexVertical.displayName = "FlexVertical";

/**
 * Provides a Horizontal Container. For the parent it behaves like flex.
 */
export const FlexHorizontal = (props: PrimitiveProps) => {
  const className = ClassNames.flexHorizontal + (props.className ? ` ${props.className}` : '');
  return (
    <div data-comment="FlexHorizontal" {...props} className={className}>
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
export const ContentHorizontalFlexPadded = (props: PaddedProps) => {
  const {padding} = props;
  const otherProps = _objectWithoutProperties(props, ['padding', 'children']);

  const children = React.Children.toArray(props.children).filter(c => !!c);
  const last = children.length - 1;
  const itemPadding = (index: number) => {
    if (index == last) {
      return csx.Box.padding(0);
    }
    else {
      return csx.Box.padding(0, padding, 0, 0);
    }
  }

  return (
    <ContentHorizontal {...otherProps}>
      {
        children.map((child, i) => <Flex key={(child as any).key || i} style={itemPadding(i)}>{child}</Flex>)
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
export const FlexHorizontalFlexPadded = (props: PaddedProps) => {
  const {padding} = props;
  const otherProps = _objectWithoutProperties(props, ['padding', 'children']);

  const children = React.Children.toArray(props.children).filter(c => !!c);
  const last = children.length - 1;
  const itemPadding = (index: number) => {
    if (index == last) {
      return csx.Box.padding(0);
    }
    else {
      return csx.Box.padding(0, padding, 0, 0);
    }
  }

  return (
    <FlexHorizontal {...otherProps}>
      {
        children.map((child, i) => <Flex key={(child as any).key || i} style={itemPadding(i)}>{child}</Flex>)
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
export const ContentHorizontalContentPadded = (props: PaddedProps) => {
  const {padding} = props;
  const otherProps = _objectWithoutProperties(props, ['padding', 'children']);

  const children = React.Children.toArray(props.children).filter(c => !!c);
  const last = children.length - 1;
  const itemPadding = (index: number) => {
    if (index == last) {
      return csx.Box.padding(0);
    }
    else {
      return csx.Box.padding(0, padding, 0, 0);
    }
  }

  return (
    <ContentHorizontal {...otherProps}>
      {
        children.map((child, i) => <Content key={(child as any).key || i} style={itemPadding(i)}>{child}</Content>)
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
export const ContentVerticalContentPadded = (props: PaddedProps) => {
  const {padding} = props;
  const otherProps = _objectWithoutProperties(props, ['padding', 'children']);

  const children = React.Children.toArray(props.children).filter(c => !!c);
  const last = children.length - 1;
  const itemPadding = (index: number) => {
    if (index == last) {
      return csx.Box.padding(0);
    }
    else {
      return csx.Box.padding(0, 0, padding, 0);
    }
  }

  return (
    <ContentVertical {...otherProps}>
      {
        children.map((child, i) => <Content key={(child as any).key || i} style={itemPadding(i)}>{child}</Content>)
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
export const GridMargined = (props: GridMarginedProps) => {
  const {margin} = props;
  const otherProps = _objectWithoutProperties(props, ['margin', 'children']);
  const marginPx = `${margin}px`;

  const style = csx.extend(csx.wrap, { marginTop: '-' + marginPx, marginLeft: '-' + marginPx }, props.style || {});
  const children = React.Children.toArray(props.children).filter(c => !!c);
  return (
    <ContentHorizontal {...otherProps} style={style}>
      {
        children.map((child, i) => <Content key={(child as any).key || i} style={{ marginLeft: marginPx, marginTop: marginPx }}>{child}</Content>)
      }
    </ContentHorizontal>
  );
}
GridMargined.displayName = "GridMargined";
