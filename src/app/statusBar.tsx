import utils = require("../common/utils");
import styles = require("./styles/styles");
import React = require("react");
import Radium = require('radium');
import csx = require('csx');
import {BaseComponent} from "./ui";
import * as ui from "./ui";
import {cast,server} from "../socket/socketClient";
import * as commands from "./commands/commands";
import * as types from "../common/types";
import {Clipboard} from "./clipboard";
import {PendingRequestsIndicator} from "./pendingRequestsIndicator";

import {connect} from "react-redux";
import {StoreState,expandErrors,collapseErrors} from "./state/state";

export interface Props extends React.Props<any> {
    // from react-redux ... connected below
    errorsExpanded?: boolean;
    activeProject?: string;
    inActiveProject?: types.TriState;
    currentFilePath?: string;
    errorsByFilePath?: ErrorsByFilePath;
}
export interface State {
}

/**
 * The singleton status bar
 */
export var statusBar: StatusBar;

@connect((state: StoreState): Props => {
    return {
        errorsExpanded: state.errorsExpanded,
        activeProject: state.activeProject,
        inActiveProject: state.inActiveProject,
        currentFilePath: state.currentFilePath,
        errorsByFilePath: state.errorsByFilePath,
    };
})
export class StatusBar extends BaseComponent<Props, State>{
    constructor(props:Props){
        super(props);
        this.state = {
        }
    }

    componentDidMount() {
    }

    render(){

        let errorCount = utils.selectMany(Object.keys(this.props.errorsByFilePath).map((k)=>this.props.errorsByFilePath[k])).length;

        let errorPanel = undefined;
        if (this.props.errorsExpanded){
            errorPanel = <div style={styles.errorsPanel.main}>
            {
                errorCount?
                Object.keys(this.props.errorsByFilePath)
                .filter(filePath=>!!this.props.errorsByFilePath[filePath].length)
                .map((filePath,i)=>{

                    let errors =
                        this.props.errorsByFilePath[filePath]
                            .map((e, j) => (
                                <div key={`${i}:${j}`} style={[styles.hand, styles.errorsPanel.errorDetailsContainer]} onClick={()=>this.openFile(filePath,e)}>
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
                        <div style={styles.errorsPanel.filePath} onClick={()=>this.openFile(filePath,this.props.errorsByFilePath[filePath][0])}>{filePath}</div>

                        <div style={styles.errorsPanel.perFileList}>
                            {errors}
                        </div>
                    </div>
                }): <div style={styles.errorsPanel.success}>No Errors ❤</div>
            }
            </div>
        }

        let inActiveProjectSection =
            this.props.inActiveProject == types.TriState.Unknown
            ? ''
            : <span style={styles.statusBarSection}>
                {this.props.inActiveProject == types.TriState.True
                    ?<span style={styles.noSelect} title="File is part of the currently active project. Robots providing code intelligence.">👍</span>
                    :<span style={styles.noSelect} title="File is not a part of the currently active project. Robots deactivated.">👎</span>}
            </span>
        return (
            <div>
                <ui.VelocityTransitionGroup
                    enter={{animation: "slideDown", duration: 150}}
                    leave={{animation: "slideUp", duration: 150}}>
                    {errorPanel}
                </ui.VelocityTransitionGroup>
                <div style={csx.extend(styles.statusBar,csx.horizontal,csx.center)}>
                    {/* Left sections */}
                    <span style={csx.extend(styles.statusBarSection, styles.noSelect)} title="Here have a rose. Because you deserve it 🌹">🌹</span>
                    {this.props.activeProject?<span style={csx.extend(styles.statusBarSection)}>{this.props.activeProject}</span>:''}
                    {this.props.currentFilePath
                        ?<span
                            title="Click to copy"
                            data-clipboard-text={this.props.currentFilePath}
                            style={csx.extend(styles.statusBarSection,styles.noSelect,styles.hand)}>
                                {this.props.currentFilePath}
                        </span>
                        :''}
                    {inActiveProjectSection}

                    {/* seperator */}
                    <span style={csx.flex}></span>

                    {/* Right sections */}
                    <PendingRequestsIndicator />
                    <span style={csx.extend(styles.statusBarSection, styles.noSelect, styles.hand)} onClick={this.toggleErrors} title={`${errorCount} errors. Click to toggle error panel.`}>
                        {errorCount ? <span style={styles.statusBarError}>{errorCount} 🔴</span> : <span style={styles.statusBarSuccess}>{errorCount} ⚪</span> }
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

    openFile = (filePath: string, error: CodeError) => {
        commands.doOpenOrFocusFile.emit({ filePath: filePath, position: error.from });
    }
}
