import utils = require("../common/utils");
import styles = require("./styles/styles");
import React = require("react");
import ReactDOMServer = require("react-dom/server");
import Radium = require('radium');
import csx = require('csx');
import {BaseComponent} from "./ui";
import * as ui from "./ui";
import {cast,server} from "../socket/socketClient";
import * as commands from "./commands/commands";
import * as types from "../common/types";
import {Clipboard} from "./clipboard";
import {PendingRequestsIndicator} from "./pendingRequestsIndicator";
import {Icon} from "./icon";

import {connect} from "react-redux";
import {StoreState,expandErrors,collapseErrors} from "./state/state";
import * as state from "./state/state";


let notificationKeyboardStyle = {
    border: '2px solid',
    borderRadius: '6px',
    display: 'inline-block',
    padding: '5px',
    background: 'grey',
}
const ouputStatusStyle = csx.extend(styles.noSelect, {fontSize:'.6rem'});

export interface Props {
    // from react-redux ... connected below
    errorsExpanded?: boolean;
    activeProject?: ActiveProjectConfigDetails;
    activeProjectFiles?: { [filePath: string]: boolean };
    errorsUpdate?: LimitedErrorsUpdate;
    socketConnected?: boolean;
    tabs?: state.TabInstance[];
    selectedTabIndex?: number;
    outputStatusCache?: types.JSOutputStatusCache
}
export interface State {
}

const projectTipKeboard = ReactDOMServer.renderToString(<div style={notificationKeyboardStyle}>Alt+Shift+P</div>);

/**
 * The singleton status bar
 */
export var statusBar: StatusBar;

@connect((state: StoreState): Props => {
    return {
        errorsExpanded: state.errorsExpanded,
        activeProject: state.activeProject,
        activeProjectFiles: state.activeProjectFilePathTruthTable,
        errorsUpdate: state.errorsUpdate,
        socketConnected: state.socketConnected,
        tabs: state.tabs,
        selectedTabIndex: state.selectedTabIndex,
        outputStatusCache: state.outputStatusCache
    };
})
export class StatusBar extends BaseComponent<Props, State>{
    constructor(props:Props){
        super(props);
        this.state = {
        }
    }

    componentDidMount() {
        statusBar = this;
    }

    render() {
        let tab = state.getSelectedTab();
        let filePath = tab && utils.getFilePathFromUrl(tab.url);
        let protocol = tab && utils.getFilePathAndProtocolFromUrl(tab.url).protocol;

        let inActiveProjectSection =
            !tab
            ? ''
            : <span style={styles.statusBarSection}>
                {state.inActiveProjectUrl(tab.url)
                    ?<span
                        className="hint--top hint--success"
                        style={csx.extend(styles.noSelect,styles.statusBarSuccess, styles.hand)}
                        onClick={()=>ui.notifySuccessNormalDisappear(`The file is a part of the currently active TypeScript project and we are actively providing code intelligence`)}
                        data-hint="File is part of the currently active project. 💻 providing code intelligence.">
                        <Icon name="eye"/>
                     </span>
                    :this.props.activeProject && <span
                        className="hint--top"
                        style={csx.extend(styles.noSelect,styles.statusBarError,styles.hand)}
                        onClick={() => ui.notifyWarningNormalDisappear(`The file is not a part of the currently active TypeScript project <br/> <br/> ${projectTipKeboard}`, { onClick: () => commands.omniSelectProject.emit({}) }) }
                        data-hint="File is not a part of the currently active project. Robots deactivated.">
                            <Icon name="eye-slash"/>
                     </span>}
            </span>;

        const fileOutputState = protocol !== 'file' ? null
            : !this.props.outputStatusCache[filePath] ? null
            : this.props.outputStatusCache[filePath].state;

        const fileOutputStateRendered =
            fileOutputState
            && <span style={styles.statusBarSection}>
                <span style={csx.extend(ouputStatusStyle)}>
                {
                    fileOutputState === types.JSOutputState.EmitSkipped ? null
                    : fileOutputState === types.JSOutputState.NoJSFile ? null
                    : fileOutputState === types.JSOutputState.JSOutOfDate ? <span style={csx.extend(styles.statusBarError,{transition: 'color .5s'})}>❌ JS Outdated</span>
                    : <span style={csx.extend(styles.statusBarSuccess,{transition: 'color .5s'})}>✓ JS Current</span>
                }
                </span>
            </span>;

        return (
            <div>
                <div style={csx.extend(styles.statusBar,csx.horizontal,csx.center, styles.noWrap)}>
                    {/* Left sections */}
                    <span style={csx.extend(styles.statusBarSection, styles.noSelect, styles.hand)}
                        onClick={this.toggleErrors}
                        className="hint--top"
                        data-hint={`${this.props.errorsUpdate.totalCount} errors. Click to toggle message panel.`}>
                        <span style={csx.extend(this.props.errorsUpdate.totalCount?styles.statusBarError:styles.statusBarSuccess,{transition: 'color .4s'})}>
                            {this.props.errorsUpdate.totalCount} <Icon name="times-circle"/>
                        </span>
                    </span>
                    {this.props.activeProject
                        ?<span style={csx.extend(styles.statusBarSection,styles.hand)} onClick={()=>this.openFile(this.props.activeProject.tsconfigFilePath)}>
                            {this.props.activeProject.name}
                        </span>
                        :<span
                            className="hint--top"
                            style={csx.extend(styles.noSelect,styles.statusBarError,styles.hand)}
                            onClick={() => ui.notifyWarningNormalDisappear(`There is no active project. Please select from the available ones <br/> <br/> ${projectTipKeboard}`, { onClick: () => commands.omniSelectProject.emit({}) }) }
                            data-hint="There is no active TypeScript project. Robots deactivated.">
                                <Icon name="eye-slash"/>
                         </span>}
                    {inActiveProjectSection}
                    {filePath
                        ?<span
                            className="hint--top"
                            data-hint="Click to copy the file path to clipboard"
                            data-clipboard-text={filePath.replace(/\//g,commands.windows?'\\':'/')}
                            onClick={()=>ui.notifyInfoQuickDisappear("File path copied to clipboard")}
                            style={csx.extend(styles.statusBarSection,styles.noSelect,styles.hand)}>
                                {filePath}
                        </span>
                        :''}
                    {fileOutputStateRendered}

                    {/* seperator */}
                    <span style={csx.flex}></span>

                    {/* Right sections */}
                    <span style={csx.extend(styles.statusBarSection)}>
                        <PendingRequestsIndicator />
                    </span>
                    <span style={csx.extend(styles.statusBarSection)}>
                        {this.props.socketConnected?
                             <span className="hint--left hint--success" data-hint="Connected to server"> <Icon style={{color:styles.successColor, cursor:'pointer'}} name="flash" onClick={()=>ui.notifySuccessNormalDisappear("Connected to alm server")}/></span>
                            :<span className="hint--left hint--error" data-hint="Disconnected from server"> <Icon style={{color:styles.errorColor, cursor:'pointer'}} name="spinner" spin={true} onClick={()=>ui.notifyWarningNormalDisappear("Disconneted from alm server")}/></span>}
                    </span>
                    <span style={csx.extend(styles.statusBarSection, styles.noSelect, styles.hand)}>
                        <span style={{paddingRight: '2px'} as any} onClick={this.giveStar} className="hint--left" data-hint="If you like it then you should have put a star on it 🌟. Also, go here for support ⚠️">🌟</span>
                        <span onClick={this.giveRose} className="hint--left" data-hint="Your love keep this rose alive 🌹">🌹</span>
                    </span>
                </div>
            </div>
        );
    }

    toggleErrors = () => {
        if (this.props.errorsExpanded){
            collapseErrors({});
        }
        else{
            expandErrors({});
        }
    }

    openErrorLocation = (error: CodeError) => {
        commands.doOpenOrFocusFile.emit({ filePath: error.filePath, position: error.from });
    }

    openFile = (filePath: string) => {
        commands.doOpenOrFocusFile.emit({ filePath });
    }

    giveStar = () => {
        window.open('https://github.com/alm-tools/alm')
    }

    giveRose = () => {
        window.open('https://twitter.com/basarat')
    }
}
