import styles = require("./styles/styles");
import React = require("react");
import Radium = require('radium');
import csx = require('csx');
import {BaseComponent} from "./ui";
import * as ui from "./ui";

export interface Props extends React.Props<any> {

}
export interface State {
    activeProject: string;
}

/**
 * The singleton status bar
 */
export var statusBar: StatusBar;

@ui.Radium
export class StatusBar extends BaseComponent<Props, State>{
    constructor(props:Props){
        super(props);
    }
    
    setActiveProject(activeProject: string){
        this.setState({activeProject});
    }
    
    render(){
        
        let activeProject = this.state.activeProject;
        
        return <div style={[styles.statusBar,csx.horizontal,csx.center]}>
            <span style={styles.statusBarSection}>🌹</span> 
            <span style={styles.statusBarSection}>{activeProject}</span>
        </div>
    }
}