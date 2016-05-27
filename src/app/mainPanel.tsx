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
import {AvailableProjectConfig} from "../common/types";
import {Clipboard} from "./components/clipboard";
import {PendingRequestsIndicator} from "./pendingRequestsIndicator";
import {Icon} from "./components/icon";
import {ButtonBlack} from "./components/buttons";
import {InputBlack} from "./components/inputs";
let {DraggableCore} = ui;

import {connect} from "react-redux";
import {StoreState,expandErrors,collapseErrors} from "./state/state";
import * as state from "./state/state";
import * as gotoHistory from "./gotoHistory";
import {tabState,tabStateChanged} from "./tabs/v2/appTabsContainer";
import * as settings from "./state/settings";

let notificationKeyboardStyle = {
    border: '2px solid',
    borderRadius: '6px',
    display: 'inline-block',
    padding: '5px',
    background: 'grey',
}

export interface Props {
    // from react-redux ... connected below
    errorsExpanded?: boolean;
    activeProject?: AvailableProjectConfig;
    activeProjectFiles?: { [filePath: string]: boolean };
    errorsUpdate?: LimitedErrorsUpdate;
    socketConnected?: boolean;
    errorsDisplayMode?: types.ErrorsDisplayMode;
    errorsFilter?: string;
}
export interface State {
    /** height in pixels */
    height?: number;
}

let resizerWidth = 5;
let resizerStyle = {
    background: 'radial-gradient(#444,transparent)',
    height: resizerWidth+'px',
    cursor:'ns-resize',
    color: '#666',
}

@connect((state: StoreState): Props => {
    return {
        errorsExpanded: state.errorsExpanded,
        activeProject: state.activeProject,
        activeProjectFiles: state.activeProjectFilePathTruthTable,
        errorsUpdate: state.errorsUpdate,
        socketConnected: state.socketConnected,
        errorsDisplayMode: state.errorsDisplayMode,
        errorsFilter: state.errorsFilter,
    };
})
export class MainPanel extends BaseComponent<Props, State>{
    constructor(props:Props){
        super(props);
        this.state = {
            height: 250,
        }
    }

    componentDidMount() {
        settings.mainPanelHeight.get().then(res => {
            let height = res || this.state.height;
            height = Math.min(window.innerHeight - 100, height);
            this.setState({ height });
        });
        this.disposible.add(commands.toggleMessagePanel.on(()=>{
            state.getState().errorsExpanded?state.collapseErrors({}):state.expandErrors({});
        }));
        this.disposible.add(tabStateChanged.on(()=>{
            this.forceUpdate();
        }));
    }

    render(){
        let errorPanel = undefined;
        if (this.props.errorsExpanded){
            errorPanel = <div>

            <DraggableCore onDrag={this.handleDrag} onStop={this.handleStop}>
                <div style={csx.extend(csx.flexRoot, csx.centerCenter, resizerStyle)}><Icon name="ellipsis-h"/></div>
            </DraggableCore>

            <div style={csx.extend(styles.errorsPanel.main, { height: this.state.height }) }>
                {
                    <div
                        style={styles.errorsPanel.headerSection}>
                        <div style={csx.horizontal}>
                            <div style={csx.extend(csx.horizontal, csx.flex, csx.center, {marginRight:'10px'})}>
                                <ButtonBlack
                                    text={"Show All"}
                                    onClick={()=>state.setErrorsDisplayMode(types.ErrorsDisplayMode.all)}
                                    isActive={this.props.errorsDisplayMode == types.ErrorsDisplayMode.all}/>
                                <ButtonBlack
                                    text={"Show Only Open Files"}
                                    onClick={()=>state.setErrorsDisplayMode(types.ErrorsDisplayMode.openFiles)}
                                    isActive={this.props.errorsDisplayMode == types.ErrorsDisplayMode.openFiles}/>
                                <label style={{marginLeft:'10px'}}>
                                    Filter:
                                </label>
                                <InputBlack
                                    style={{marginRight:'10px', maxWidth:'200px'}}
                                    onChange={(value)=>state.setErrorsFilter(value)}
                                    value={this.props.errorsFilter}/>
                                <ButtonBlack
                                    text={"Clear"}
                                    disabled={!this.props.errorsFilter.trim()}
                                    onClick={()=>state.setErrorsFilter('')}/>
                            </div>
                            {this.props.errorsUpdate.tooMany
                                && <div
                                    style={styles.errorsPanel.tooMany}
                                    className="hint--bottom-left hint--info"
                                    data-hint="We only sync the top 50 per file with a limit of 250. That ensures that live linting doesn't slow anything else down.">
                                    {this.props.errorsUpdate.totalCount} total. Showing top {this.props.errorsUpdate.syncCount}.
                                </div>}
                        </div>
                    </div>
                }

                {
                    this.props.errorsUpdate.totalCount
                        ? this.renderErrors()
                        : <div style={styles.errorsPanel.success}>No Errors ❤</div>
                }
                </div>
            </div>
        }

        return (
            <div style={{zIndex:6 /* force over golden-layout */}}>
                {errorPanel}
            </div>
        );
    }

    renderErrors() {
        const errorsToRender: ErrorsByFilePath = tabState.errorsByFilePathFiltered().errorsByFilePath;
        return (
            <div style={{overflow:'auto'}}>{
            Object.keys(errorsToRender)
                .filter(filePath => !!errorsToRender[filePath].length)
                .map((filePath, i) => {

                    let errors =
                        errorsToRender[filePath]
                            .map((e, j) => (
                                <div key={`${i}:${j}`} style={csx.extend(styles.hand, styles.errorsPanel.errorDetailsContainer) } onClick={() => this.openErrorLocation(e) }>
                                    <div style={styles.errorsPanel.errorDetailsContent}>
                                        <div style={styles.errorsPanel.errorMessage}>
                                            🐛({e.from.line + 1}: {e.from.ch + 1}) {e.message}
                                            {' '}<Clipboard text={`${e.filePath}:${e.from.line + 1} ${e.message}`}/>
                                        </div>
                                        {e.preview ? <div style={styles.errorsPanel.errorPreview}>{e.preview}</div> : ''}
                                    </div>
                                </div>
                            ));

                    return <div key={i}>
                        <div style={styles.errorsPanel.filePath} onClick={() => this.openErrorLocation(errorsToRender[filePath][0]) }>
                            <Icon name="file-code-o" style={{ fontSize: '.8rem' }}/> {filePath} ({errors.length})
                        </div>

                        <div style={styles.errorsPanel.perFileList}>
                            {errors}
                        </div>
                    </div>
                })
            }</div>
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
        gotoHistory.gotoError(error);
    }

    openFile = (filePath: string) => {
        commands.doOpenOrFocusFile.emit({ filePath });
    }

    handleDrag = (evt, ui: {
        node: Node, position: {
            // lastX + deltaX === clientX
            deltaX: number, deltaY: number,
            lastX: number, lastY: number,
            clientX: number, clientY: number
        }
    }) => {
        this.setState({ height: utils.rangeLimited({ num: this.state.height - ui.position.deltaY, min: 100, max: window.innerHeight - 100 }) });
    };

    handleStop = () => {
        const height = this.state.height;
        settings.mainPanelHeight.set(height);
    }

    componentWillUpdate(nextProps: Props, nextState: State) {
        if (nextState.height !== this.state.height
            || nextProps.errorsExpanded !== this.props.errorsExpanded) {
            tabState.debouncedResize();
        }
    }
}
