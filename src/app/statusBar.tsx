import utils = require("../common/utils");
import styles = require("./styles/styles");
import React = require("react");
import Radium = require('radium');
import csx = require('csx');
import {BaseComponent} from "./ui";
import * as ui from "./ui";

export interface Props extends React.Props<any> {

}
export interface State {
    activeProject?: string;
    errorsByFilePath?: { [filePath: string]: string[] };
}

/**
 * The singleton status bar
 */
export var statusBar: StatusBar;

@ui.Radium
export class StatusBar extends BaseComponent<Props, State>{
    constructor(props:Props){
        super(props);
        this.state = {
            activeProject: '',
            errorsByFilePath: {}
        }
    }
    
    setActiveProject(activeProject: string){
        this.setState({activeProject});
    }
    
    setErrorsInFile(filePath:string,error:string[]){
        this.state.errorsByFilePath[filePath] = error;
    }
    
    render(){
        
        let activeProject = this.state.activeProject;
        let errorCount = utils.selectMany(Object.keys(this.state.errorsByFilePath).map((k)=>this.state.errorsByFilePath[k]));
        
        return <div style={[styles.statusBar,csx.horizontal,csx.center]}>
            {/* Left sections */}
            <span style={styles.statusBarSection}>🌹</span> 
            <span style={styles.statusBarSection}>{activeProject}</span>
            
            {/* seperator */}
            <span style={csx.flex}></span>
            
            {/* Right sections */}
            <span style={styles.statusBarSection}>
                {errorCount.length} ⛔
            </span> 
            
        </div>
    }
}