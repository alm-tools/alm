import React = require("react");
import * as csx from '../base/csx';
import {BaseComponent} from "../ui";
import * as ui from "../ui";
import * as typestyle from "typestyle";

import * as treeStyles from "../styles/themes/current/treeview/tree";

export interface Props {
    text: string;
}
export interface State {

}

export class Clipboard extends BaseComponent<Props, State>{
    render(){
        return (
            <button className={treeStyles.clipboardButtonClassName} style={csx.extend(csx.center)} data-clipboard-text={this.props.text} onClick={(event)=>event.stopPropagation() || ui.notifyInfoQuickDisappear("Copied")}>
                <img src="assets/clippy.svg" style={treeStyles.clippy}/>
            </button>
        );
    }
}
