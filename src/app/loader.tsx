import React = require("react");
import Radium = require('radium');
import csx = require('csx');
import {BaseComponent} from "./ui";
import * as ui from "./ui";

export interface Props extends React.Props<any> {
    pendingRequests: number;
}
export interface State {

}

require('./loader.css');
export class Loader extends BaseComponent<Props, State>{
    render(){
        let pendingRequests = this.props.pendingRequests||0;
        let style = {
            opacity: Math.min(1, .05 * pendingRequests)
        };
        return (
            <span className="loader" style={style}>
                <ul>
                    <li className="one" />
                    <li className="two" />
                    <li className="three" />
                    <li className="four" />
                    <li className="five" />
                </ul>
            </span>
        );
    }
}
