import React = require("react");
import Radium = require('radium');
import csx = require('csx');
import {BaseComponent} from "./ui";
import * as ui from "./ui";
import * as utils from "../common/utils";
import * as styles from "./styles/styles";

export interface Props extends React.Props<any> {

}
export interface State {

}

@ui.Radium
export class FindAndReplace extends BaseComponent<Props, State>{
    render(){
        return (
            <div>
            </div>
        );
    }
}
