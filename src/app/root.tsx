import types = require("../common/types");
/**
 * The root frontend component
 */
import * as React from "react";
import * as ui from "./ui";
import * as uix from "./uix";
import * as csx from "csx";
import {AppTabsContainer} from "./tabs/v2/appTabsContainer";
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
import {MainPanel} from "./mainPanel";
import sb = require('./statusBar');
import {FindAndReplace} from "./findAndReplace";
import * as state from "./state/state";

/** Force require  */
import {RenameVariable} from "./codeResults/renameVariable";
import {GotoDefinition} from "./codeResults/gotoDefinition";
import {FindReferences} from "./codeResults/findReferences";
import * as gotoHistory from "./gotoHistory";
import * as clipboardRing from "./clipboardRing";
import * as gitCommands from "./gitCommands";
import * as htmlToTsx from "./editorCommands/htmlToTsx";
import * as cssToTs from "./editorCommands/cssToTs";
import * as jsonToDts from "./editorCommands/jsonToDts";
import * as goToLine from "./editorCommands/goToLine";
import * as gotoTypeScriptSymbol from "./editorCommands/gotoTypeScriptSymbol";
var ensureImport = RenameVariable
    || GotoDefinition
    || FindReferences
    || gotoHistory
    || clipboardRing
    || gitCommands
    || htmlToTsx
    || cssToTs
    || jsonToDts
    || goToLine
    || gotoTypeScriptSymbol;

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

                <MainPanel/>

                <StatusBar ref="statusBar"/>
            </div>;

        return toret;
    }
}
