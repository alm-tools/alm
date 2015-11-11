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
import {getDirectory,getFileName} from "../common/utils";

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

        // debug
        // this.state.shown = true; // debug
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

        // Too soon
        if (!this.state.treeRoot)
            return <div>Loading</div>;

        let hideStyle = !this.state.shown && { display: 'none' };
        return (
            <div style={[csx.flexRoot, csx.horizontal, { width: this.state.width }, hideStyle]}>

                <div style={[csx.flex, csx.vertical, treeListStyle]}>
                    {this.renderDir(this.state.treeRoot)}
                </div>

                <DraggableCore onDrag={this.handleDrag} onStop={this.handleStop}>
                    <div style={[csx.flexRoot, csx.centerCenter, resizerStyle]}><Icon name="ellipsis-v"/></div>
                </DraggableCore>

            </div>
        );
    }
    renderDir(item:TreeItemModel) {
        return (
            <div style={treeDirItemStyle}>
                <Icon name="folder"/> {item.name}
                {this.renderDirSub(item)}
            </div>
        );
    }
    renderDirSub(item:TreeItemModel){
        if (!item.isExpanded || !item.subItems || !item.subItems.length)
            return;

        // TODO
        return ;
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
        let filePaths = props.filePaths;
        // TODO: make expaded state stable across searches
        // Perhaps by creating expanded[filePath] a state member

        if (!filePaths.length) { // initial boot up
            return;
        }
        let rootDir = utils.getDirectory(filePaths[0]);
        let root: TreeItemModel = {
            name: utils.getFileName(rootDir),
            filePath: rootDir,
            isDir: true,
            isExpanded: true,
            subItems: []
        }

        let currentDir = rootDir;
        let currentNode = root;
        for (let filePath of filePaths) {
            let dir = getDirectory(filePath);
            let fileName = getFileName(filePath);

            if (dir == currentDir) {
                let subItem = {
                    name: fileName,
                    filePath: filePath,
                    isDir: false, // we don't know for sure
                    isExpanded: false,
                    subItems: []
                };
                currentNode.subItems.push(subItem);
            }
            else {

            }
        }

        this.setState({treeRoot:root});
    }
}

interface TreeItemModel {
    name: string;
    filePath: string;
    isDir: boolean;
    subItems: TreeItemModel[];

    isExpanded: boolean;
}
