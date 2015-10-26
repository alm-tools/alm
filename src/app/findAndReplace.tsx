import React = require("react");
var ReactDOM = require('react-dom');
import Radium = require('radium');
import csx = require('csx');
import {BaseComponent} from "./ui";
import * as ui from "./ui";
import * as utils from "../common/utils";
import * as styles from "./styles/styles";
import * as state from "./state/state";
import * as commands from "./commands/commands";
import {Icon} from "./icon";

export interface Props extends React.Props<any> {

}
export interface State {
    shown?: boolean;
}


let labelStyle = {
    color: 'grey',
    padding: '4px'
}
let inputBlackStyle = {
    backgroundColor: '#333',
    color: 'white',
    outline: 'none',
    padding: '2px',
    border: '2px solid #3C3C3C',
}
let tipMessageStyle = {
    color: 'grey'
}
var keyboardShortCutStyle = {
    border: '2px solid',
    borderRadius: '6px',
    padding: '2px',
    fontSize: '.7rem',
    backgroundColor: 'black',
}
let searchOptionsLabelStyle = {
    color: 'grey',
    fontSize: '1.5rem',
    fontWeight: 'bold',
    cursor:'pointer'
}


@ui.Radium
export class FindAndReplace extends BaseComponent<Props, State>{

    componentDidMount() {
        this.disposible.add(commands.findAndReplace.on(() => {
            this.setState({ shown: true });
            this.findInput().focus();
        }));
    }

    refs: {
        [string: string]: any;
        find: JSX.Element;
    }
    findInput = (): HTMLInputElement=> ReactDOM.findDOMNode(this.refs.find);
    replace = (): HTMLInputElement=> ReactDOM.findDOMNode(this.refs.find);
    // searchLocation = (): HTMLInputElement=> ReactDOM.findDOMNode(this.refs.find);

    render() {
        if (!this.state.shown) {
            return <span></span>;
        }

        return (
            <div style={csx.vertical}>
                <div style={[csx.horizontal, csx.center, styles.padded1]}>
                    <input ref="find" placeholder="Find" style={[inputBlackStyle, csx.flex]} />
                </div>
                <div style={[csx.horizontal, csx.center, styles.padded1]}>
                    <input ref="replace" placeholder="Replace" style={[inputBlackStyle, csx.flex]} />
                </div>
                <div style={[csx.horizontal, csx.aroundJustified, styles.padded1]}>
                    <label style={[csx.horizontal,csx.center]}><ui.Toggle/><span style={searchOptionsLabelStyle}>.*</span></label>
                    <label style={[csx.horizontal,csx.center]}><ui.Toggle/><span style={searchOptionsLabelStyle}>Aa</span></label>
                    <label style={[csx.horizontal,csx.center]}><ui.Toggle/><span style={searchOptionsLabelStyle}>|--|</span></label>
                </div>
                <div style={[tipMessageStyle,styles.padded1]}>
                    <span style={keyboardShortCutStyle}>Esc</span> to exit
                    {' '}<span style={keyboardShortCutStyle}>Enter</span> in the find field to search, or in the replace field to replace
                    {' '}<span style={keyboardShortCutStyle}>Shift + Enter</span> to do it in the reverse
                    {' '}<span style={keyboardShortCutStyle}>{ui.modName} + Enter</span> to do them all at once
                </div>
            </div>
        );
    }
}
