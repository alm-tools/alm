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
import {Icon} from "./icon";

import {connect} from "react-redux";
import {StoreState,expandErrors,collapseErrors} from "./state/state";
import * as state from "./state/state";

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
        this.disposible.add(commands.toggleErrorMessagesPanel.on(()=>{
            state.getState().errorsExpanded?state.collapseErrors({}):state.expandErrors({});
        }));
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
                                <div key={`${i}:${j}`} style={[styles.hand, styles.errorsPanel.errorDetailsContainer]} onClick={()=>this.openErrorLocation(e)}>
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
                        <div style={styles.errorsPanel.filePath} onClick={()=>this.openErrorLocation(this.props.errorsByFilePath[filePath][0])}>{filePath}</div>

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
                    ?<span style={csx.extend(styles.noSelect,styles.statusBarSuccess, styles.hand)}
                        onClick={()=>ui.notifySuccessNormalDisappear("The file is a part of the currently active TypeScript project and we are actively providing code intelligence")}
                        title="File is part of the currently active project. Robots providing code intelligence.">
                        <Icon name="eye"/>
                     </span>
                    :<span
                        style={csx.extend(styles.noSelect,styles.statusBarError,styles.hand)}
                        onClick={()=>ui.notifyWarningNormalDisappear("The file is not a part of the currently active TypeScript project")}
                        title="File is not a part of the currently active project. Robots deactivated.">
                            <Icon name="eye-slash"/>
                     </span>}
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
                    <span style={csx.extend(styles.statusBarSection, styles.noSelect, styles.hand)} onClick={this.toggleErrors} title={`${errorCount} errors. Click to toggle error panel.`}>
                        <span style={csx.extend(errorCount?styles.statusBarError:styles.statusBarSuccess,{transition: 'color .4s'})}>{errorCount} <Icon name="times-circle"/></span>
                    </span>
                    {this.props.activeProject?<span style={csx.extend(styles.statusBarSection)}>{this.props.activeProject}</span>:''}
                    {inActiveProjectSection}
                    {this.props.currentFilePath
                        ?<span
                            title="Click to copy"
                            data-clipboard-text={this.props.currentFilePath}
                            onClick={()=>ui.notifyInfoQuickDisappear("File path copied to clipboard")}
                            style={csx.extend(styles.statusBarSection,styles.noSelect,styles.hand)}>
                                {this.props.currentFilePath}
                        </span>
                        :''}


                    {/* seperator */}
                    <span style={csx.flex}></span>

                    {/* Right sections */}
                    <span style={csx.extend(styles.statusBarSection)}>
                        <PendingRequestsIndicator />
                    </span>
                    <span style={csx.extend(styles.statusBarSection, styles.noSelect, styles.hand)} onClick={this.giveStar} title="If you like it then you should have put a star on it 🌟. Also, go here for support ⚠️">🌟</span>
                    <span style={csx.extend(styles.statusBarSection, styles.noSelect, styles.hand)} onClick={this.giveRose} title="Your follows keep this rose alive 🌹">🌹</span>
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
        window.open('https://github.com/TypeScriptBuilder/tsb')
    }

    giveRose = () => {
        window.open('https://twitter.com/basarat')
    }
}
