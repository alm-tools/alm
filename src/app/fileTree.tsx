import React = require("react");
import Radium = require('radium');
import csx = require('csx');
import {BaseComponent} from "./ui";
import * as ui from "./ui";
import * as utils from "../common/utils";
import * as styles from "./styles/styles";
import * as state from "./state/state";

export interface Props extends React.Props<any> {

}
export interface State {
    /** Width of the tree view in pixels */
    width: number;
}

let resizerStyle = {
    background: 'radial-gradient(#444,transparent)',
    width:'5px',
    cursor:'ew-resize'
}

let treeListStyle = {
    background: '#333'
}

@ui.Radium
export class FileTree extends BaseComponent<Props, State>{
    constructor(props: Props){
        super(props);
        this.state = {
            width: 100
        };
    }
    render() {
        return (
            <div style={[csx.flexRoot, csx.horizontal, { width: this.state.width }]}>

                <div style={[csx.flex, csx.vertical, treeListStyle]}>
                    {this.renderTree() }
                </div>

                <div style={resizerStyle}></div>

            </div>
        );
    }
    renderTree() {

        return (
            <div>
                asdf
            </div>
        );
    }
}

interface TreeItemModel {

}
