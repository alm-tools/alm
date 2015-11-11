import React = require("react");
import Radium = require('radium');
import csx = require('csx');
import {BaseComponent} from "./ui";
import * as ui from "./ui";
import * as utils from "../common/utils";
import * as styles from "./styles/styles";
import * as state from "./state/state";
import {connect} from "react-redux";
import {StoreState} from "./state/state";
import {Icon} from "./icon";
import * as commands from "./commands/commands";
let {DraggableCore} = ui;

export interface Props extends React.Props<any> {
    // from react-redux ... connected below
    filePaths?: string[];
    filePathsCompleted?: boolean;
}
export interface State {
    /** Width of the tree view in pixels */
    width?: number;
    shown?: boolean;
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

let treeDirItemStyle = {
    color: 'white',
}

@connect((state: StoreState): Props => {
    return {
        filePaths: state.filePaths,
        filePathsCompleted: state.filePathsCompleted,
    };
})
@ui.Radium
export class FileTree extends BaseComponent<Props, State>{
    constructor(props: Props){
        super(props);
        this.state = {
            width: 200,
            shown: false,
        };
        this.setupTree(props);
    }

    componentWillReceiveProps(props: Props) {
        this.setupTree(props);
    }

    componentDidMount() {
        this.disposible.add(commands.toggleTreeView.on(()=>{
            this.setState({ shown: !this.state.shown });
        }));
    }


    render() {
        let hideStyle = !this.state.shown && { display: 'none' };
        return (
            <div style={[csx.flexRoot, csx.horizontal, { width: this.state.width }, hideStyle]}>

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
            <div style={treeDirItemStyle}>
                File Tree coming soon
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

    setupTree(props:Props){
        // console.log(props.filePaths);
    }
}

interface TreeItemModel {
    name: string;
    isDir: boolean;
    subItems?: TreeItemModel[];
}
