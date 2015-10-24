import React = require("react");
import Radium = require('radium');
import csx = require('csx');
import {BaseComponent} from "./ui";
import {connect} from "react-redux";
import * as ui from "./ui";
import * as state from "./state/state";

export interface Props extends React.Props<any> {
    pendingRequests?: string[];
}
export interface State {

}

require('./pendingRequestsIndicator.css');

@connect((state: state.StoreState): Props => {
    return {
        pendingRequests: state.pendingRequests,
    };
})
export class PendingRequestsIndicator extends BaseComponent<Props, State>{
    componentWillReceiveProps(){
    }
    render(){
        console.log(this.props.pendingRequests);
        let pendingRequestsCount = this.props.pendingRequests.length;
        let style = {
            opacity: Math.min(1, .05 * pendingRequestsCount)
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
