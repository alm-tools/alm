import * as React from "react";
import {BaseComponent, RaisedButton, AppBar, MenuItem, LeftNav} from "./material-ui";
import * as layout  from "layoutjs";


let menuItems = [
    { route: 'get-started', text: 'Get Started' },
    { route: 'customization', text: 'Customization' },
    { route: 'components', text: 'Components' },
    { type: MenuItem.Types.SUBHEADER, text: 'Resources' },
    {
        type: MenuItem.Types.LINK,
        payload: 'https://github.com/basarat/cab',
        text: 'GitHub'
    },
];

export class RootComponent extends BaseComponent<{}, {}>{

    constructor(props: {}) {
        super(props);
    }

    refs: { [string: string]: any; leftNav?: any; }

    toggle = () => {
        console.log('heres');
        this.refs.leftNav.toggle();
    }

    render() {
        return <div>
                <AppBar
                title="Code Analysis Butler"
                iconClassNameRight="muidocs-icon-navigation-expand-more"
                onLeftIconButtonTouchTap={this.toggle}
                />
                <LeftNav ref="leftNav" docked={false} menuItems={menuItems} />
                
                
                
            </div>;
    }

}