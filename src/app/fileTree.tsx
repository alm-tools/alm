import * as types from "../common/types";
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
import * as Mousetrap from "mousetrap";
type TruthTable = utils.TruthTable;

export interface Props extends React.Props<any> {
    // from react-redux ... connected below
    filePaths?: types.FilePath[];
    filePathsCompleted?: boolean;
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
type SelectedPaths = { [filePath: string]: {isDir:boolean} };
let dirSelected = { isDir: true };
let fileSelected = { isDir: false };

export interface State {
    /** Width of the tree view in pixels */
    width?: number;
    shown?: boolean;
    treeRoot?: TreeDirItem;
    expansionState?: { [filePath: string]: boolean };

     // TODO: support multiple selections at some point, hence a dict
    selectedPaths?: SelectedPaths;
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

    /** makes it easier to lookup directories */
    dirLookup:{[dirPath:string]:TreeDirItem} = {};

    constructor(props: Props){
        super(props);
        this.state = {
            width: 200,
            shown: false,
            expansionState: {},
            selectedPaths: {},
            treeRoot: { name: 'loading', filePath: 'loading', subDirs: [], files: [] }
        };
        this.setupTree(props);

        // debug
        // this.state.shown = true; // debug
    }

    componentWillReceiveProps(props: Props) {
        this.setupTree(props);
    }

    componentDidMount() {

        let handleFocusRequestBasic = ()=>{
            let selectedFilePaths = Object.keys(this.state.selectedPaths);
            let pathToFocus = selectedFilePaths.length > 0
                ? selectedFilePaths[selectedFilePaths.length - 1]
                : this.state.treeRoot.filePath;

            this.ref(pathToFocus).focus();
            return false;
        }

        this.disposible.add(commands.treeViewToggle.on(()=>{
            this.setState({ shown: !this.state.shown });
            if (this.state.shown) {
                handleFocusRequestBasic();
            }
            else {
                commands.esc.emit({});
            }
        }));

        this.disposible.add(commands.treeViewRevealActiveFile.on(()=>{
            if (!this.state.shown) {
                this.setState({ shown: true });
            }
            let selectedTab = state.getSelectedTab();
            if (selectedTab && selectedTab.url.startsWith('file://')){
                let filePath = utils.getFilePathFromUrl(selectedTab.url);

                // expand the tree to make sure this file is visible
                let root = this.state.treeRoot.filePath;
                let remainderAfterRoot = filePath.substr(root.length + 1 /* for `/` */);
                let dirPortionsAfterRoot = utils.getDirectory(remainderAfterRoot).split('/');
                let runningPortion = '';
                let expanded: TruthTable = {};
                for (let portion of dirPortionsAfterRoot) {
                    runningPortion = runningPortion+'/'+portion;
                    let fullPath = root + runningPortion;
                    expanded[fullPath] = true;
                }
                let expansionState = csx.extend(this.state.expansionState,expanded) as TruthTable;

                // also only select this node
                let selectedPaths: SelectedPaths = {};
                selectedPaths[filePath] = fileSelected;

                this.setState({expansionState,selectedPaths});
                this.ref(filePath).focus();
            }
            else {
                handleFocusRequestBasic();
            }
            return false;
        }));

        this.disposible.add(commands.treeViewFocus.on(()=>{
            handleFocusRequestBasic();
        }));

        /** Utility: takes you down two the last item selected */
        let goDownToSmallestSelection = () => {
            let selectedFilePaths = Object.keys(this.state.selectedPaths);
            if (selectedFilePaths.length == 0){
                let selectedPaths: SelectedPaths = {};
                selectedPaths[this.state.treeRoot.filePath] = dirSelected;
                this.setState({selectedPaths});
            }
            else if (selectedFilePaths.length > 1) {
                let selectedPaths: SelectedPaths = {};
                let path = selectedFilePaths[selectedFilePaths.length - 1];
                selectedPaths[path] = this.state.selectedPaths[path];
                this.setState({selectedPaths});
            }
            else {
                // already single selection :)
            }
            let selectedFilePath = Object.keys(this.state.selectedPaths)[0];
            let selectedFilePathDetails = this.state.selectedPaths[selectedFilePath];
            return {selectedFilePath,isDir:selectedFilePathDetails.isDir};
        }

        /** Utility : set an item as the only selected */
        let setAsOnlySelected = (filePath:string, isDir:boolean) => {
            let selectedPaths: SelectedPaths = {};
            selectedPaths[filePath] = {isDir};
            this.setState({selectedPaths});
            this.ref(filePath).focus();
        }

        // Setup all the tree specific command to be handled here
        let treeRoot = this.ref(this.refNames.treeRootNode);
        let handlers = new Mousetrap(treeRoot);
        handlers.bind(commands.treeAddFile.config.keyboardShortcut,()=>{
            console.log('add File');
            return false;
        });
        handlers.bind(commands.treeDuplicateFile.config.keyboardShortcut,()=>{
            console.log('duplicate File');
            return false;
        });
        handlers.bind(commands.treeMoveFile.config.keyboardShortcut,()=>{
            console.log('move File');
            return false;
        });
        handlers.bind([commands.treeDeleteFile.config.keyboardShortcut,"backspace"],()=>{
            console.log('delete File');
            return false;
        });
        handlers.bind('up',()=>{
            let {selectedFilePath,isDir} = goDownToSmallestSelection();

            // if root do nothing
            if (selectedFilePath == this.state.treeRoot.filePath){
                return;
            }

            // find the parent dir &&
            // find this in the parent dir
            let parentDirFilePath = utils.getDirectory(selectedFilePath);
            let parentDirTreeItem = this.dirLookup[parentDirFilePath];
            let indexInParentDir = isDir
                                    ?parentDirTreeItem.subDirs.map(x=>x.filePath).indexOf(selectedFilePath)
                                    :parentDirTreeItem.files.map(x=>x.filePath).indexOf(selectedFilePath);

            /** Goes to the bottom file / folder */
            let gotoBottomOfFolder = (closestDir: TreeDirItem) => {
                while (true){
                    if (!this.state.expansionState[closestDir.filePath]){ // if not expanded, we have a winner
                        setAsOnlySelected(closestDir.filePath,true);
                        break;
                    }
                    if (closestDir.files.length) { // Lucky previous expanded dir has files, select last!
                        setAsOnlySelected(closestDir.files[closestDir.files.length-1].filePath,false);
                        break;
                    }
                    else if (closestDir.subDirs.length) { // does it have folders? ... check last folder next
                        closestDir = closestDir.subDirs[closestDir.subDirs.length - 1];
                        continue;
                    }
                    else { // no folders no files ... we don't care if you are expanded or not
                        setAsOnlySelected(closestDir.filePath,true);
                        break;
                    }
                }
            }

            // if first
            if (indexInParentDir == 0){
                if (isDir){
                    setAsOnlySelected(parentDirFilePath, true);
                }
                else if (parentDirTreeItem.subDirs.length == 0){
                    setAsOnlySelected(parentDirFilePath, true);
                }
                else {
                    gotoBottomOfFolder(parentDirTreeItem.subDirs[parentDirTreeItem.subDirs.length - 1]);
                }
            }
            // if this is not the first file in the folder select the previous file
            else if (!isDir){
                setAsOnlySelected(parentDirTreeItem.files[indexInParentDir-1].filePath, false);
            }
            // Else select the deepest item in the previous directory
            else {
                let closestDir = parentDirTreeItem.subDirs[indexInParentDir-1];
                gotoBottomOfFolder(closestDir);
            }
            return false;
        });
        handlers.bind('down',()=>{
            goDownToSmallestSelection();
            console.log('Down');
            return false;
        });
        handlers.bind('left',()=>{
            let {selectedFilePath,isDir} = goDownToSmallestSelection();
            if (isDir){
                // if expanded then collapse
                if (this.state.expansionState[selectedFilePath]){
                    delete this.state.expansionState[selectedFilePath];
                    this.setState({ expansionState: this.state.expansionState });
                    return;
                }
                // if root ... leave
                if (this.state.treeRoot.filePath == selectedFilePath){
                    return;
                }
            }
            // Goto the parent directory
            setAsOnlySelected(utils.getDirectory(selectedFilePath), true);

            return false;
        });
        handlers.bind('right', () => {
            let {selectedFilePath, isDir} = goDownToSmallestSelection();
            if (isDir) {
                // just expand
                this.state.expansionState[selectedFilePath] = true;
                this.setState({ expansionState: this.state.expansionState });
                return;
            }
            return false;
        });
    }
    refNames = {treeRootNode:'1'}

    render() {
        let hideStyle = !this.state.shown && { display: 'none' };
        return (
            <div ref={this.refNames.treeRootNode} style={[csx.flexRoot, csx.horizontal, { width: this.state.width }, hideStyle]}>

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
            [<div style={[treeItemStyle, selectedStyle]} key={item.filePath} ref={item.filePath} tabIndex={-1} onClick={(evt) => this.handleToggleDir(evt, item) }>
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
            <div style={[treeItemStyle, selectedStyle]} key={item.filePath} ref={item.filePath} tabIndex={-1} onClick={(evt) => this.handleSelectFile(evt, item) }>
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

    setupTree = (props:Props) => {
        let filePaths = props.filePaths.filter(fp=> fp.type == types.FilePathType.File).map(fp=> fp.filePath);

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

        this.dirLookup= {};
        this.dirLookup[rootDirPath] = rootDir;

        for (let filePath of filePaths) {
            let dir = getDirectory(filePath);
            let fileName = getFileName(filePath);
            let subItem = {
                name: fileName,
                filePath: filePath,
            };

            // if not found create a new dir and set its parent
            // (recursively e.g. last was /foo and new is /foo/bar/baz/quz)
            let createDirAndMakeSureAllParentExits = (dir: string): TreeDirItem => {
                let dirTree: TreeDirItem = {
                    name: getFileName(dir),
                    filePath: dir,
                    subDirs: [],
                    files: []
                }
                this.dirLookup[dir] = dirTree;

                let parentDir = getDirectory(dir);
                let parentDirTree = this.dirLookup[parentDir]
                if (!parentDirTree) {
                    parentDirTree = createDirAndMakeSureAllParentExits(parentDir);
                }
                parentDirTree.subDirs.push(dirTree);

                return dirTree;
            }

            // lookup existing dir
            let treeDir = this.dirLookup[dir];
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
        this.state.selectedPaths[dirPath] = dirSelected;
        this.state.expansionState[dirPath] = !this.state.expansionState[dirPath];

        this.setState({expansionState: this.state.expansionState, selectedPaths:this.state.selectedPaths });
    }

    handleSelectFile = (evt:React.SyntheticEvent,item:TreeFileItem) => {
        evt.stopPropagation();
        let filePath = item.filePath;

        this.state.selectedPaths = {};
        this.state.selectedPaths[filePath] = fileSelected;

        this.setState({ selectedPaths:this.state.selectedPaths });

        commands.doOpenOrFocusFile.emit({ filePath });
    }
}
