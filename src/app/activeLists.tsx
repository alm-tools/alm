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
let {DraggableCore} = ui;

import {connect} from "react-redux";
import {StoreState,expandErrors,collapseErrors} from "./state/state";
import * as state from "./state/state";
import * as gotoHistory from "./gotoHistory";

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
    activeProject?: ActiveProjectConfigDetails;
    activeProjectFiles?: { [filePath: string]: boolean };
    selectedTabIndex?: number;
    errorsUpdate?: ErrorsUpdate;
    socketConnected?: boolean;
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
        selectedTabIndex: state.selectedTabIndex,
        errorsUpdate: state.errorsUpdate,
        socketConnected: state.socketConnected
    };
})
export class ActiveLists extends BaseComponent<Props, State>{
    constructor(props:Props){
        super(props);
        this.state = {
            height: 250,
        }
    }

    componentDidMount() {
        this.disposible.add(commands.toggleMessagePanel.on(()=>{
            state.getState().errorsExpanded?state.collapseErrors({}):state.expandErrors({});
        }));
    }

    render(){
        let errorPanel = undefined;
        if (this.props.errorsExpanded){
            errorPanel = <div>

            <DraggableCore onDrag={this.handleDrag} onStop={this.handleStop}>
                <div style={csx.extend(csx.flexRoot, csx.centerCenter, resizerStyle)}><Icon name="ellipsis-h"/></div>
            </DraggableCore>

            <div style={csx.extend(styles.errorsPanel.main,{height: this.state.height})}>
                {
                    this.props.errorsUpdate.tooMany
                    && <div style={styles.errorsPanel.tooMany}>{this.props.errorsUpdate.totalCount} are too many. So only syncing the top {this.props.errorsUpdate.syncCount} (max 50 per file with a total limit of 200+).</div>
                }

                {this.props.errorsUpdate.totalCount?
                    Object.keys(this.props.errorsUpdate.errorsByFilePath)
                    .filter(filePath=>!!this.props.errorsUpdate.errorsByFilePath[filePath].length)
                    .map((filePath,i)=>{

                        let errors =
                            this.props.errorsUpdate.errorsByFilePath[filePath]
                                .map((e, j) => (
                                    <div key={`${i}:${j}`} style={csx.extend(styles.hand, styles.errorsPanel.errorDetailsContainer)} onClick={()=>this.openErrorLocation(e)}>
                                        <div style={styles.errorsPanel.errorDetailsContent}>
                                            <div style={styles.errorsPanel.errorMessage}>
                                                🐛({e.from.line+1}:{e.from.ch+1}) {e.message}
                                                {' '}<Clipboard text={`${e.filePath}:${e.from.line+1} ${e.message}`}/>
                                            </div>
                                            {e.preview?<div style={styles.errorsPanel.errorPreview}>{e.preview}</div>:''}
                                        </div>
                                    </div>
                                ));

                        return <div key={i}>
                            <div style={styles.errorsPanel.filePath} onClick={()=>this.openErrorLocation(this.props.errorsUpdate.errorsByFilePath[filePath][0])}>
                                <Icon name="file-code-o" style={{fontSize: '.8rem'}}/> {filePath} ({errors.length})
                            </div>

                            <div style={styles.errorsPanel.perFileList}>
                                {errors}
                            </div>
                        </div>
                    }): <div style={styles.errorsPanel.success}>No Errors ❤</div>
                }
            </div>
            </div>
        }

        return (
            <div>
                <ui.VelocityTransitionGroup
                    enter={{animation: "slideDown", duration: 150}}
                    leave={{animation: "slideUp", duration: 150}}>
                    {errorPanel}
                </ui.VelocityTransitionGroup>
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
        // TODO store as user setting
    }
}
