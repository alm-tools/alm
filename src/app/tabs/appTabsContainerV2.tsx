/**
 * This maintains the User interface Tabs for app,
 * e.g. selected tab, any handling of open tab requests etc.
 */

import * as ui from "../ui";
import * as React from "react";
import * as tab from "./tab";
import * as tabRegistry from "./tabRegistry";
// import {DashboardTab} from "./dashboardTab";
import {Code} from "./codeTab";
import {DependencyView} from "./dependencyView";
import * as commands from "../commands/commands";
import * as utils from "../../common/utils";
import csx = require('csx');
import {createId} from "../../common/utils";
import * as constants from "../../common/constants";

import {tabHeaderContainer,tabHeader,tabHeaderActive,tabHeaderUnsaved} from "../styles/styles";

import {server} from "../../socket/socketClient";
import {Types} from "../../socket/socketContract";
import {rangeLimited} from "../../common/utils";
import {statusBar} from "../statusBar";

import * as state from "../state/state";
import * as types from "../../common/types";
import {connect} from "react-redux";
import * as styles from "../styles/styles";
import {Tips} from "./tips";
import {Icon} from "../icon";
import {cast} from "../../socket/socketClient";
import * as alertOnLeave from "../utils/alertOnLeave";

const getSessionId = () => window.location.hash.substr(1);
const setSessionId = (sessionId: string) => {
    const hash = '#' + sessionId;
    window.location.hash = hash;
    window.onhashchange = function() { window.location.hash = hash }
}

export interface Props {
    // redux connected below
    tabs?: state.TabInstance[];
    selectedTabIndex?: number;
}

export interface State {
}

/**
 * The singleton
 */

export class AppTabsContainerV2 extends ui.BaseComponent<Props, State>{

    constructor(props: Props) {
        super(props);

        this.state = {
            selected: 0,
        };
    }

    componentDidMount() {

    }

    render() {
        return (
            <div style={[csx.vertical,csx.flex,{maxWidth:'100%'}]} className="app-tabs">
                Hello World
            </div>
        );
    }
}
