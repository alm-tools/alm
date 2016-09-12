import React = require("react");
import csx = require('../base/csx');
import {BaseComponent} from "../ui";
import * as ui from "../ui";
import * as pure from "../../common/pure";

export interface Props extends React.HTMLAttributes {
    name: string;
    size?: any; // 1g,2x,3x,4x,5x
    rotate?: string; // '45', '90', '135', '180', '225', '270', '315'
    flip?: string; // vertical,horizontal
    fixedWidth?: boolean;
    spin?: boolean;
    pulse?: boolean;
    stack?: string; // 1x, 2x
    inverse?: boolean;

    className?: string; // anything else you want
    style?: any;// any styles you want
}
export interface State {

}

export class Icon extends BaseComponent<Props, State>{
    shouldComponentUpdate = pure.shouldComponentUpdate;
    render() {
        let {
            name, size, rotate, flip, spin, fixedWidth, stack, inverse,
            pulse, className, style
        } = this.props;
        let props:any = this.props;
        let classNames = `fa fa-${name}`;
        if (size) {
            classNames = `${classNames} fa-${size}`;
        }
        if (rotate) {
            classNames = `${classNames} fa-rotate-${rotate}`;
        }
        if (flip) {
            classNames = `${classNames} fa-flip-${flip}`;
        }
        if (fixedWidth) {
            classNames = `${classNames} fa-fw`;
        }
        if (spin) {
            classNames = `${classNames} fa-spin`;
        }
        if (pulse) {
            classNames = `${classNames} fa-pulse`;
        }

        if (stack) {
            classNames = `${classNames} fa-stack-${stack}`;
        }
        if (inverse) {
            classNames = `${classNames} fa-inverse`;
        }
        if (className) {
            classNames = `${classNames} ${className}`;
        }

        return (
            <i className={classNames} style={style}></i>
        );
    }
}
