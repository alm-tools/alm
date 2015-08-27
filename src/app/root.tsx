import * as React from "react";
import {BaseComponent, RaisedButton, AppBar, MenuItem, LeftNav, TextField, Dialog, FlatButton} from "./ui";
import * as ui from "./ui";
import * as csx from "csx";
import {TabsContainer} from "./tabs/tabsContainer";
import * as commands from "./commands/commands";
import * as styles from "./styles/styles";

let menuItems = [
    { route: 'get-started', text: 'Get Started' },
    { route: 'customization', text: 'Customization' },
    { route: 'components', text: 'Components' },
    { type: MenuItem.Types.SUBHEADER, text: 'Resources' },
    {
        type: MenuItem.Types.divNK,
        payload: 'https://github.com/basarat/ped',
        text: 'GitHub'
    },
];

export interface State {
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
                
                <Dialog
                    ref="omniSearch"
                    title="Omni Search"
                    autoDetectWindowHeight={true} autoScrollBodyContent={true}
                    actions={OmniSearchPanelActions}>
                    <div style={[csx.vertical]}>
                      <TextField ref="omniSearchInput" floatingLabelText="Filter"/>
                      <div style={[csx.vertical,{overflow:'auto'}]}>
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
                </Dialog>

                <TabsContainer/>
            </div>;
    }
    
    openOmniSearch = () => {
        this.refs.omniSearch.show();
        this.refs.omniSearchInput.focus();
    };
    closeOmniSearch = ()=>{
        this.refs.omniSearch.dismiss();
    };
}