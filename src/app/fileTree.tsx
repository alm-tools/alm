import {server} from "../socket/socketClient";
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
import {inputDialog} from "./dialogs/inputDialog";
import * as Mousetrap from "mousetrap";
type TruthTable = utils.TruthTable;

export interface Props {
    // from react-redux ... connected below
    filePaths?: types.FilePath[];
    filePathsCompleted?: boolean;
    rootDir?: string;
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
    fontSize:'.7rem',
    padding:'3px',
}

let treeScrollStyle = {
    border: '1px solid grey',
    ':focus': {
        border: '1px solid ' + styles.highlightColor
    }
}

let treeItemStyle = {
    whiteSpace: 'nowrap',
    cursor:'pointer',
    padding: '3px',
    userSelect: 'none',
    ':focus': {
        outline: 'none',
    }
}

let treeItemSelectedStyle = {
    backgroundColor:'#444',
}

let currentSelectedItemCopyStyle = {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    height:'1rem',
    cursor: 'pointer',
    width: '100%',
    margin: '2px'
}

@connect((state: StoreState): Props => {
    return {
        filePaths: state.filePaths,
        filePathsCompleted: state.filePathsCompleted,
        rootDir: state.rootDir,
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
            if (!this.state.shown) {
                this.setState({ shown: true });
            }
            let selectedFilePaths = Object.keys(this.state.selectedPaths);
            let pathToFocus = selectedFilePaths.length > 0 && this.ref(selectedFilePaths[selectedFilePaths.length - 1])
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
                expanded[root] = true;
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

        /** Utility : gets you the last item selected if any, otherwise the root dir */
        let getLastSelected = () => {
            let selectedFilePaths = Object.keys(this.state.selectedPaths);
            let last = selectedFilePaths[selectedFilePaths.length - 1];
            if (!last) {
                return { filePath: this.state.treeRoot.filePath, isDir: true };
            }

            let selectedFilePathDetails = this.state.selectedPaths[last];
            return {filePath:last,isDir:selectedFilePathDetails.isDir};
        }

        /** Utility : set an item as the only selected */
        let setAsOnlySelectedNoFocus = (filePath: string, isDir: boolean) => {
            let selectedPaths: SelectedPaths = {};
            selectedPaths[filePath] = {isDir};
            this.setState({selectedPaths});
        }
        let focusFilePath = ((filePath:string)=>{
            if (!this.ref(filePath)) return;
            // leads to better scroll performance instead of `.focus`
            this.ref(filePath).scrollIntoViewIfNeeded(false);
            // focus is still needed because dom re-rendering is losing focus
            this.ref(filePath).focus();
        });
        let setAsOnlySelected = (filePath:string, isDir:boolean) => {
            setAsOnlySelectedNoFocus(filePath,isDir);
            focusFilePath(filePath);
        }

        /**
         * Used in handling keyboard for tree items
         */
        let treeRoot = this.ref(this.refNames.treeRootNode);
        let handlers = new Mousetrap(treeRoot);

        /**
         * file action handlers
         */
        handlers.bind(commands.treeAddFile.config.keyboardShortcut,()=>{
            let lastSelected = getLastSelected();
            let dirPath = lastSelected.isDir ? lastSelected.filePath : utils.getDirectory(lastSelected.filePath);
            inputDialog.open({
                header: "Enter a file name",
                onOk: (value: string) => {
                    let filePath = value;
                    server.addFile({ filePath }).then(res => {
                        commands.doOpenOrFocusFile.emit({ filePath });
                    });
                },
                onEsc: () => {
                    setTimeout(handleFocusRequestBasic, 150);
                },
                filterValue: dirPath + '/',
            });
            return false;
        });
        handlers.bind(commands.treeDuplicateFile.config.keyboardShortcut,()=>{
            let selection = goDownToSmallestSelection();
            if (!selection){
                ui.notifyInfoNormalDisappear('Nothing selected');
                return false;
            }

            let parentDir = utils.getDirectory(selection.selectedFilePath);
            if (selection.isDir) {
                inputDialog.open({
                    header: "Enter a new directory name",
                    onOk: (value: string) => {
                        let filePath = value;
                        server.duplicateDir({src:selection.selectedFilePath,dest:filePath});
                        setAsOnlySelectedNoFocus(filePath, true);
                        this.state.expansionState[filePath] = true;
                        this.setState({expansionState: this.state.expansionState});
                    },
                    onEsc: () => {
                        setTimeout(handleFocusRequestBasic, 150);
                    },
                    filterValue: parentDir + '/',
                });
            }
            else {
                inputDialog.open({
                    header: "Enter a new file name",
                    onOk: (value: string) => {
                        let filePath = value;
                        server.duplicateFile({src:selection.selectedFilePath,dest:filePath});
                        commands.doOpenOrFocusFile.emit({filePath:filePath});
                        setAsOnlySelectedNoFocus(filePath, false);
                    },
                    onEsc: () => {
                        setTimeout(handleFocusRequestBasic, 150);
                    },
                    filterValue: parentDir + '/',
                });
            }

            return false;
        });
        handlers.bind(commands.treeMoveFile.config.keyboardShortcut,()=>{
            let selection = goDownToSmallestSelection();
            if (!selection){
                ui.notifyInfoNormalDisappear('Nothing selected');
                return false;
            }

            inputDialog.open({
                header: "Enter a new location",
                onOk: (value: string) => {
                    let filePath = value;
                    server.movePath({src:selection.selectedFilePath,dest:filePath}).then(res=>{

                        if (res.error){
                            ui.notifyWarningNormalDisappear("Failed to move: " + res.error);
                            return;
                        }

                        if (selection.isDir){
                            setAsOnlySelectedNoFocus(filePath, true);
                            this.state.expansionState[filePath] = true;
                            this.setState({expansionState: this.state.expansionState});
                            commands.closeFilesDirs.emit({ files:[], dirs:[selection.selectedFilePath] });
                        }
                        else {
                            commands.doOpenOrFocusFile.emit({filePath:filePath});
                            setAsOnlySelectedNoFocus(filePath, false);
                            commands.closeFilesDirs.emit({ files:[selection.selectedFilePath], dirs:[] });
                        }
                    });
                },
                onEsc: () => {
                    setTimeout(handleFocusRequestBasic, 150);
                },
                filterValue: selection.selectedFilePath,
            });

            return false;
        });
        handlers.bind([commands.treeDeleteFile.config.keyboardShortcut,"backspace"],()=>{
            let selectedFilePaths = Object.keys(this.state.selectedPaths);
            let selectedFilePathsDetails = selectedFilePaths.map(fp=>{
                return {
                    filePath: fp,
                    isDir: this.state.selectedPaths[fp].isDir
                };
            });

            if (selectedFilePaths.length == 0){
                ui.notifyInfoNormalDisappear('Nothing selected');
                return false;
            }

            let files = selectedFilePathsDetails.filter(x => !x.isDir).map(x => x.filePath);
            let dirs = selectedFilePathsDetails.filter(x => x.isDir).map(x => x.filePath);
            server.deleteFromDisk({ files, dirs }).then(res => {
                commands.closeFilesDirs.emit({ files, dirs });

                // Leave selection in a useful state
                let lastSelectedDetails = selectedFilePathsDetails[selectedFilePathsDetails.length - 1].filePath;
                setAsOnlySelected(utils.getDirectory(lastSelectedDetails), true);
            });

            return false;
        });

        /**
         * navigation handlers
         */
        handlers.bind('enter', () => {
            let {selectedFilePath, isDir} = goDownToSmallestSelection();
            if (isDir) {
                this.state.expansionState[selectedFilePath] = !this.state.expansionState[selectedFilePath];
                this.setState({expansionState: this.state.expansionState});
            } else {
                commands.doOpenOrFocusFile.emit({ filePath: selectedFilePath });
            }
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
        handlers.bind('down', () => {
            let {selectedFilePath, isDir} = goDownToSmallestSelection();


            /** Goes to next sibling on any (recursive) parent folder */
            let gotoNextSiblingHighUp = (treeItem: TreeDirItem) => {
                // Special handling for root. Don't change selection :)
                if (treeItem.filePath == this.state.treeRoot.filePath){
                    return;
                }

                let parentDirFilePath = utils.getDirectory(treeItem.filePath);
                let parentTreeItem = this.dirLookup[parentDirFilePath];

                let indexInParent = parentTreeItem.subDirs.map(x=>x.filePath).indexOf(treeItem.filePath);
                if (indexInParent !== (parentTreeItem.subDirs.length - 1)){ // If not last we have a winner
                    setAsOnlySelected(parentTreeItem.subDirs[indexInParent + 1].filePath, true);
                }
                else if(parentTreeItem.files.length){ // if parent has files move on to files
                    setAsOnlySelected(parentTreeItem.files[0].filePath, false);
                }
                else { // Look at next parent
                    gotoNextSiblingHighUp(parentTreeItem);
                }
            }

            if (isDir) {
                let dirTreeItem = this.dirLookup[selectedFilePath];
                // If expanded and has children, select first relevant child
                if (this.state.expansionState[selectedFilePath]
                    && (dirTreeItem.files.length || dirTreeItem.subDirs.length)) {
                    dirTreeItem.subDirs[0]
                        ? setAsOnlySelected(dirTreeItem.subDirs[0].filePath, true)
                        : setAsOnlySelected(dirTreeItem.files[0].filePath, false)
                }
                else {
                    // Else find the next sibling dir
                    gotoNextSiblingHighUp(dirTreeItem);
                }
            }
            else { // for files
                let parentDirFilePath = utils.getDirectory(selectedFilePath);
                let parentTreeItem = this.dirLookup[parentDirFilePath];
                let indexInParent = parentTreeItem.files.map(f=>f.filePath).indexOf(selectedFilePath);

                // if not last select next sibling
                if (indexInParent !== (parentTreeItem.files.length - 1)){
                    setAsOnlySelected(parentTreeItem.files[indexInParent + 1].filePath, false);
                }
                // If is last go on to parent dir sibling algo
                else {
                    gotoNextSiblingHighUp(parentTreeItem);
                }
            }

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

        let singlePathSelected = Object.keys(this.state.selectedPaths).length == 1
            && Object.keys(this.state.selectedPaths)[0];


        let hideStyle = !this.state.shown && { display: 'none' };
        return (
            <div ref={this.refNames.treeRootNode} style={[csx.flexRoot, csx.horizontal, { width: this.state.width }, hideStyle]}>

                <div style={[csx.flex, csx.vertical, treeListStyle]}>
                    <div style={[csx.flex,csx.scroll, treeScrollStyle]} tabIndex={0}>
                        {this.renderDir(this.state.treeRoot)}
                    </div>
                    {this.props.filePathsCompleted || <Robocop/>}
                    {
                        singlePathSelected
                        && <div
                            className="hint--top"
                            data-hint="Click to copy the file path to clipboard"
                            data-clipboard-text={singlePathSelected}
                            onClick={()=>ui.notifyInfoQuickDisappear("Path copied to clipboard")}>
                            <div
                                style={currentSelectedItemCopyStyle}>
                                {utils.getFileName(singlePathSelected)}
                            </div>
                        </div>
                    }
                </div>

                <DraggableCore onDrag={this.handleDrag} onStop={this.handleDragStop}>
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
            [<div style={[treeItemStyle, selectedStyle]} key={item.filePath} ref={item.filePath} tabIndex={-1} onClick={(evt) => this.handleToggleDir(evt,item) }>
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

    handleDragStop = () => {
        // TODO store as user setting
    }

    setupTree = (props:Props) => {
        let filePaths = props.filePaths.filter(fp=> fp.type == types.FilePathType.File).map(fp=> fp.filePath);

        if (!filePaths.length) { // initial boot up
            return;
        }
        let rootDirPath = props.rootDir;
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

        // TODO: keep the selected file paths in sync with all the items that are available
    }

    handleToggleDir = (evt:React.SyntheticEvent, item:TreeDirItem) => {
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
