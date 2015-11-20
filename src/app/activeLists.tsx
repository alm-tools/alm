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

export interface Props extends React.Props<any> {
    // from react-redux ... connected below
    errorsExpanded?: boolean;
    activeProject?: ActiveProjectConfigDetails;
    activeProjectFiles?: { [filePath: string]: boolean };
    currentFilePath?: string;
    errorsByFilePath?: ErrorsByFilePath;
    socketConnected?: boolean;
}
export interface State {
}

@connect((state: StoreState): Props => {
    return {
        errorsExpanded: state.errorsExpanded,
        activeProject: state.activeProject,
        activeProjectFiles: state.activeProjectFilePathTruthTable,
        currentFilePath: state.currentFilePath,
        errorsByFilePath: state.errorsByFilePath,
        socketConnected: state.socketConnected
    };
})
export class ActiveLists extends BaseComponent<Props, State>{
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
                        <div style={styles.errorsPanel.filePath} onClick={()=>this.openErrorLocation(this.props.errorsByFilePath[filePath][0])}>
                            <Icon name="file-code-o" style={{fontSize: '.8rem'} as any}/> {filePath}
                        </div>

                        <div style={styles.errorsPanel.perFileList}>
                            {errors}
                        </div>
                    </div>
                }): <div style={styles.errorsPanel.success}>No Errors ❤</div>
            }
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
        commands.doOpenOrFocusFile.emit({ filePath: error.filePath, position: error.from });
    }

    openFile = (filePath: string) => {
        commands.doOpenOrFocusFile.emit({ filePath });
    }
}
