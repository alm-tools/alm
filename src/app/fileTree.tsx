import { server } from "../socket/socketClient";
import * as types from "../common/types";
import React = require("react");
import * as csx from './base/csx';
import ReactDOM = require("react-dom");
import { BaseComponent } from "./ui";
import * as ui from "./ui";
import * as utils from "../common/utils";
import * as styles from "./styles/styles";
import * as state from "./state/state";
import { connect } from "react-redux";
import { StoreState } from "./state/state";
import { Icon } from "./components/icon";
import * as commands from "./commands/commands";
let { DraggableCore } = ui;
import { getDirectory, getFileName } from "../common/utils";
import { Robocop } from "./components/robocop";
import { inputDialog } from "./dialogs/inputDialog";
import * as Mousetrap from "mousetrap";
import * as clipboard from "./components/clipboard";
import * as pure from "../common/pure";
import { tabState } from "./tabs/v2/appTabsContainer";
import * as settings from "./state/settings";
import * as typestyle from "typestyle";
import { throttle } from '../common/utils';
type TruthTable = utils.TruthTable;



export interface Props {
    // from react-redux ... connected below
    filePaths?: types.FilePath[];
    filePathsCompleted?: boolean;
    rootDir?: string;
    activeProjectFilePathTruthTable?: { [filePath: string]: boolean };
    fileTreeShown?: boolean;
}

interface TreeDirItem {
    name: string;
    filePath: string;
    subDirs: TreeDirItem[];
    files: TreeFileItem[];
}
interface TreeFileItem {
    name: string;
    filePath: string;
}
type SelectedPaths = { [filePath: string]: { isDir: boolean } };
type SelectedPathsReadonly = { readonly [filePath: string]: { isDir: boolean } };
let dirSelected = { isDir: true };
let fileSelected = { isDir: false };

export interface State {
    /** Width of the tree view in pixels */
    width?: number;
    treeRoot?: TreeDirItem;
    expansionState?: { [filePath: string]: boolean };
    showHelp?: boolean;

    treeScrollHasFocus?: boolean;

    // TODO: support multiple selections at some point, hence a dict
    readonly selectedPaths?: SelectedPaths;
}

let resizerWidth = 5;
let resizerStyle = {
    background: 'radial-gradient(#444,transparent)',
    width: resizerWidth + 'px',
    cursor: 'ew-resize',
    color: '#666',
}

let treeListStyle = {
    color: '#eee',
    fontSize: '.7rem',
    padding: '3px',
}

let treeScrollClassName = typestyle.style({
    border: '1px solid grey',
    $nest: {
        '&:focus': {
            outline: 'none',
            border: '1px solid ' + styles.highlightColor
        }
    }
})

let treeItemClassName = typestyle.style({
    whiteSpace: 'nowrap',
    cursor: 'pointer',
    padding: '3px',
    userSelect: 'none',
    fontSize: '.9em',
    opacity: .8,
    $nest: {
        '&:focus': {
            outline: 'none',
        }
    }
})

let treeItemSelectedStyle = {
    backgroundColor: styles.selectedBackgroundColor,
}

let treeItemInProjectStyle = {
    color: 'rgb(0, 255, 183)',
    opacity: 1,
}

let treeItemIsGeneratedStyle = {
    fontSize: '.6em'
}

let currentSelectedItemCopyStyle = {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'pre', // Prevents wrapping

    cursor: 'pointer',
    marginLeft: '2px',
    fontSize: '.6rem',
    fontWeight: 'bold',
    color: '#CCC',
    textShadow: '0 0 3px rgba(255, 255, 255, 0.5)',
}

let helpRowStyle = {
    margin: '5px',
    lineHeight: '18px'
}

@connect((state: StoreState): Props => {
    return {
        filePaths: state.filePaths,
        filePathsCompleted: state.filePathsCompleted,
        rootDir: state.rootDir,
        activeProjectFilePathTruthTable: state.activeProjectFilePathTruthTable,
        fileTreeShown: state.fileTreeShown,
    };
})

export class FileTree extends BaseComponent<Props, State>{
    /** can't be pure right now because of how we've written `selectedState` */
    // shouldComponentUpdate = pure.shouldComponentUpdate;

    /** makes it easier to lookup directories */
    dirLookup: { [dirPath: string]: TreeDirItem } = {};
    loading: boolean = true; // guilty till proven innocent

    constructor(props: Props) {
        super(props);
        this.state = {
            width: 200,
            expansionState: {},
            selectedPaths: {},
            treeRoot: { name: 'loading', filePath: 'loading', subDirs: [], files: [] },
            treeScrollHasFocus: false,
        };
        this.setupTree(props);

        // debug
        // this.state.shown = true; // debug
    }

    componentWillReceiveProps(props: Props) {
        this.setupTree(props);
    }

    componentDidMount() {
        settings.fileTreeWidth.get().then(res => {
            let width = res || this.state.width;
            width = Math.min(window.innerWidth - 100, width);
            this.setState({ width });
        });

        let handleFocusRequestBasic = (shown: boolean) => {
            if (!shown) {
                state.expandFileTree({});
            }
            let selectedFilePaths = Object.keys(this.state.selectedPaths);
            let pathToFocus = selectedFilePaths.length > 0 && this.ref(selectedFilePaths[selectedFilePaths.length - 1])
                ? selectedFilePaths[selectedFilePaths.length - 1]
                : this.state.treeRoot.filePath;

            this.focusOnPath(pathToFocus);
            return false;
        }

        this.disposible.add(commands.esc.on(() => {
            if (this.state.showHelp) {
                this.setState({ showHelp: false });
                setTimeout(() => this.focusOnPath(this.state.treeRoot.filePath), 150);
            }
        }));

        this.disposible.add(commands.treeViewToggle.on(() => {
            const shown = this.props.fileTreeShown;
            shown ? state.collapseFileTree({}) : state.expandFileTree({});
            if (!shown) {
                handleFocusRequestBasic(true);
            }
            else {
                commands.esc.emit({});
            }
        }));

        this.disposible.add(commands.treeViewRevealActiveFile.on(() => {
            if (!this.props.fileTreeShown) {
                state.expandFileTree({});
            }
            let selectedTab = tabState.getSelectedTab();
            if (selectedTab && selectedTab.url.startsWith('file://')) {
                let filePath = utils.getFilePathFromUrl(selectedTab.url);

                // expand the tree to make sure this file is visible
                let root = this.state.treeRoot.filePath;
                let remainderAfterRoot = filePath.substr(root.length + 1 /* for `/` */);
                let dirPortionsAfterRoot = utils.getDirectory(remainderAfterRoot).split('/');
                let runningPortion = '';
                let expanded: TruthTable = {};
                expanded[root] = true;
                for (let portion of dirPortionsAfterRoot) {
                    runningPortion = runningPortion + '/' + portion;
                    let fullPath = root + runningPortion;
                    expanded[fullPath] = true;
                }
                let expansionState = csx.extend(this.state.expansionState, expanded) as TruthTable;

                // also only select this node
                let selectedPaths: SelectedPaths = {
                    [filePath]: fileSelected
                };
                this.setState({ expansionState, selectedPaths });
                this.focusOnPath(filePath);
            }
            else {
                handleFocusRequestBasic(true);
            }
            return false;
        }));

        this.disposible.add(commands.treeViewFocus.on(() => {
            handleFocusRequestBasic(this.props.fileTreeShown);
        }));

        /**
         * Utility: takes the selected state to the last item selected
         * If no item selected it selects the root
         */
        let goDownToSmallestSelection = () => {
            let selectedFilePaths = Object.keys(this.state.selectedPaths);
            if (selectedFilePaths.length == 0) {
                let selectedPaths: SelectedPaths = {
                    [this.state.treeRoot.filePath]: fileSelected
                };
                this.setState({ selectedPaths });
            }
            else if (selectedFilePaths.length > 1) {
                let path = selectedFilePaths[selectedFilePaths.length - 1];
                let selectedPaths: SelectedPaths = {
                    [path]: this.state.selectedPaths[path]
                };
                this.setState({ selectedPaths });
            }
            else {
                // already single selection :)
            }
            let selectedFilePath = Object.keys(this.state.selectedPaths)[0];
            let selectedFilePathDetails = this.state.selectedPaths[selectedFilePath];
            return { selectedFilePath, isDir: selectedFilePathDetails.isDir };
        }

        /**
         * Utility : gets you the last item selected if any, otherwise the root dir
         * Does not modify state
         */
        let getLastSelected = () => {
            let selectedFilePaths = Object.keys(this.state.selectedPaths);
            let last = selectedFilePaths[selectedFilePaths.length - 1];
            if (!last) {
                return { filePath: this.state.treeRoot.filePath, isDir: true };
            }

            let selectedFilePathDetails = this.state.selectedPaths[last];
            return { filePath: last, isDir: selectedFilePathDetails.isDir };
        }

        /** Utility : set an item as the only selected */
        let setAsOnlySelectedNoFocus = (filePath: string, isDir: boolean) => {
            let selectedPaths: SelectedPaths = {
                [filePath]: { isDir }
            };
            this.setState({ selectedPaths });
        }
        let setAsOnlySelected = (filePath: string, isDir: boolean) => {
            setAsOnlySelectedNoFocus(filePath, isDir);
            this.focusOnPath(filePath);
        }

        /**
         * Used in handling keyboard for tree items
         */
        let treeRoot = this.ref('__treeroot');
        let handlers = new Mousetrap(treeRoot);

        /**
         * file action handlers
         */
        handlers.bind(commands.treeAddFile.config.keyboardShortcut, () => {
            if (this.loading) return;
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
        handlers.bind(commands.treeAddFolder.config.keyboardShortcut, () => {
            if (this.loading) return;
            let lastSelected = getLastSelected();
            let dirPath = lastSelected.isDir ? lastSelected.filePath : utils.getDirectory(lastSelected.filePath);
            inputDialog.open({
                header: "Enter a folder name",
                onOk: (value: string) => {
                    let filePath = value;
                    server.addFolder({ filePath }).then(res => {
                        ui.notifyInfoQuickDisappear('Folder created');
                    });
                },
                onEsc: () => {
                    setTimeout(handleFocusRequestBasic, 150);
                },
                filterValue: dirPath + '/',
            });
            return false;
        });
        handlers.bind(commands.treeDuplicateFile.config.keyboardShortcut, () => {
            if (this.loading) return;
            let selection = goDownToSmallestSelection();
            if (!selection) {
                ui.notifyInfoNormalDisappear('Nothing selected');
                return false;
            }

            let parentDir = utils.getDirectory(selection.selectedFilePath);
            if (selection.isDir) {
                inputDialog.open({
                    header: "Enter a new directory name",
                    onOk: (value: string) => {
                        let filePath = value;
                        server.duplicateDir({ src: selection.selectedFilePath, dest: filePath });
                        setAsOnlySelectedNoFocus(filePath, true);
                        this.state.expansionState[filePath] = true;
                        this.setState({ expansionState: this.state.expansionState });
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
                        server.duplicateFile({ src: selection.selectedFilePath, dest: filePath });
                        commands.doOpenOrFocusFile.emit({ filePath: filePath });
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
        handlers.bind([commands.treeMoveFile.config.keyboardShortcut, commands.treeRenameFile.config.keyboardShortcut], () => {
            if (this.loading) return;
            let selection = goDownToSmallestSelection();
            if (!selection) {
                ui.notifyInfoNormalDisappear('Nothing selected');
                return false;
            }

            inputDialog.open({
                header: "Enter a new location",
                onOk: (value: string) => {
                    let filePath = value;
                    server.movePath({ src: selection.selectedFilePath, dest: filePath }).then(res => {

                        if (res.error) {
                            ui.notifyWarningNormalDisappear("Failed to move: " + res.error);
                            return;
                        }

                        if (selection.isDir) {
                            setAsOnlySelectedNoFocus(filePath, true);
                            this.state.expansionState[filePath] = true;
                            this.setState({ expansionState: this.state.expansionState });
                            commands.closeFilesDirs.emit({ files: [], dirs: [selection.selectedFilePath] });
                        }
                        else {
                            commands.doOpenOrFocusFile.emit({ filePath: filePath });
                            setAsOnlySelectedNoFocus(filePath, false);
                            commands.closeFilesDirs.emit({ files: [selection.selectedFilePath], dirs: [] });
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
        handlers.bind([commands.treeDeleteFile.config.keyboardShortcut, "backspace"], () => {
            if (this.loading) return;
            let selectedFilePaths = Object.keys(this.state.selectedPaths);
            let selectedFilePathsDetails = selectedFilePaths.map(fp => {
                return {
                    filePath: fp,
                    isDir: this.state.selectedPaths[fp].isDir
                };
            });

            if (selectedFilePaths.length == 0) {
                ui.notifyInfoNormalDisappear('Nothing selected');
                return false;
            }

            if (selectedFilePaths.some(fp => fp == this.state.treeRoot.filePath)) {
                ui.notifyWarningNormalDisappear(`You cannot delete the root working directory`);
                return false;
            }


            inputDialog.open({
                hideInput: true,
                header: `Delete ${selectedFilePaths.length > 1 ? selectedFilePaths.length + ' items' : utils.getFileName(selectedFilePaths[0])}?`,
                onOk: () => {
                    let files = selectedFilePathsDetails.filter(x => !x.isDir).map(x => x.filePath);
                    let dirs = selectedFilePathsDetails.filter(x => x.isDir).map(x => x.filePath);
                    server.deleteFromDisk({ files, dirs }).then(res => {
                        commands.closeFilesDirs.emit({ files, dirs });

                        // Leave selection in a useful state
                        let lastSelectedDetails = selectedFilePathsDetails[selectedFilePathsDetails.length - 1].filePath;
                        setAsOnlySelected(utils.getDirectory(lastSelectedDetails), true);
                    });
                },
                onEsc: () => {
                    setTimeout(handleFocusRequestBasic, 150);
                }
            })

            return false;
        });

        handlers.bind(commands.treeOpenInExplorerFinder.config.keyboardShortcut, () => {
            if (this.loading) return;
            let selection = goDownToSmallestSelection();
            if (!selection) {
                ui.notifyInfoNormalDisappear('Nothing selected');
                return false;
            }

            let dirFilePath = selection.selectedFilePath;
            if (!selection.isDir) {
                dirFilePath = utils.getDirectory(dirFilePath);
            }

            server.launchDirectory({ filePath: dirFilePath });
            ui.notifySuccessNormalDisappear(`Command to open sent: ${dirFilePath}`);

            return false;
        });

        handlers.bind(commands.treeOpenInCmdTerminal.config.keyboardShortcut, () => {
            if (this.loading) return;
            let selection = goDownToSmallestSelection();
            if (!selection) {
                ui.notifyInfoNormalDisappear('Nothing selected');
                return false;
            }

            let dirFilePath = selection.selectedFilePath;
            if (!selection.isDir) {
                dirFilePath = utils.getDirectory(dirFilePath);
            }

            server.launchTerminal({ filePath: dirFilePath });
            ui.notifySuccessNormalDisappear(`Command to open cmd/terminal sent: ${dirFilePath}`);

            return false;
        });

        /**
         * navigation handlers
         */
        handlers.bind('enter', () => {
            if (this.loading) return;
            let { selectedFilePath, isDir } = goDownToSmallestSelection();
            if (isDir) {
                this.state.expansionState[selectedFilePath] = !this.state.expansionState[selectedFilePath];
                this.setState({ expansionState: this.state.expansionState });
            } else {
                commands.doOpenOrFocusFile.emit({ filePath: selectedFilePath });
            }
            return false;
        });
        handlers.bind('up', () => {
            if (this.loading) return;
            let { selectedFilePath, isDir } = goDownToSmallestSelection();

            // if root do nothing
            if (selectedFilePath == this.state.treeRoot.filePath) {
                return;
            }

            // find the parent dir &&
            // find this in the parent dir
            let parentDirFilePath = utils.getDirectory(selectedFilePath);
            let parentDirTreeItem = this.dirLookup[parentDirFilePath];
            let indexInParentDir = isDir
                ? parentDirTreeItem.subDirs.map(x => x.filePath).indexOf(selectedFilePath)
                : parentDirTreeItem.files.map(x => x.filePath).indexOf(selectedFilePath);

            /** Goes to the bottom file / folder */
            let gotoBottomOfFolder = (closestDir: TreeDirItem) => {
                while (true) {
                    if (!this.state.expansionState[closestDir.filePath]) { // if not expanded, we have a winner
                        setAsOnlySelected(closestDir.filePath, true);
                        break;
                    }
                    if (closestDir.files.length) { // Lucky previous expanded dir has files, select last!
                        setAsOnlySelected(closestDir.files[closestDir.files.length - 1].filePath, false);
                        break;
                    }
                    else if (closestDir.subDirs.length) { // does it have folders? ... check last folder next
                        closestDir = closestDir.subDirs[closestDir.subDirs.length - 1];
                        continue;
                    }
                    else { // no folders no files ... we don't care if you are expanded or not
                        setAsOnlySelected(closestDir.filePath, true);
                        break;
                    }
                }
            }

            // if first
            if (indexInParentDir == 0) {
                if (isDir) {
                    setAsOnlySelected(parentDirFilePath, true);
                }
                else if (parentDirTreeItem.subDirs.length == 0) {
                    setAsOnlySelected(parentDirFilePath, true);
                }
                else {
                    gotoBottomOfFolder(parentDirTreeItem.subDirs[parentDirTreeItem.subDirs.length - 1]);
                }
            }
            // if this is not the first file in the folder select the previous file
            else if (!isDir) {
                setAsOnlySelected(parentDirTreeItem.files[indexInParentDir - 1].filePath, false);
            }
            // Else select the deepest item in the previous directory
            else {
                let closestDir = parentDirTreeItem.subDirs[indexInParentDir - 1];
                gotoBottomOfFolder(closestDir);
            }
            return false;
        });
        handlers.bind('down', () => {
            if (this.loading) return;
            let { selectedFilePath, isDir } = goDownToSmallestSelection();

            /** Goes to next sibling on any (recursive) parent folder */
            let gotoNextSiblingHighUp = (treeItem: TreeDirItem) => {
                // Special handling for root. Don't change selection :)
                if (treeItem.filePath == this.state.treeRoot.filePath) {
                    return;
                }

                let parentDirFilePath = utils.getDirectory(treeItem.filePath);
                let parentTreeItem = this.dirLookup[parentDirFilePath];

                let indexInParent = parentTreeItem.subDirs.map(x => x.filePath).indexOf(treeItem.filePath);
                if (indexInParent !== (parentTreeItem.subDirs.length - 1)) { // If not last we have a winner
                    setAsOnlySelected(parentTreeItem.subDirs[indexInParent + 1].filePath, true);
                }
                else if (parentTreeItem.files.length) { // if parent has files move on to files
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
                let indexInParent = parentTreeItem.files.map(f => f.filePath).indexOf(selectedFilePath);

                // if not last select next sibling
                if (indexInParent !== (parentTreeItem.files.length - 1)) {
                    setAsOnlySelected(parentTreeItem.files[indexInParent + 1].filePath, false);
                }
                // If is last go on to parent dir sibling algo
                else {
                    gotoNextSiblingHighUp(parentTreeItem);
                }
            }

            return false;
        });
        handlers.bind('left', () => {
            if (this.loading) return;
            let { selectedFilePath, isDir } = goDownToSmallestSelection();
            if (isDir) {
                // if expanded then collapse
                if (this.state.expansionState[selectedFilePath]) {
                    delete this.state.expansionState[selectedFilePath];
                    this.setState({ expansionState: this.state.expansionState });
                    return;
                }
                // if root ... leave
                if (this.state.treeRoot.filePath == selectedFilePath) {
                    return;
                }
            }
            // Goto the parent directory
            setAsOnlySelected(utils.getDirectory(selectedFilePath), true);

            return false;
        });
        handlers.bind('right', () => {
            if (this.loading) return;
            let { selectedFilePath, isDir } = goDownToSmallestSelection();
            if (isDir) {
                // just expand
                this.state.expansionState[selectedFilePath] = true;
                this.setState({ expansionState: this.state.expansionState });
                return false;
            }
            return false;
        });
        handlers.bind('h', () => {
            this.setState({ showHelp: !this.state.showHelp });
        });
        handlers.bind('c', () => {
            let copyButtonRef = this.ref('copypath');
            if (!copyButtonRef) {
                ui.notifyInfoNormalDisappear('Nothing selected');
                return;
            }
            let copypathDom = ReactDOM.findDOMNode(copyButtonRef);
            (copypathDom as any).click();
        });

        /**
         * TS to js and JS to ts
         */
        handlers.bind('t', () => {
            if (this.loading) return;
            let selection = goDownToSmallestSelection();
            if (!selection) {
                ui.notifyInfoNormalDisappear('Nothing selected');
                return false;
            }

            let filePath = selection.selectedFilePath;
            if (selection.isDir ||
                (!filePath.endsWith('.js')) && !filePath.endsWith('.jsx')) {
                ui.notifyInfoNormalDisappear('Please select a `.js`/`jsx` file');
                return false;
            }

            const newFilePath = filePath.replace(/\.js$/g, '.ts').replace(/\.jsx$/g, '.tsx');
            server.movePath({ src: filePath, dest: newFilePath }).then(res => {
                commands.doOpenOrFocusFile.emit({ filePath: newFilePath });
                setAsOnlySelectedNoFocus(newFilePath, false);
                commands.closeFilesDirs.emit({ files: [filePath], dirs: [] });
                ui.notifySuccessNormalDisappear('File extension changed to be TypeScript');
            });

            return false;
        });
        handlers.bind('j', () => {
            if (this.loading) return;
            let selection = goDownToSmallestSelection();
            if (!selection) {
                ui.notifyInfoNormalDisappear('Nothing selected');
                return false;
            }

            let filePath = selection.selectedFilePath;
            if (selection.isDir ||
                (!filePath.endsWith('.ts')) && !filePath.endsWith('.tsx')) {
                ui.notifyInfoNormalDisappear('Please select a `.ts`/`tsx` file');
                return false;
            }

            const newFilePath = filePath.replace(/\.ts$/g, '.js').replace(/\.tsx$/g, '.jsx');
            server.movePath({ src: filePath, dest: newFilePath }).then(res => {
                commands.doOpenOrFocusFile.emit({ filePath: newFilePath });
                setAsOnlySelectedNoFocus(newFilePath, false);
                commands.closeFilesDirs.emit({ files: [filePath], dirs: [] });
                ui.notifySuccessNormalDisappear('File extension changed to be JavaScript');
            });

            return false;
        });
    }
    refNames = {
        __treeroot: '__treeroot',
        __treeViewScroll: '__treeViewScroll',
    }

    render() {
        let singlePathSelected = Object.keys(this.state.selectedPaths).length == 1
            && Object.keys(this.state.selectedPaths)[0];

        let hideStyle = !this.props.fileTreeShown && { display: 'none' };
        const haveFocus = this.state.treeScrollHasFocus;
        const helpOpacity = haveFocus ? 1 : 0;

        return (
            <div ref={this.refNames.__treeroot} className="alm-tree-root" style={csx.extend(csx.flexRoot, csx.horizontal, { width: this.state.width, zIndex: 6 }, hideStyle)}>

                <div style={csx.extend(csx.flex, csx.vertical, treeListStyle, styles.someChildWillScroll, csx.newLayerParent)}>
                    <div ref={this.refNames.__treeViewScroll} className={treeScrollClassName} style={csx.extend(csx.flex, csx.scroll)} tabIndex={0}
                        onFocus={() => this.setState({ treeScrollHasFocus: true })} onBlur={() => this.setState({ treeScrollHasFocus: false })}>
                        {this.renderDir(this.state.treeRoot)}
                    </div>
                    {this.props.filePathsCompleted || <Robocop />}
                    {
                        singlePathSelected
                        && <div style={csx.extend(csx.content, csx.horizontal, csx.center, csx.centerJustified, { paddingTop: '5px', paddingBottom: '5px', width: this.state.width - 15 + 'px' })}>
                            <clipboard.Clipboard ref='copypath' text={singlePathSelected} />
                            <span
                                className="hint--top"
                                data-hint="Click to copy the file path to clipboard"
                                data-clipboard-text={singlePathSelected}
                                style={currentSelectedItemCopyStyle as any}
                                onClick={() => ui.notifyInfoQuickDisappear("Path copied to clipboard")}>
                                {singlePathSelected}
                            </span>
                        </div>
                    }
                    <div style={csx.extend(csx.content, csx.centerCenter, { fontSize: '.7em', lineHeight: '2em', opacity: helpOpacity, transition: 'opacity .2s' })}>
                        <span>Tap <span style={styles.Tip.keyboardShortCutStyle}>H</span> to toggle tree view help</span>
                    </div>
                    {
                        this.state.showHelp
                        && <div style={csx.extend(csx.newLayer, csx.centerCenter, csx.flex, { background: 'rgba(0,0,0,.7)' })}
                            onClick={() => this.setState({ showHelp: false })}>
                            <div style={csx.extend(csx.flexRoot, csx.vertical)}>
                                <div style={helpRowStyle}>Tap <span style={styles.Tip.keyboardShortCutStyle}>ESC</span> to hide help</div>
                                <div style={helpRowStyle}>Tap <span style={styles.Tip.keyboardShortCutStyle}>A</span> to add a file</div>
                                <div style={helpRowStyle}>Tap <span style={styles.Tip.keyboardShortCutStyle}>Shift + A</span> to add a folder</div>
                                <div style={helpRowStyle}>Tap <span style={styles.Tip.keyboardShortCutStyle}>D</span> to duplicate file / folder</div>
                                <div style={helpRowStyle}>Tap <span style={styles.Tip.keyboardShortCutStyle}>M</span> to move file / folder</div>
                                <div style={helpRowStyle}>Tap <span style={styles.Tip.keyboardShortCutStyle}>R</span> to rename file / folder</div>
                                <div style={helpRowStyle}>Tap <span style={styles.Tip.keyboardShortCutStyle}>C</span> to copy path to clipboard</div>
                                <div style={helpRowStyle}>Tap <span style={styles.Tip.keyboardShortCutStyle}>O</span> to open in explorer/finder</div>
                                <div style={helpRowStyle}>Tap <span style={styles.Tip.keyboardShortCutStyle}>Shift + O</span> to open in cmd/terminal</div>
                                <div style={helpRowStyle}>Tap <span style={styles.Tip.keyboardShortCutStyle}>T</span> to change .js to .ts</div>
                                <div style={helpRowStyle}>Tap <span style={styles.Tip.keyboardShortCutStyle}>J</span> to change .ts to .js</div>
                                <div style={helpRowStyle}>Tap <span style={styles.Tip.keyboardShortCutStyle}>arrow keys</span> to browse</div>
                                <div style={helpRowStyle}>Tap <span style={styles.Tip.keyboardShortCutStyle}>del or backspace</span> to delete</div>
                                <div style={helpRowStyle}>Tap <span style={styles.Tip.keyboardShortCutStyle}>enter</span> to open file / expand dir</div>
                                <div style={helpRowStyle}>Tap <span style={styles.Tip.keyboardShortCutStyle}>{commands.modName} + \</span> to toggle tree view</div>
                                <div style={helpRowStyle}>Tap <span style={styles.Tip.keyboardShortCutStyle}>Shift + {commands.modName} + \</span> to locate open file in view</div>
                                <div style={helpRowStyle}>Tap <span style={styles.Tip.keyboardShortCutStyle}> {commands.modName} + 0</span> to focus on tree view</div>
                            </div>
                        </div>
                    }
                </div>

                <DraggableCore onDrag={this.handleDrag} onStop={this.handleDragStop}>
                    <div style={csx.extend(csx.flexRoot, csx.centerCenter, resizerStyle)}><Icon name="ellipsis-v" /></div>
                </DraggableCore>

            </div>
        );
    }
    renderDir(item: TreeDirItem, depth = 0) {
        let expanded = this.state.expansionState[item.filePath];
        let sub = expanded ? this.renderDirSub(item, depth) : [];
        let selected = !!this.state.selectedPaths[item.filePath];
        return (
            [<TreeNode.Dir
                key={item.filePath}
                ref={item.filePath}
                item={item}
                depth={depth}
                selected={selected}
                expanded={expanded}
                handleToggleDir={this.handleToggleDir}
                activeProjectFilePathTruthTable={this.props.activeProjectFilePathTruthTable}
            />].concat(sub)
        );
    }
    renderDirSub(item: TreeDirItem, depth: number) {
        return item.subDirs.map(item => this.renderDir(item, depth + 1))
            .concat(item.files.map(file => this.renderFile(file, depth + 1)));
    }
    renderFile(item: TreeFileItem, depth: number) {
        let selected = !!this.state.selectedPaths[item.filePath];
        return (
            <TreeNode.File ref={item.filePath} key={item.filePath}
                item={item}
                depth={depth}
                selected={selected}
                handleSelectFile={this.handleSelectFile}
                activeProjectFilePathTruthTable={this.props.activeProjectFilePathTruthTable} />
        );
    }

    handleDrag = (evt, ui: {
        node: Node
        deltaX: number, deltaY: number,
        lastX: number, lastY: number,
    }) => {
        this.setState({ width: ui.deltaX + ui.lastX + resizerWidth });
    };

    handleDragStop = () => {
        const width = this.state.width;
        settings.fileTreeWidth.set(width);
    }

    setupTree = throttle((props: Props) => {
        let filePaths = props.filePaths.filter(fp => fp.type == types.FilePathType.File).map(fp => fp.filePath);

        // initial boot up
        if (!filePaths.length) {
            return;
        }
        this.loading = false;

        let rootDirPath = props.rootDir;
        let rootDir: TreeDirItem = {
            name: utils.getFileName(rootDirPath),
            filePath: rootDirPath,
            subDirs: [],
            files: []
        }

        // Always expand root
        this.state.expansionState[rootDirPath] = true;

        this.dirLookup = {};
        this.dirLookup[rootDirPath] = rootDir;

        // if not found creates a new dir and set its parent
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

        for (let filePath of filePaths) {
            let dir = getDirectory(filePath);
            let fileName = getFileName(filePath);
            let subItem = {
                name: fileName,
                filePath: filePath,
            };

            // lookup existing dir
            let treeDir = this.dirLookup[dir];
            if (!treeDir) {
                treeDir = createDirAndMakeSureAllParentExits(dir);
            }
            treeDir.files.push(subItem);
        }

        this.setState({ treeRoot: rootDir, expansionState: this.state.expansionState });

        /** Also add the folders that may have no files */
        let dirs = props.filePaths.filter(fp => fp.type == types.FilePathType.Dir).map(fp => fp.filePath);
        dirs.forEach(dirPath => {
            let treeDir = this.dirLookup[dirPath];
            if (!treeDir) {
                createDirAndMakeSureAllParentExits(dirPath);
            }
        });

        /**
         * keep the selected file paths in sync with all the items that are available
         */
        // A map for easier lookup
        let filePathMap = utils.createMap(filePaths);
        let oldSelectedPaths = Object.keys(this.state.selectedPaths);
        let newSelectedPaths: SelectedPaths = {};
        oldSelectedPaths.forEach(path => {
            let isDir = this.state.selectedPaths[path].isDir;
            if (!filePathMap[path]) {
                return;
            }
            newSelectedPaths[path] = { isDir };
        });
        // If there is no selected path select the root
        if (Object.keys(newSelectedPaths).length === 0) {
            newSelectedPaths[rootDirPath] = { isDir: true };
        }
        this.setState({ selectedPaths: newSelectedPaths });

        /**
         * Loading had focus. Transfer focus to root
         */
        if (document.activeElement === this.refs['loading']) {
            setTimeout(() => {
                let selectedPaths: SelectedPaths = {
                    [this.state.treeRoot.filePath]: dirSelected
                };
                this.setState({ selectedPaths: selectedPaths });
                this.focusOnPath(this.state.treeRoot.filePath);
            }, 500);
        }
    }, 1000);

    handleToggleDir = (evt: React.SyntheticEvent<any>, item: TreeDirItem) => {
        evt.stopPropagation();
        let dirPath = item.filePath;

        let selectedPaths: SelectedPaths = {
            [dirPath]: dirSelected
        }
        this.state.expansionState[dirPath] = !this.state.expansionState[dirPath];

        this.setState({ expansionState: this.state.expansionState, selectedPaths: selectedPaths });
    }

    handleSelectFile = (evt: React.SyntheticEvent<any>, item: TreeFileItem) => {
        evt.stopPropagation();
        let filePath = item.filePath;

        let selectedPaths: SelectedPaths = {
            [filePath]: fileSelected
        };
        this.setState({ selectedPaths });
        commands.doOpenOrActivateFileTab.emit({ filePath });
    }

    focusOnPath(filePath: string) {
        if (!this.ref(filePath)) return;
        (this.refs['__treeViewScroll'] as any).focus();
        this.ref(filePath).focus();
    }

    componentWillUpdate(nextProps: Props, nextState: State) {
        if (nextState.width !== this.state.width
            || nextProps.fileTreeShown !== this.props.fileTreeShown) {
            tabState.debouncedResize();
        }
    }
}

export namespace TreeNode {
    export class Dir extends React.PureComponent<
        {
            item: TreeDirItem,
            depth: number,
            selected: boolean,
            expanded: boolean,
            handleToggleDir: (event: React.SyntheticEvent<any>, item: TreeDirItem) => any;
            activeProjectFilePathTruthTable: { [filePath: string]: boolean };
        }, {}>{
        focus(filePath: string) {
            (this.refs['root'] as any).scrollIntoViewIfNeeded(false);
        }

        render() {
            let { item, depth, expanded } = this.props;
            let icon = expanded ? 'folder-open' : 'folder';
            let selectedStyle = this.props.selected ? treeItemSelectedStyle : {};
            let inProjectStyle = this.props.activeProjectFilePathTruthTable[item.filePath] ? treeItemInProjectStyle : {};

            return (
                <div className={treeItemClassName} style={csx.extend(selectedStyle, inProjectStyle)} key={item.filePath} ref='root' tabIndex={-1} onClick={(evt) => this.props.handleToggleDir(evt, item)}>
                    <div style={{ marginLeft: depth * 10 }}> <Icon name={icon} /> {item.name}</div>
                </div>
            );
        }
    }

    /**
     * File Name Based Icon
     */
    class FileNameBasedIcon extends React.PureComponent<{ fileName: string }, {}> {
        render() {
            const fileName = this.props.fileName.toLowerCase();
            const ext = utils.getExt(fileName);

            // Default
            let iconName = 'file-text-o';

            if (ext == 'md') {
                iconName = 'book';
            }
            else if (ext == 'json') {
                iconName = 'database';
            }
            else if (ext == 'html' || ext == 'htm') {
                iconName = 'file-code-o';
            }
            else if (ext == 'css' || ext == 'less' || ext == 'scss' || ext == 'sass') {
                iconName = 'css3';
            }
            else if (ext.startsWith('git')) {
                iconName = 'github';
            }
            else if (ext.endsWith('sh') || ext == 'bat' || ext == 'batch') {
                iconName = 'terminal';
            }
            else if (ext.endsWith('coffee')) {
                iconName = 'coffee';
            }
            else if (utils.isTs(fileName)) {
                iconName = 'rocket';
            }
            else if (utils.isJs(fileName)) {
                iconName = 'plane';
            }
            else if (utils.isImage(fileName)) {
                iconName = 'file-image-o';
            }

            const icon = <Icon name={iconName} />;

            return <div>
                {icon} {this.props.fileName}
            </div>;
        }
    }

    /** Renders the file item */
    export class File extends React.PureComponent<{
        item: TreeFileItem;
        depth: number;
        selected: boolean;
        handleSelectFile: (event: React.SyntheticEvent<any>, item: TreeFileItem) => any;
        activeProjectFilePathTruthTable: { [filePath: string]: boolean };
    }, {}>{
        focus() {
            (this.refs['root'] as any).scrollIntoViewIfNeeded(false);
        }
        render() {
            const filePath = this.props.item.filePath;

            let selectedStyle = this.props.selected ? treeItemSelectedStyle : {};
            let inProjectStyle = this.props.activeProjectFilePathTruthTable[filePath] ? treeItemInProjectStyle : {};

            /** Determine if generated */
            let isGenerated = false;
            if (filePath.endsWith('.js')) {
                let noExtName = utils.removeExt(filePath);
                if (filePath.endsWith('.js.map')) noExtName = utils.removeExt(noExtName);
                const tsName = noExtName + '.ts';
                const tsxName = noExtName + '.tsx';
                isGenerated = !!this.props.activeProjectFilePathTruthTable[tsName] || !!this.props.activeProjectFilePathTruthTable[tsxName];
            }
            let isGeneratedStyle = isGenerated ? treeItemIsGeneratedStyle : {};

            return (
                <div className={treeItemClassName} style={csx.extend(selectedStyle, inProjectStyle, isGeneratedStyle)} ref='root' tabIndex={-1} onClick={(evt) => this.props.handleSelectFile(evt, this.props.item)}>
                    <div style={{ marginLeft: this.props.depth * 10 }}><FileNameBasedIcon fileName={this.props.item.name} /></div>
                </div>
            );
        }
    }
}
