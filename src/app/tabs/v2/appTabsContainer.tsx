/**
 * This maintains the User interface Tabs for app,
 * e.g. selected tab, any handling of open tab requests etc.
 */

import * as ui from "../../ui";
import * as React from "react";

import * as tab from "../tab";
import * as tabRegistry from "../tabRegistry";
import {Code} from "../codeTab";
import {DependencyView} from "../dependencyView";
import * as commands from "../../commands/commands";
import * as utils from "../../../common/utils";
import csx = require('csx');
import {createId} from "../../../common/utils";
import * as constants from "../../../common/constants";

import * as types from "../../../common/types";
import {connect} from "react-redux";
import * as styles from "../../styles/styles";
import {Tips} from "./../tips";
import {Icon} from "../../icon";
import {cast, server} from "../../../socket/socketClient";
import * as alertOnLeave from "../../utils/alertOnLeave";

/**
 * Singleton + tab state migrated from redux to the local component
 * This is because the component isn't very react friendly
 */
declare var _helpMeGrabTheType: AppTabsContainer;
export let tabState: typeof _helpMeGrabTheType.tabState;

export interface TabInstance {
    id: string;
    url: string;
    saved: boolean,
}
/** Golden layout */
import * as GoldenLayout from "golden-layout";
require('golden-layout/src/css/goldenlayout-base.css')
require('golden-layout/src/css/goldenlayout-dark-theme.css')

/** Some additional styles */
require('./appTabsContainer.css')


const getSessionId = () => window.location.hash.substr(1);
const setSessionId = (sessionId: string) => {
    const hash = '#' + sessionId;
    window.location.hash = hash;
    window.onhashchange = function() { window.location.hash = hash }
}

export interface Props {
}

export interface State {
}

export class AppTabsContainer extends ui.BaseComponent<Props, State>{

    constructor(props: Props) {
        super(props);

        /** Setup the singleton */
        tabState = this.tabState;
    }

    componentDidMount() {
        var config = {
            content: [{
                type: 'row',
                content: [
                    {
                        type: 'component',
                        componentName: 'example',
                        componentState: { text: 'Component 1' }
                    },
                    {
                        type: 'component',
                        componentName: 'example',
                        componentState: { text: 'Component 2' }
                    },
                    {
                        type: 'component',
                        componentName: 'example',
                        componentState: { text: 'Component 3' }
                    }
                ]
            }]
        };

        var myLayout = new GoldenLayout(config, this.ctrls.root);

        myLayout.registerComponent('example', function(container, state) {
            container.getElement().html('<h2>' + state.text + '</h2>');
        });

        myLayout.init();


        /** Restore any open tabs from last session */
        server.getOpenUITabs({ sessionId: getSessionId() }).then((res) => {
            setSessionId(res.sessionId);

            if (!res.openTabs.length) return;

            let openTabs = res.openTabs;
            let tabInstances: TabInstance[] = openTabs.map(t => {
                return {
                    id: createId(),
                    url: t.url,
                    saved: true
                };
            });

            tabState.addTabs(tabInstances);
            tabState.selectTab(tabInstances.length - 1);
            // TODO: tab
            // this.focusAndUpdateStuffWeKnowAboutCurrentTab();
        });
    }

    ctrls: {
        root?: HTMLDivElement
    } = {}

    render() {
        return (
            <div ref={root => this.ctrls.root = root} style={csx.extend(csx.vertical, csx.flex, { maxWidth: '100%' }) } className="app-tabs">
            </div>
        );
    }

    /**
     * Tab State
     */
    tabs: TabInstance[] = [];
    selectedTabIndex: number = NoSelectedTab;
    tabState = {
        addTabs: (tabs: TabInstance[]) => {
            this.tabs = tabs;
            // TODO: tab
        },
        selectTab: (index: number) => {
            this.selectedTabIndex = index;
            // TODO: tab
        }
    }
}

const NoSelectedTab = -1;
