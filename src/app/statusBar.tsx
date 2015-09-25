import utils = require("../common/utils");
import styles = require("./styles/styles");
import React = require("react");
import Radium = require('radium');
import csx = require('csx');
import {BaseComponent} from "./ui";
import * as ui from "./ui";
import {cast,server} from "../socket/socketClient";

export interface Props extends React.Props<any> {

}
export interface State {
    activeProject?: string;
    errorsByFilePath?: { [filePath: string]: string[] };
    errorsExpanded?: boolean;
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
    
    componentDidMount() {
        server.getErrors({}).then((details)=>{
            this.state.errorsByFilePath = details;
            this.forceUpdate();
        })
        cast.errorsUpdated.on((details)=>{
            this.state.errorsByFilePath = details;
            this.forceUpdate();
        });
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
        
        let errorPanel = null;
        if (this.state.errorsExpanded){
            errorPanel = <div style={styles.errorsPanel.main}>
            {
                Object.keys(this.state.errorsByFilePath)
                .filter(filePath=>!!this.state.errorsByFilePath[filePath].length)
                .map((filePath,i)=>{
                    
                    let errors = 
                        this.state.errorsByFilePath[filePath]
                            .map((e, j) => (
                                <div key={`${i}:${j}`} style={[styles.hand,styles.errorsPanel.errorMessage]} onClick={()=>this.openFile(filePath,e)}>
                                        {e}
                                </div>
                            ));
                    
                    return <div key={i}>
                        <div style={styles.errorsPanel.filePath}>> {filePath}</div>
                        
                        <div style={styles.errorsPanel.perFileList}>
                            {errors}
                        </div>
                    </div>
                })
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
                        {errorCount.length} ⛔
                    </span> 
                    
                </div>
            </div>
        );
    }
    
    toggleErrors = () => {
        this.state.errorsExpanded = !this.state.errorsExpanded;
        this.setState({ errorsExpanded: this.state.errorsExpanded });
    }
    
    openFile = (filePath:string,error:string) => { 
        // TODO:
        console.log(filePath, error);
    }
}