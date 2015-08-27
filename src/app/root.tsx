import * as React from "react";
import {BaseComponent, RaisedButton, AppBar, MenuItem, LeftNav} from "./ui";
import * as csx from "csx";
import {TabsContainer} from "./tabs/tabsContainer";
import * as commands from "./commands/commands";
var Modal = require('react-modal');

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

export class Root extends BaseComponent<{}, State>{

    constructor(props: {}) {
        super(props);
        
        this.state = {};
    }

    refs: { [string: string]: any; leftNav?: any; }

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
                      onRequestClose={this.closeOmniSearch}
                    >
                      <h2>Hello</h2>
                      <button onClick={this.closeOmniSearch}>close</button>
                      <div>I am a modal</div>
                      <form>
                        <input />
                        <button>tab navigation</button>
                        <button>stays</button>
                        <button>inside</button>
                        <button>the modal</button>
                      </form>
                    </Modal>

                <TabsContainer/>
            </div>;
    }
    
    closeOmniSearch = () => this.setState({ isOmniSearchOpen: false });
    openOmniSearch = () => this.setState({isOmniSearchOpen: true});
}