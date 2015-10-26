import React = require("react");
import Radium = require('radium');
import csx = require('csx');
import {BaseComponent} from "../ui";
import * as ui from "../ui";

export interface Props extends React.Props<any> {

}
export interface State {

}

export var tipText = {
    fontSize: '2rem',
    color: '#776666',
    fontWeight: 'bold',
    userSelect: 'none'
}

@ui.Radium
export class Tips extends BaseComponent<Props, State>{
    render(){
        return (
            <div style={[csx.flex,csx.centerCenter,tipText]}>
                <div>Find a file to work with using [Ctrl | CMD] + P </div>
            </div>
        );
    }
}
