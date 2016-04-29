/**
 * This maintains the User interface Tabs for app,
 * e.g. selected tab, any handling of open tab requests etc.
 */

import * as ui from "../../ui";
import * as React from "react";
import * as ReactDOM from "react-dom";

import * as tab from "./tab";
import * as tabRegistry from "./tabRegistry";
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
import {getSessionId, setSessionId} from "../clientSession";
import * as onresize from "onresize";
import {TypedEvent} from "../../../common/events";

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

/**
 *
 * Golden layout
 *
 */
import * as GoldenLayout from "golden-layout";
require('golden-layout/src/css/goldenlayout-base.css');
require('golden-layout/src/css/goldenlayout-dark-theme.css');
/** Golden layout wants react / react-dom to be global */
(window as any).React = React;
(window as any).ReactDOM = ReactDOM;
/** Golden layout injects this prop into all react components */
interface GLProps extends React.Props<any>{
    /** https://golden-layout.com/docs/Container.html */
    glContainer: {
        setTitle:(title:string)=>any;
    }
}

/** Some additional styles */
require('./appTabsContainer.css')


export interface Props {
}

export interface State {
}

export class AppTabsContainer extends ui.BaseComponent<Props, State>{

    /** The Golden Layout */
    layout: GoldenLayout;

    constructor(props: Props) {
        super(props);

        /** Setup the singleton */
        tabState = this.tabState;
    }

    componentDidMount() {
        /**
         * Setup golden layout
         * https://golden-layout.com/docs/Config.html
         */
        var config:GoldenLayout.Config = {
            content: [{
                type: 'stack',
                content: []
            }]
        };
        this.layout = new GoldenLayout(config, this.ctrls.root);

        /**
         * Register all the tab components with layout
         */
        tabRegistry.getTabConfigs().forEach(({protocol,config}) => {
            this.layout.registerComponent(protocol, config.component);
        });

        // initialize the layout
        this.layout.init();

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
            // TODO: tab
            // tabState.selectTab(tabInstances.length - 1);
            // this.focusAndUpdateStuffWeKnowAboutCurrentTab();
        });

        /** Setup window resize */
        this.disposible.add(onresize.on(()=>this.layout.updateSize()));

        /** Setup for tab selection */
        let lastConfig: GoldenLayout.Config = this.layout.toConfig();
        (this.layout as any).on('stateChanged', (evt) => {
            let newConfig:GoldenLayout.Config = this.layout.toConfig();

            console.log('here', lastConfig, newConfig); // DEBUG

            // TODO: tab
            // Abort if nothing changed
            // Figure out what changed (look at all type='stack' and check `activeItemIndex`)
            // If selection changed raise

            const focusStackRoot = (config:{activeItemIndex:number,content:{id:string}[]}) => {
                const selectedId = config.content[config.activeItemIndex].id;
                if (selectedId){
                    this.tabState.selectTab(selectedId);
                }
                // const content = config.content;
                // content.forEach(c=>{
                //
                // }
            }
            newConfig.content.filter(c=>c.type == 'stack').forEach((s)=>focusStackRoot(s as any));


            lastConfig = newConfig;
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

    onSavedChanged(tab: TabInstance, saved: boolean){
        // TODO: tab
    }

    addTabToLayout = (tab: TabInstance) => {
        const {url, id} = tab;
        const {protocol,filePath} = utils.getFilePathAndProtocolFromUrl(tab.url);
        const props: tab.ComponentProps = {
            url,
            saved: true,
            onSavedChanged: (saved)=>this.onSavedChanged(tab,saved),
            api: this.createTabApi(id),
        };
        const title = tabRegistry.getTabConfigByUrl(url).getTitle(url);

        (this.layout.root.contentItems[0] as any).addChild({
            type: 'react-component',
            component: protocol,
            title,
            props,
            id
        });
    }

    createTabApi(id: string) {
        const api: tab.TabApi = {
            resize: new TypedEvent(),
            focus: new TypedEvent(),
            save: new TypedEvent(),
            close: new TypedEvent<{}>(),
            gotoPosition: new TypedEvent<EditorPosition>(),
            search: {
                doSearch: new TypedEvent<FindOptions>(),
                hideSearch: new TypedEvent<{}>(),
                findNext: new TypedEvent<FindOptions>(),
                findPrevious: new TypedEvent<FindOptions>(),
                replaceNext: new TypedEvent<{newText: string}>(),
                replacePrevious: new TypedEvent<{newText: string}>(),
                replaceAll: new TypedEvent<{newText: string}>()
            }
        };
        this.tabApi[id] = api;
        return api;
    }

    /**
     * Tab State
     */
    tabApi: {[id:string]: tab.TabApi } = Object.create(null);
    tabs: TabInstance[] = [];
    selectedTabId: string = '';
    tabState = {
        addTabs: (tabs: TabInstance[]) => {
            this.tabs = tabs;
            tabs.forEach(this.addTabToLayout);
        },
        selectTab: (id: string) => {
            this.selectedTabId = id;
            // TODO: tab
            this.tabApi[id].focus.emit({});
        }
    }
}

const NoSelectedTab = -1;
