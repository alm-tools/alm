/**
 * The root frontend component
 */
import * as React from "react";
import {BaseComponent, RaisedButton, AppBar, MenuItem, LeftNav, TextField, Dialog, FlatButton} from "./ui";
import * as ui from "./ui";
import * as csx from "csx";
import {AppTabsContainer} from "./tabs/appTabsContainer";
import * as commands from "./commands/commands";
var Modal = require('react-modal');
import * as styles from "./styles/styles";
import {cast, server} from "../socket/socketClient";
import {match, filter as fuzzyFilter} from "fuzzaldrin";
import {debounce,createMap,rangeLimited,getFileName} from "../common/utils";
import {OmniSearch} from "./omniSearch";

import {SelectListView} from "./selectListView";
import slv = require("./selectListView");

import {StatusBar} from "./statusBar";
import sb = require('./statusBar');


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
    isOmniSearchOpen?: boolean;
}

@ui.Radium
export class Root extends BaseComponent<{}, State>{
    constructor(props: {}) {
        super(props);

        this.state = {
        };
    }

    refs: {
        [string: string]: any;
        leftNav: any;
        statusBar: StatusBar;
        selectListView: SelectListView;
    }

    toggle = () => {
        this.refs.leftNav.toggle();
    }

    componentDidMount() {
        sb.statusBar = this.refs.statusBar;
        slv.selectListView = this.refs.selectListView;

        let tsb:{projects:ProjectJson[]};
        server.currentTsb({}).then(res => {
            tsb = res;
        });
        cast.currentTsbUpdated.on(res => {
            tsb = res;
        });

        commands.doSelectProject.on(()=>{
            this.refs.selectListView.show<ProjectJson>({
                header: 'Select the active project',
                data: tsb.projects,
                render: (d) => <div>{d.name}</div>,
                textify: (d) => d.name
            });
        });
    }

    render() {
        let toret = <div id="root" style={csx.vertical}>
                {
                //     <AppBar
                //     title="TypeScript Builder"
                //     iconClassNameRight="muidocs-icon-navigation-expand-more"
                //     onLeftIconButtonTouchTap={this.toggle}
                // />
                }
                <LeftNav ref="leftNav" docked={false} menuItems={menuItems} />

                <OmniSearch/>

                <SelectListView ref="selectListView"/>

                <div style={[csx.flex, csx.flexRoot]}>
                    <AppTabsContainer/>
                </div>

                <StatusBar ref="statusBar"></StatusBar>
            </div>;

        return toret;
    }
}
