import React = require("react");
import Radium = require('radium');
import csx = require('csx');
import {BaseComponent} from "./ui";
import * as ui from "./ui";

export interface Props extends React.Props<any> {
    text: string;
}
export interface State {

}

let buttonStyle = {
    height: '18px',
    padding: '2px 3px',
    display: 'inline-block',
    cursor: 'pointer',
    backgroundImage: 'linear-gradient(#7B7B7B, #353434)',
    border: '1px solid #464646',
    borderRadius: '3px',
    userSelect: 'none',
    outline: '0',

    ':active': {
        backgroundImage: 'linear-gradient(#353434, #7B7B7B)',
    }
}

let clippy = {
    width: '12px'
}

@ui.Radium
export class Clipboard extends BaseComponent<Props, State>{
    render(){
        return (
            <button style={buttonStyle} data-clipboard-text={this.props.text} onClick={(event)=>event.stopPropagation()}>
                <img src="assets/clippy.svg" style={clippy}/>
            </button>
        );
    }
}
