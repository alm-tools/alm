import types = require("../common/types");
/**
 * The root frontend component
 */
import * as React from "react";
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
import {FindAndReplace} from "./findAndReplace";
import * as state from "./state/state";

export interface State {
    isOmniSearchOpen?: boolean;
}

@ui.Radium
export class Root extends ui.BaseComponent<{}, State>{
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

        let availableProjects: ActiveProjectConfigDetails[] = [];
        server.availableProjects({}).then(res => {
            availableProjects = res;
        });
        cast.availableProjectsUpdated.on(res => {
            availableProjects = res;
        });

        commands.doSelectProject.on(()=>{
            this.refs.selectListView.show<ActiveProjectConfigDetails>({
                header: 'Select the active project',
                data: availableProjects,
                render: (d,highlitedText) => <div>{highlitedText}</div>,
                textify: (d) => d.name,
                onSelect: (d) => {
                    server.setActiveProjectName({ name: d.name });
                    state.setActiveProject(d.name);
                    state.setInActiveProject(types.TriState.Unknown);
                }
            });
        });
    }

    render() {
        let toret = <div id="root" style={csx.vertical}>

                <OmniSearch/>

                <SelectListView ref="selectListView"/>

                <div style={[csx.flex, csx.flexRoot]}>
                    <AppTabsContainer/>
                </div>

                <FindAndReplace/>

                <StatusBar ref="statusBar"/>
            </div>;

        return toret;
    }
}
