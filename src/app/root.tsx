import * as React from "react";
import {BaseComponent, RaisedButton, AppBar, MenuItem, LeftNav, TextField, Dialog, FlatButton} from "./ui";
import * as ui from "./ui";
import * as csx from "csx";
import {TabsContainer} from "./tabs/tabsContainer";
import * as commands from "./commands/commands";
var Modal = require('react-modal');
import * as styles from "./styles/styles";

let menuItems = [
    { route: 'get-started', text: 'Get Started' },
    { route: 'customization', text: 'Customization' },
    { route: 'components', text: 'Components' },
    { type: MenuItem.Types.SUBHEADER, text: 'Resources' },
    {
        type: MenuItem.Types.LINK,
        payload: 'https://github.com/basarat/ped',
        text: 'GitHub'
    },
];

export interface State {
    isOmniSearchOpen?: boolean
}

@ui.Radium
export class Root extends BaseComponent<{}, State>{

    constructor(props: {}) {
        super(props);
        
        this.state = {};
    }

    refs: { 
        [string: string]: any; 
        leftNav: any; 
        omniSearch: any;
        omniSearchInput: any;
     }

    toggle = () => {
        this.refs.leftNav.toggle();
    }
    
    componentDidMount(){
        commands.findFile.on(()=>{
            console.log('find file');
            this.openOmniSearch();
        });
        commands.findCommand.on(()=>{
            console.log('find command');
            this.openOmniSearch();
        });
    }
    
    render() {
        
        let OmniSearchPanelActions = [
            <FlatButton
            label="Close"
            primary={true}
            onTouchTap={this.closeOmniSearch} />
        ]
        
        return <div>
                {
                //     <AppBar
                //     title="TypeScript Builder"
                //     iconClassNameRight="muidocs-icon-navigation-expand-more"
                //     onLeftIconButtonTouchTap={this.toggle}
                // />
                }
                <LeftNav ref="leftNav" docked={false} menuItems={menuItems} />
                
                <Modal
                      isOpen={this.state.isOmniSearchOpen}
                      onRequestClose={this.closeOmniSearch}>
                        <div style={[csx.vertical]}>
                            <div style={[csx.horizontal]}>
                                <h4>Omni Search</h4>
                                <div style={[csx.flex]}></div>
                                <div style={[styles.userTip]}>Press <code style={styles.keyStroke}>esc</code> to close</div>
                            </div>
                          
                            <TextField ref="omniSearchInput" floatingLabelText="Filter"/>
                            
                            <div style={[csx.vertical,csx.flex,{overflow:'auto'}]}>
                                <div style={[csx.vertical]}>
                                     <div>result</div>
                                     <div>result</div>
                                     <div>result</div>
                                     <div>result</div>
                                     <div>result</div>
                                     <div>result</div>
                                     <div>result</div>
                                     <div>result</div>
                                     <div>result</div>
                                     <div>result</div>
                                     <div>result</div>
                                     <div>result</div>
                                     <div>result</div>
                                     <div>result</div>
                                     <div>result</div>
                                     <div>result</div>
                                     <div>result</div>
                                     <div>result</div>
                                     <div>result</div>
                                     <div>result</div>
                                     <div>result</div>
                                     <div>result</div>
                                     <div>result</div>
                                     <div>result</div>
                                     <div>result</div>
                                     <div>result</div>
                                     <div>result</div>
                                     <div>result</div>
                                     <div>result</div>
                                     <div>result</div>
                                     <div>result</div>
                                     <div>result</div>
                                     <div>result</div>
                                     <div>result</div>
                                     <div>result</div>
                                     <div>result</div>
                                     <div>result</div>
                                     <div>result</div>
                                     <div>result</div>
                                     <div>result</div>
                                     <div>result</div>
                                     <div>result</div>
                                     <div>result</div>
                                     <div>result</div>
                                     <div>result</div>
                                     <div>result</div>
                                     <div>result</div>
                                     <div>result</div>
                                     <div>result</div>
                                     <div>result</div>
                                     <div>result</div>
                                     <div>result</div>
                                     <div>result</div>
                                     <div>result</div>
                                     <div>result</div>
                                     <div>result</div>
                                     <div>result</div>
                                     <div>result</div>
                                     <div>result</div>
                                     <div>result</div>
                                     <div>result</div>
                                     <div>result</div>
                                     <div>result</div>
                                     <div>result</div>
                                     <div>result</div>
                                     <div>result</div>
                                     <div>result</div>
                                 </div>
                                
                            </div>
                        </div>
                </Modal>

                <TabsContainer/>
            </div>;
    }
    
    openOmniSearch = () => {
        this.setState({ isOmniSearchOpen: true });
        this.refs.omniSearchInput.focus();
    };
    closeOmniSearch = ()=>{
        this.setState({ isOmniSearchOpen: false });
    };
}