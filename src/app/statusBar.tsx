import utils = require("../common/utils");
import styles = require("./styles/styles");
import React = require("react");
import ReactDOMServer = require("react-dom/server");
import * as csx from './base/csx';
import {BaseComponent} from "./ui";
import * as ui from "./ui";
import {cast,server} from "../socket/socketClient";
import * as commands from "./commands/commands";
import * as types from "../common/types";
import {AvailableProjectConfig} from "../common/types";
import {Clipboard} from "./components/clipboard";
import {PendingRequestsIndicator} from "./pendingRequestsIndicator";
import {Icon} from "./components/icon";
import {tabState,tabStateChanged} from "./tabs/v2/appTabsContainer";
import {Progress} from "./components/progress";

import {connect} from "react-redux";
import {StoreState,expandErrors,collapseErrors} from "./state/state";
import * as state from "./state/state";
import {errorsCache} from "./globalErrorCacheClient";
import {testResultsCache} from "./clientTestResultsCache";


let notificationKeyboardStyle = {
    border: '2px solid',
    borderRadius: '6px',
    display: 'inline-block',
    padding: '5px',
    background: 'grey',
}
const ouputStatusStyle = csx.extend(styles.noSelect, {fontSize:'.6rem'});

const activeProjectContainerStyle = csx.extend(
    styles.statusBarSection,
    styles.hand,
    styles.noSelect,
    {
        border: '1px solid grey',
        paddingTop: '2px',
        paddingBottom: '2px',
        paddingLeft: '4px',
        paddingRight: '4px',
        fontSize: '.7rem',
        marginTop: '1px',
    }
);

export interface Props {
    // from react-redux ... connected below
    errorsExpanded?: boolean;
    activeProject?: AvailableProjectConfig;
    activeProjectFiles?: { [filePath: string]: boolean };
    socketConnected?: boolean;
    outputStatusCache?: types.JSOutputStatusCache;
    liveBuildResults?: types.LiveBuildResults;
    fileTreeShown?: boolean;
    errorsDisplayMode?: types.ErrorsDisplayMode;
    errorsFilter?: string;
    tsWorking?: types.Working;
    testedWorking?: types.Working;
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
        socketConnected: state.socketConnected,
        outputStatusCache: state.outputStatusCache,
        liveBuildResults: state.liveBuildResults,
        fileTreeShown: state.fileTreeShown,
        errorsDisplayMode: state.errorsDisplayMode,
        errorsFilter: state.errorsFilter,
        tsWorking: state.tsWorking,
        testedWorking: state.testedWorking,
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
        tabStateChanged.on(()=>this.forceUpdate());
        errorsCache.errorsDelta.on(() => this.forceUpdate());
        testResultsCache.testResultsDelta.on(() => this.forceUpdate());
    }

    render() {
        let tab = tabState.getSelectedTab();
        let filePath = tab && utils.getFilePathFromUrl(tab.url);
        let protocol = tab && utils.getFilePathAndProtocolFromUrl(tab.url).protocol;

        const activeProjectDetails = this.props.activeProject
            ?<span
                className="hint--top-right"
                data-hint="Active Project path. Click to open project file"
                style={activeProjectContainerStyle}
                onClick={()=>{
                    this.openFile(this.props.activeProject.tsconfigFilePath);
                    ui.notifyInfoNormalDisappear(`TIP : You can change the active project using project search <br/> <br/> ${projectTipKeboard}`, { onClick: () => commands.omniSelectProject.emit({}) });
                }}>
                <span
                    style={csx.extend(styles.noSelect,styles.statusBarSuccess,styles.hand,{marginRight: '5px'})}>
                        <Icon name="heartbeat"/>
                 </span>
                {this.props.activeProject.isVirtual && <span
                    style={csx.extend(styles.noSelect,styles.statusBarSuccess,styles.hand,{marginRight: '5px'})}>
                        <Icon name="blind"/>
                 </span>}
                {this.props.activeProject.name}
            </span>
            :<span
                className="hint--top-right"
                style={csx.extend(styles.statusBarSection, styles.noSelect,styles.statusBarError,styles.hand)}
                onClick={() => ui.notifyWarningNormalDisappear(`There is no active project. Please select from the available ones <br/> <br/> ${projectTipKeboard}`, { onClick: () => commands.omniSelectProject.emit({}) }) }
                data-hint="There is no active TypeScript project. Robots deactivated.">
                    <Icon name="heartbeat"/>
             </span>;

        let inActiveProjectSection =
            !tab
            ? ''
            : <span style={styles.statusBarSection}>
                {state.inActiveProjectUrl(tab.url)
                    ?<span
                        className="hint--top-right hint--success"
                        style={csx.extend(styles.noSelect,styles.statusBarSuccess, styles.hand)}
                        onClick={()=>ui.notifySuccessNormalDisappear(`The file is a part of the currently active TypeScript project and we are actively providing code intelligence`)}
                        data-hint="File is part of the currently active project. 💻 providing code intelligence.">
                        <Icon name="eye"/>
                     </span>
                    :<span
                        className="hint--top-right"
                        style={csx.extend(styles.noSelect,styles.statusBarError,styles.hand)}
                        onClick={() => ui.notifyWarningNormalDisappear(`The file is not a part of the currently active TypeScript project <br/> <br/> ${projectTipKeboard}`, { onClick: () => commands.omniSelectProject.emit({}) }) }
                        data-hint="File is not a part of the currently active project. Robots deactivated.">
                            <Icon name="eye-slash"/>
                     </span>}
            </span>;

        const fileOutput = protocol !== 'file' ? null
            : !this.props.outputStatusCache[filePath] ? null
            : this.props.outputStatusCache[filePath]
        const fileOutputState = fileOutput && fileOutput.state;

        const openOutputJSFile = () => {
            commands.doToggleFileTab.emit({ filePath: fileOutput.outputFilePath });
        }

        const fileOutputStateRendered =
            !!fileOutputState
            && <span style={styles.statusBarSection}>
                <span style={csx.extend(ouputStatusStyle)}>
                {
                    fileOutputState === types.JSOutputState.NoJSFile ? null
                    : fileOutputState === types.JSOutputState.JSOutOfDate ? <span style={csx.extend(styles.statusBarError,{transition: 'color .5s', cursor:'pointer'})} onClick={openOutputJSFile}>❌ JS Outdated</span>
                    : <span style={csx.extend(styles.statusBarSuccess,{transition: 'color .5s', cursor:'pointer'})} onClick={openOutputJSFile}>✓ JS Current</span>
                }
                </span>
            </span>;

        const fileTreeToggleRendered = <span style={csx.extend(styles.statusBarSection, styles.noSelect, styles.hand)}
            onClick={this.toggleFileTree}
            className="hint--top-right"
            data-hint={`Click to toggle the file tree 🌲`}>
            <span style={csx.extend(this.props.fileTreeShown?{color:'white'}:{color:'grey'},{transition: 'color .4s'})}>
                <Icon name="tree"/>
            </span>
        </span>;

        const updateRendered =
            serverState.update
            && <span style={csx.extend(styles.statusBarSection) }>
                <span
                    className="hint--left hint--error"
                    data-hint={ `Update ${serverState.update.latest} available (current: ${serverState.update.current})` + ". Please run `npm i -g alm`"}>
                    <Icon style={{ color: styles.errorColor, cursor: 'pointer' }} name="wrench" onClick={this.whatsNew}/>
                </span>
            </span>;

        const errorsUpdate = errorsCache.getErrorsLimited();
        const errorFilteringActive = this.props.errorsDisplayMode !== types.ErrorsDisplayMode.all || this.props.errorsFilter.trim();
        const errorsFilteredCount = tabState.errorsByFilePathFiltered().errorsFlattened.length;

        /** Tested */
        const testResultsStats = testResultsCache.getStats();
        const failing = !!testResultsStats.failCount;
        const totalThatRan = testResultsStats.passCount + testResultsStats.failCount;
        const testStatsRendered = !!testResultsStats.testCount && <span
            className="hint--top-right"
            data-hint={`Test Total: ${testResultsStats.testCount}, Pass: ${testResultsStats.passCount}, Fail: ${testResultsStats.failCount}, Skip: ${testResultsStats.skipCount}, Duration: ${utils.formatMilliseconds(testResultsStats.durationMs)}`}
            style={csx.extend(activeProjectContainerStyle)}
            onClick={()=>{
                commands.doOpenTestResultsView.emit({});
            }}>
            <span
                style={csx.extend(
                    styles.noSelect,
                    failing ? styles.statusBarError : styles.statusBarSuccess,
                    styles.hand,
                    {
                        marginRight: '5px',
                        transition: '.4s color, .4s opacity',
                        opacity: this.props.testedWorking.working ? 1 : 0.5,
                    }
                )}>
                    <Icon name={styles.icons.tested} spin={this.props.testedWorking.working}/>
            </span>
            {
                failing
                ? <span style={{ color: styles.errorColor, fontWeight: 'bold'}}>{testResultsStats.failCount}/{totalThatRan} fail</span>
                : <span style={{ color: styles.successColor, fontWeight: 'bold'}}>{testResultsStats.passCount}/{totalThatRan} pass</span>
            }
        </span>

        return (
            <div>
                <div style={csx.extend(styles.statusBar,csx.horizontal,csx.center, styles.noWrap)}>
                    {/* Left sections */}
                    <span style={csx.extend(styles.statusBarSection, styles.noSelect, styles.hand)}
                        onClick={this.toggleErrors}
                        className="hint--top-right"
                        data-hint={`${errorsUpdate.totalCount} errors. Click to toggle message panel.`}>
                        <span style={csx.extend(errorsUpdate.totalCount?styles.statusBarError:styles.statusBarSuccess,{transition: 'color .4s'})}>
                            {errorsUpdate.totalCount} <Icon name="times-circle"/>
                            {errorFilteringActive && ' '}
                            {errorFilteringActive && <span>( {errorsFilteredCount} <Icon name="filter"/>)</span>}
                        </span>
                    </span>
                    <span style={csx.extend(styles.statusBarSection, styles.noSelect, styles.hand) }>
                        <span
                            className={this.props.tsWorking.working ? "hint--right hint--success" : "hint--right"}
                            data-hint={this.props.tsWorking.working ? "TS Worker Busy" : "TS Worker Idle"}
                            style={{
                                color: this.props.tsWorking.working ? 'white' : 'grey',
                                transition: 'color .4s'
                            }}>
                            <Icon name="rocket"/>
                        </span>
                    </span>
                    {testStatsRendered}
                    {fileTreeToggleRendered}
                    {activeProjectDetails}
                    {inActiveProjectSection}
                    {filePath
                        ?<span
                            className="hint--top-right"
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
                    {
                        this.props.liveBuildResults.builtCount !== this.props.liveBuildResults.totalCount &&
                        <span style={csx.extend(styles.statusBarSection)}>
                            <Progress current={this.props.liveBuildResults.builtCount} total={this.props.liveBuildResults.totalCount}>
                                {this.props.liveBuildResults.builtCount} / {this.props.liveBuildResults.totalCount}
                            </Progress>
                        </span>
                    }
                    <span style={csx.extend(styles.statusBarSection)}>
                        {this.props.socketConnected?
                             <span className="hint--left hint--success" data-hint="Connected to server"> <Icon style={{color:styles.successColor, cursor:'pointer'}} name="flash" onClick={()=>ui.notifySuccessNormalDisappear("Connected to alm server")}/></span>
                            :<span className="hint--left hint--error" data-hint="Disconnected from server"> <Icon style={{color:styles.errorColor, cursor:'pointer'}} name="spinner" spin={true} onClick={()=>ui.notifyWarningNormalDisappear("Disconneted from alm server")}/></span>}
                    </span>
                    <span style={csx.extend(styles.statusBarSection, styles.noSelect, styles.hand)}>
                        <span style={{paddingRight: '2px'} as any} onClick={this.giveStar} className="hint--left" data-hint={`If you like it then you should have put a star on it 🌟. Also, go here for support. Version: ${serverState.version}, TypeScript version: ${serverState.typescriptVersion}`}>🌟</span>
                        <span onClick={this.giveRose} className="hint--left" data-hint="Your love keep this rose alive 🌹">🌹</span>
                    </span>
                    {updateRendered}
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

    toggleFileTree = () => {
        if (this.props.fileTreeShown) {
            state.collapseFileTree({});
        }
        else {
            state.expandFileTree({});
        }
    }

    openErrorLocation = (error: types.CodeError) => {
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

    whatsNew = () => {
        /** We currently show the diff. Once we have semantic releases we will show release notes */
        const update = serverState.update;
        window.open(`https://github.com/alm-tools/alm/compare/v${update.current}...v${update.latest}`);
    }
}
