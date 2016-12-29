import React = require("react");
import * as csx from '../base/csx';
import { BaseComponent } from "../ui";
import * as ui from "../ui";
import * as typestyle from "typestyle";

export interface Props {
    text: string;
}
export interface State {

}

let buttonClassName = typestyle.style({
    height: '18px',
    padding: '2px 3px',
    display: 'inline-flex',
    cursor: 'pointer',
    backgroundImage: 'linear-gradient(#7B7B7B, #353434)',
    border: '1px solid #464646',
    borderRadius: '3px',
    userSelect: 'none',
    outline: '0px',

    $nest: {
        '&:active': {
            backgroundImage: 'linear-gradient(#353434, #7B7B7B)',
        }
    }
});

let clippy = {
    width: '12px',
    height: '12px'
}

export class Clipboard extends BaseComponent<Props, State>{
    render() {
        return (
            <button className={buttonClassName} style={csx.extend(csx.center)} data-clipboard-text={this.props.text} onClick={(event) => event.stopPropagation() || ui.notifyInfoQuickDisappear("Copied")}>
                <img src="assets/clippy.svg" style={clippy} />
            </button>
        );
    }
}
