import * as React from "react";
import {BaseComponent, RaisedButton, AppBar, MenuItem, LeftNav} from "./ui";
import * as csx from "csx";
import {TabsContainer} from "./tabs/tabsContainer";
import * as commands from "./commands/commands";

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

export class Root extends BaseComponent<{}, {}>{

    constructor(props: {}) {
        super(props);
    }

    refs: { [string: string]: any; leftNav?: any; }

    toggle = () => {
        this.refs.leftNav.toggle();
    }
    
    componentDidMount(){
        commands.findFile.on(()=>{
            console.log('find file');
        });
        commands.findCommand.on(()=>{
            console.log('find command');
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

                <TabsContainer/>
            </div>;
    }

}