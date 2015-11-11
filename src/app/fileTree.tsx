import React = require("react");
import Radium = require('radium');
import csx = require('csx');
import {BaseComponent} from "./ui";
import * as ui from "./ui";
import * as utils from "../common/utils";
import * as styles from "./styles/styles";
import * as state from "./state/state";
import {Icon} from "./icon";
let {DraggableCore} = ui;

export interface Props extends React.Props<any> {

}
export interface State {
    /** Width of the tree view in pixels */
    width: number;
    treeRoot?: TreeItemModel;
}

let resizerWidth = 5;
let resizerStyle = {
    background: 'radial-gradient(#444,transparent)',
    width: resizerWidth+'px',
    cursor:'ew-resize',
    color: '#666',
}

let treeListStyle = {
    background: '#333'
}

@ui.Radium
export class FileTree extends BaseComponent<Props, State>{
    constructor(props: Props){
        super(props);
        this.state = {
            width: 200,
            treeRoot:{}
        };
    }
    render() {
        return (
            <div style={[csx.flexRoot, csx.horizontal, { width: this.state.width }]}>

                <div style={[csx.flex, csx.vertical, treeListStyle]}>
                    {this.renderTree() }
                </div>

                <DraggableCore onDrag={this.handleDrag} onStop={this.handleStop}>
                    <div style={[csx.flexRoot, csx.centerCenter, resizerStyle]}><Icon name="ellipsis-v"/></div>
                </DraggableCore>

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

    handleDrag = (evt, ui: {
        node: Node, position: {
            // lastX + deltaX === clientX
            deltaX: number, deltaY: number,
            lastX: number, lastY: number,
            clientX: number, clientY: number
        }
    }) => {
        this.setState({ width: ui.position.clientX + resizerWidth });
    };

    handleStop = () => {
        // TODO store as user setting
    }
}

interface TreeItemModel {
    name?: string;
    subItems?: TreeItemModel[];
}
