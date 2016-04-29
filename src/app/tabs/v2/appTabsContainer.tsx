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
            tabInstances.length && tabState.selectTab(tabInstances[tabInstances.length - 1].id);
            // TODO: tab
            // this.focusAndUpdateStuffWeKnowAboutCurrentTab();
        });

        /** Setup window resize */
        this.disposible.add(onresize.on(()=>this.resize()));

        /**
         * Tab selection
         * I tried to use the config to figure out the selected tab.
         * That didn't work out so well
         * So the plan is to intercept the tab clicks to focus
         * and on state changes just focus on the last selected tab if any
         */
        (this.layout as any).on('tabCreated', (tabInfo) => {
            this.createTabHandle(tabInfo);
        });
        (this.layout as any).on('itemDestroyed', (evt) => {
            if (evt.config && evt.config.id){
                this.tabState.closedTab(evt.config.id);
            }
        });
        (this.layout as any).on('stateChanged', (evt) => {
            // Due to state changes layout needs to happen on *all tabs* (because it might expose some other tabs)
            // PREF : you can go thorough all the `stack` in the layout and only call resize on the active ones.
            this.tabState.resize();

            // If there was a selected tab focus on it again.
            this.selectedTabInstance && this.tabState.selectTab(this.selectedTabInstance.id);
        });

        /**
         * General command handling
         */
        this.setupCommandHandling()
    }

    /**
     * Lots of commands are raised in the app that we need to care about
     * e.g. tab saving / tab switching / file opening etc.
     * We do that all in here
     */
    setupCommandHandling(){
        commands.saveTab.on((e) => {
            this.getSelectedTabApiIfAny().save.emit({});
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

    onSavedChanged(tab: TabInstance, saved: boolean) {
        if (this.tabHandle[tab.id]) {
            this.tabHandle[tab.id].setSaved(saved);
        }
    }

    addTabToLayout = (tab: TabInstance) => {
        const {url, id} = tab;
        const {protocol,filePath} = utils.getFilePathAndProtocolFromUrl(tab.url);
        const props: tab.TabProps = {
            url,
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

    resize() {
        this.layout.updateSize();
    }

    createTabApi(id: string) {
        const api = newTabApi();
        this.tabApi[id] = api;
        return api;
    }

    /**
     * If we have a selected tab we return its api.
     * Otherwise we create one on the fly so you don't need to worry about
     * constantly checking if selected tab. (pain from v1).
     */
    getSelectedTabApiIfAny() {
        if (this.selectedTabInstance && this.tabApi[this.selectedTabInstance.id]) {
            return this.tabApi[this.selectedTabInstance.id];
        }
        else {
            return newTabApi();
        }
    }
    getTabApi(id: string) {
        return this.tabApi[id];
    }

    createTabHandle(tabInfo){
        const tab:JQuery = tabInfo.element;
        const tabConfig = tabInfo.contentItem.config;
        const id = tabConfig.id;
        // mouse down because we want tab state to change even if user initiates a drag
        tab.on('mousedown', () => {
            this.tabState.selectTab(id);
        });
        this.tabHandle[id] = {
            saved: true,
            setSaved: (saved)=> {
                this.tabHandle[id].saved = saved;
                tab.toggleClass('unsaved', !saved);
            }
        }
    }

    /**
     * Tab State
     */
    /** Our way to send stuff (events) down to the tab */
    tabApi: {[id:string]: tab.TabApi } = Object.create(null);
    /** This is different from the Tab Api in that its stuff *we* render for the tab */
    tabHandle: {
        [id: string]: {
            saved: boolean;
            setSaved: (saved: boolean) => void;
        }
    } = Object.create(null);
    tabs: TabInstance[] = [];
    selectedTabInstance: TabInstance = null;
    tabState = {
        resize: () => {
            this.tabs.forEach(t=>this.tabApi[t.id].resize.emit({}));
        },
        addTabs: (tabs: TabInstance[]) => {
            this.tabs = tabs;
            tabs.forEach(this.addTabToLayout);
        },
        selectTab: (id: string) => {
            this.selectedTabInstance = this.tabs.find(t => t.id == id);
            this.tabApi[id].focus.emit({});
        },
        closedTab: (id: string) => {
            this.tabs = this.tabs.filter(t=>t.id !== id);
            delete this.tabHandle[id];
            delete this.tabApi[id];
            // TODO: tab
            // tell server about open tabs for session

            if (this.selectedTabInstance && this.selectedTabInstance.id == id) {
                this.selectedTabInstance = null;
                // TODO: tab
                // Figure out the next selected tab
            }
        }
    }
}

const NoSelectedTab = -1;

const newTabApi = ()=>{
    // Note : i am using any as `new TypedEvent<FindOptions>()` breaks syntax highlighting
    // but don't worry api is still type checked for members
    const api: tab.TabApi = {
        resize: new TypedEvent(),
        focus: new TypedEvent(),
        save: new TypedEvent(),
        close: new TypedEvent() as any,
        gotoPosition: new TypedEvent() as any,
        search: {
            doSearch: new TypedEvent() as any,
            hideSearch: new TypedEvent() as any,
            findNext: new TypedEvent() as any,
            findPrevious: new TypedEvent() as any,
            replaceNext: new TypedEvent() as any,
            replacePrevious: new TypedEvent() as any,
            replaceAll: new TypedEvent() as any
        }
    };
    return api;
}
