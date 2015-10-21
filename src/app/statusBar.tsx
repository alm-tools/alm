import utils = require("../common/utils");
import styles = require("./styles/styles");
import React = require("react");
import Radium = require('radium');
import csx = require('csx');
import {BaseComponent} from "./ui";
import * as ui from "./ui";
import {cast,server} from "../socket/socketClient";
import * as commands from "./commands/commands";

import {connect} from "react-redux";
import {StoreState,expandErrors,collapseErrors} from "./state/state";

export interface Props extends React.Props<any> {
    // from react-redux ... connected below
    errorsExpanded?: boolean;
    activeProject?: string;
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
        errorsByFilePath: state.errorsByFilePath
    };
})
@ui.Radium
export class StatusBar extends BaseComponent<Props, State>{
    constructor(props:Props){
        super(props);
        this.state = {
        }
    }

    componentDidMount() {
    }

    render(){

        let activeProject = this.props.activeProject;
        let errorCount = utils.selectMany(Object.keys(this.props.errorsByFilePath).map((k)=>this.props.errorsByFilePath[k])).length;

        let errorPanel = null;
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
                                <div key={`${i}:${j}`} style={[styles.hand]} onClick={()=>this.openFile(filePath,e)}>
                                        <div style={[styles.hand,styles.errorsPanel.errorMessage]}>
                                            {e.message}
                                        </div>
                                        {e.preview?<div style={styles.errorsPanel.errorPreview}>{e.preview}</div>:''}
                                </div>
                            ));

                    return <div key={i}>
                        <div style={styles.errorsPanel.filePath} onClick={()=>this.openFile(filePath,this.props.errorsByFilePath[filePath][0])}> {'>'} {filePath}</div>

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
                {errorPanel}
                <div style={[styles.statusBar,csx.horizontal,csx.center]}>
                    {/* Left sections */}
                    <span style={[styles.statusBarSection, styles.noSelect]}>🌹</span>
                    <span style={styles.statusBarSection}>{activeProject}</span>

                    {/* seperator */}
                    <span style={csx.flex}></span>

                    {/* Right sections */}
                    <span style={[styles.statusBarSection, styles.hand, styles.noSelect]} onClick={this.toggleErrors}>
                        {errorCount} ⛔
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
