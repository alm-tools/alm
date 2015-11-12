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
import {Robocop} from "./robocop";

export interface Props extends React.Props<any> {
    // from react-redux ... connected below
    filePaths?: string[];
    filePathsCompleted?: boolean;
}
export interface State {
    /** Width of the tree view in pixels */
    width?: number;
    shown?: boolean;
    treeRoot?: TreeDirItem;
    expansionState?: { [filePath: string]: boolean };

     // TODO: support multiple selections at some point, hence a dict
    selectedPaths?: { [filePath: string]: boolean };
}

let resizerWidth = 5;
let resizerStyle = {
    background: 'radial-gradient(#444,transparent)',
    width: resizerWidth+'px',
    cursor:'ew-resize',
    color: '#666',
}

let treeListStyle = {
    background: '#333',
    color: '#eee',
    fontSize:'.8rem',
    padding:'5px',
    overflow: 'auto'
}

let treeItemStyle = {
    whiteSpace: 'nowrap',
    cursor:'pointer',
    padding: '3px',
    userSelect: 'none',
}

let treeItemSelectedStyle = {
    backgroundColor:'#444',
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
            expansionState: {},
            selectedPaths: {}
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
            return <div></div>;

        let hideStyle = !this.state.shown && { display: 'none' };
        return (
            <div style={[csx.flexRoot, csx.horizontal, { width: this.state.width }, hideStyle]}>

                <div style={[csx.flex, csx.vertical, treeListStyle]}>
                    {this.props.filePathsCompleted || <Robocop/>}
                    {this.renderDir(this.state.treeRoot)}
                </div>

                <DraggableCore onDrag={this.handleDrag} onStop={this.handleStop}>
                    <div style={[csx.flexRoot, csx.centerCenter, resizerStyle]}><Icon name="ellipsis-v"/></div>
                </DraggableCore>

            </div>
        );
    }
    renderDir(item:TreeDirItem,depth = 0) {
        let expanded = this.state.expansionState[item.filePath];
        let icon = expanded ? 'folder-open' : 'folder';
        let sub = expanded ? this.renderDirSub(item, depth) : [];
        let selectedStyle = this.state.selectedPaths[item.filePath] ? treeItemSelectedStyle : {};
        return (
            [<div style={[treeItemStyle, selectedStyle]} key={item.filePath} onClick={(evt) => this.handleToggleDir(evt, item) }>
                {ui.indent(depth,2)} <Icon name={icon}/> {item.name}
            </div>].concat(sub)
        );
    }
    renderDirSub(item:TreeDirItem, depth: number){
        return item.subDirs.map(item => this.renderDir(item,depth+1))
            .concat(item.files.map(file => this.renderFile(file,depth+1)));
    }
    renderFile(item:TreeFileItem,depth:number){
        let selectedStyle = this.state.selectedPaths[item.filePath] ? treeItemSelectedStyle : {};
        return (
            <div style={[treeItemStyle, selectedStyle]} key={item.filePath} onClick={(evt) => this.handleSelectFile(evt, item) }>
                {ui.indent(depth,2)} <Icon name="file-text-o"/> {item.name}
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
        let filePaths = props.filePaths;

        if (!filePaths.length) { // initial boot up
            return;
        }
        let rootDirPath = utils.getDirectory(filePaths[0]);
        let rootDir: TreeDirItem = {
            name: utils.getFileName(rootDirPath),
            filePath: rootDirPath,
            subDirs: [],
            files: []
        }

        // Always expand root
        this.state.expansionState[rootDirPath] = true;

        let dirLookup:{[dirPath:string]:TreeDirItem} = {};
        dirLookup[rootDirPath] = rootDir;

        for (let filePath of filePaths) {
            let dir = getDirectory(filePath);
            let fileName = getFileName(filePath);
            let subItem = {
                name: fileName,
                filePath: filePath,
            };

            // if not found create a new dir and set its parent
            // (recursively e.g. last was /foo and new is /foo/bar/baz/quz)
            function createDirAndMakeSureAllParentExits(dir: string): TreeDirItem {
                let dirTree: TreeDirItem = {
                    name: getFileName(dir),
                    filePath: dir,
                    subDirs: [],
                    files: []
                }
                dirLookup[dir] = dirTree;

                let parentDir = getDirectory(dir);
                let parentDirTree = dirLookup[parentDir]
                if (!parentDirTree) {
                    parentDirTree = createDirAndMakeSureAllParentExits(parentDir);
                }
                parentDirTree.subDirs.push(dirTree);

                return dirTree;
            }

            // lookup existing dir
            let treeDir = dirLookup[dir];
            if (!treeDir) {
                treeDir = createDirAndMakeSureAllParentExits(dir);
            }
            treeDir.files.push(subItem);
        }

        this.setState({ treeRoot: rootDir, expansionState: this.state.expansionState });
    }

    handleToggleDir = (evt:React.SyntheticEvent,item:TreeDirItem) => {
        evt.stopPropagation();
        let dirPath = item.filePath;

        this.state.selectedPaths = {};
        this.state.selectedPaths[dirPath] = true;

        this.state.expansionState[dirPath] = !this.state.expansionState[dirPath];

        this.setState({expansionState: this.state.expansionState, selectedPaths:this.state.selectedPaths });
    }

    handleSelectFile = (evt:React.SyntheticEvent,item:TreeFileItem) => {
        evt.stopPropagation();
        let filePath = item.filePath;

        this.state.selectedPaths = {};
        this.state.selectedPaths[filePath] = true;

        this.setState({ selectedPaths:this.state.selectedPaths });

        commands.doOpenFile.emit({ filePath });
    }
}

interface TreeDirItem {
    name: string;
    filePath: string;
    subDirs: TreeDirItem[];
    files : TreeFileItem[];
}

interface TreeFileItem {
    name: string;
    filePath: string;
}
