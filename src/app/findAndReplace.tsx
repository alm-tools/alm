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

export interface Props extends React.Props<any> {

}
export interface State {
    shown?: boolean;
}


export let labelStyle = {
    color: 'grey',
    padding: '4px'
}
export let inputBlackStyle = {
    backgroundColor: '#333',
    color: 'white',
    outline: 'none',
    padding: '2px',
    border: '2px solid #3C3C3C',
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
                <div style={[csx.horizontal, csx.center, styles.padded1LeftRightBottom]}>
                    <input ref="replace" placeholder="Replace" style={[inputBlackStyle, csx.flex]} />
                </div>
            </div>
        );
    }
}
