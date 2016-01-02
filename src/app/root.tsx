import types = require("../common/types");
/**
 * The root frontend component
 */
import * as React from "react";
import * as ui from "./ui";
import * as uix from "./uix";
import * as csx from "csx";
import {AppTabsContainer} from "./tabs/appTabsContainer";
import * as commands from "./commands/commands";
var Modal = require('react-modal');
import * as styles from "./styles/styles";
import {cast, server} from "../socket/socketClient";
import {match, filter as fuzzyFilter} from "fuzzaldrin";
import {debounce,createMap,rangeLimited,getFileName} from "../common/utils";
import {OmniSearch} from "./omniSearch/omniSearch";
import {FileTree} from "./fileTree";
import {SelectListView} from "./selectListView";
import {InputDialog} from "./dialogs/inputDialog";

import {StatusBar} from "./statusBar";
import {ActiveLists} from "./activeLists";
import sb = require('./statusBar');
import {FindAndReplace} from "./findAndReplace";
import * as state from "./state/state";

/** Force require  */
import {RenameVariable} from "./renameVariable";
import {GotoDefinition} from "./gotoDefinition";
import {FindReferences} from "./findReferences";
import * as format_placeholder from "./format";
import * as gotoHistory_placeholder from "./gotoHistory";
import * as clipboardRing from "./clipboardRing";
import * as gitCommands from "./gitCommands";
var ensureImport = RenameVariable
    || GotoDefinition
    || FindReferences
    || format_placeholder
    || gotoHistory_placeholder
    || clipboardRing
    || gitCommands;

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
    }

    toggle = () => {
        this.refs.leftNav.toggle();
    }

    componentDidMount() {
        uix.setup();
    }

    render() {
        let toret = <div id="root" style={csx.vertical}>

                <OmniSearch/>

                <SelectListView/>

                <InputDialog/>

                <div style={[csx.flex, csx.horizontal]}>
                    <FileTree/>
                    <AppTabsContainer/>
                </div>

                <FindAndReplace/>

                <ActiveLists/>

                <StatusBar ref="statusBar"/>
            </div>;

        return toret;
    }
}
