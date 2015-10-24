import React = require("react");
import Radium = require('radium');
import csx = require('csx');
import {BaseComponent} from "./ui";
import * as ui from "./ui";

export interface Props extends React.Props<any> {

}
export interface State {

}

@ui.Radium
export class OmniSearch extends BaseComponent<Props, State>{
    render(){
        return (
            <div>
            </div>
        );
    }
}
