/**
 * This maintains the User interface Tabs for app,
 * e.g. selected tab, any handling of open tab requests etc.
 */

import * as ui from "../../ui";
import * as React from "react";
import * as ReactDOM from "react-dom";

import * as tab from "./tab";
import * as tabRegistry from "./tabRegistry";
import * as commands from "../../commands/commands";
import * as utils from "../../../common/utils";
import * as csx from '../../base/csx';
import {createId} from "../../../common/utils";

import * as types from "../../../common/types";
import {connect} from "react-redux";
import * as styles from "../../styles/styles";
import {Tips} from "./../tips";
import {Icon} from "../../components/icon";
import {cast, server} from "../../../socket/socketClient";
import {Types} from "../../../socket/socketContract";
import * as alertOnLeave from "../../utils/alertOnLeave";
import {getSessionId, setSessionId} from "../../state/clientSession";
import * as onresize from "onresize";
import {TypedEvent} from "../../../common/events";
import {CodeEditor} from "../../monaco/editor/codeEditor";
import * as state from "../../state/state";
import * as pure from "../../../common/pure";
import * as settings from "../../state/settings";
import {errorsCache} from "../../globalErrorCacheClient";

/**
 * Singleton + tab state migrated from redux to the local component
 * This is because the component isn't very react friendly
 */
declare var _helpMeGrabTheType: AppTabsContainer;
export let tabState: typeof _helpMeGrabTheType.tabState;

export type TabInstance = types.TabInstance;

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
        server.getOpenUITabs({ sessionId: getSessionId() }).then(res => {
            const config = GLUtil.unserializeConfig(res.tabLayout, this);

            /** This is needed as we use this ordered information in quite a few places */
            this.tabs = GLUtil.orderedTabs(config);

            /**
             * Setup golden layout
             * https://golden-layout.com/docs/Config.html
             */
            this.layout = new GoldenLayout(config, this.ctrls.root);

            /**
             * Register all the tab components with layout
             */
            tabRegistry.getTabConfigs().forEach(({protocol, config}) => {
                this.layout.registerComponent(protocol, config.component);
            });

            /** Setup window resize */
            this.disposible.add(onresize.on(() => this.tabState.resize()));

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
                    this.tabState.tabClosedInLayout(evt.config.id);
                }
            });
            let oldConfig = config;
            let initialStateChange = true;
            (this.layout as any).on('stateChanged', (evt) => {
                if (initialStateChange) {
                    // Select the last tab
                    this.tabs.length
                        && res.selectedTabId
                        && this.tabs.find(t=>t.id === res.selectedTabId)
                        && tabState.triggerFocusAndSetAsSelected(res.selectedTabId);

                    initialStateChange = false;
                }

                const newConfig = this.layout.toConfig();
                /**
                 * `golden-layout` plugs into the `componentWillUpdate` on our tab components
                 * If any tab component state changes it calls us with `stateChanged`
                 * These are not relevant for us so we use our super special diff to ignore these cases
                 *
                 * This diff can be improved (its too strict)
                 */
                type SimpleContentItem = { type: string, dimension: any, content?: SimpleContentItem[], activeItemIndex?: number, width?: number; height?: number }
                const contentEqual = (a: SimpleContentItem, b: SimpleContentItem) => {
                    if (a.type !== b.type) return false;
                    if (a.activeItemIndex !== b.activeItemIndex) return false;
                    if (!pure.shallowEqual(a.dimension, b.dimension)) return false;
                    if (a.height !== b.height) return false;
                    if (a.width !== b.width) return false;
                    if (a.content) {
                        if (!b.content) return false;
                        if (a.content.length !== b.content.length) return false;
                        return a.content.every((c, i) => contentEqual(c, b.content[i]));
                    }
                    return true;
                }
                const equal = contentEqual(oldConfig, newConfig);
                oldConfig = newConfig;
                if (equal) {
                    return;
                }

                // Due to state changes layout needs to happen on *all tabs* (because it might expose some other tabs)
                // PREF : you can go thorough all the `stack` in the layout and only call resize on the active ones.
                this.tabState.resizeTheTabs();

                // Ignore the events where the user is dragging stuff
                // This is because at this time the `config` doesn't contain the *dragged* item.
                const orderedtabs = GLUtil.orderedTabs(newConfig);
                if (orderedtabs.length !== this.tabs.length) {
                    return;
                }

                // Store the tabs in the right order
                this.tabState.setTabs(orderedtabs);

                // If there was a selected tab focus on it again.
                if (this.tabState._resizingDontReFocus) {
                    this.tabState._resizingDontReFocus = false;
                }
                else {
                    this.selectedTabInstance && this.tabState.selectTab(this.selectedTabInstance.id);
                }
            });

            // initialize the layout
            this.layout.init();

            // If there are no tabs then show the tip help
            if (!this.tabs.length) this.tabState.refreshTipHelp();

            /**
             * General command handling
             */
            this.setupCommandHandling()
        });
    }

    /** Used to undo close tab */
    closedTabs: TabInstance[] = [];

    /**
     * Lots of commands are raised in the app that we need to care about
     * e.g. tab saving / tab switching / file opening etc.
     * We do that all in here
     */
    setupCommandHandling(){
        // commands.bas.on((e) => {
        //     const filePath = getCurrentFilePathOrWarn();
        //     if (!filePath) return;
        //     server.gitDiff({ filePath }).then(res => {
        //         console.log(res);
        //     });
        // });
        commands.saveTab.on((e) => {
            this.getSelectedTabApiIfAny().save.emit({});
        });
        commands.esc.on(() => {
            // Focus selected tab
            this.tabState.focusSelectedTabIfAny();
            // Exit jump tab mode
            this.tabState.hideTabIndexes();
            // Hide search
            if (this.tabApi[this.selectedTabInstance && this.selectedTabInstance.id]){
                this.tabApi[this.selectedTabInstance && this.selectedTabInstance.id].search.hideSearch.emit({});
            }
        });
        commands.jumpToTab.on(()=>{
            // jump to tab
            this.tabState.showTabIndexes();
        });

        /**
         * File opening commands
         */
        commands.toggleOutputJS.on(()=>{
            const filePath = getCurrentFilePathOrWarn();
            if (!filePath) return;
            const outputStatus = state.getState().outputStatusCache[filePath];
            if (!outputStatus) {
                ui.notifyWarningNormalDisappear('Your current tab needs to be a TypeScript file in project and project should have compileOnSave enabled');
                return;
            }
            commands.doToggleFileTab.emit({
                filePath: outputStatus.outputFilePath
            });
        });
        commands.doToggleFileTab.on(({filePath}) => {
            // If tab is open we just close it
            const existing = this.tabs.find(t => {
                return utils.getFilePathFromUrl(t.url) == filePath;
            });
            if (existing) {
                this.tabState.closeTabById(existing.id);
                return;
            }

            // Othewise we open the tab, and select back to the current tab
            const currentTabId = this.selectedTabInstance && this.selectedTabInstance.id;
            commands.doOpenOrActivateFileTab.emit({ filePath });
            this.moveCurrentTabRightIfAny();
            if (currentTabId) {
                this.tabState.triggerFocusAndSetAsSelected(currentTabId)
            }
        });
        commands.doOpenFile.on((e) => {
            let codeTab: TabInstance = {
                id: createId(),
                url: `file://${e.filePath}`,
                additionalData: null,
            }

            // Add tab
            this.addTabToLayout(codeTab);

            // Focus
            this.tabState.selectTab(codeTab.id);
            if (e.position) {
                this.tabApi[codeTab.id].gotoPosition.emit(e.position);
            }
        });
        commands.doOpenOrFocusFile.on((e)=>{
            // if open and not focused then focus and goto pos
            const existingTab =
                // Open and current
                (
                    this.selectedTabInstance
                    && utils.getFilePathFromUrl(this.selectedTabInstance.url) === e.filePath
                    && utils.getFilePathAndProtocolFromUrl(this.selectedTabInstance.url).protocol === tabRegistry.tabs.file.protocol
                    && this.selectedTabInstance
                )
                // Open but not current
                || this.tabs.find(t => {
                    return utils.getFilePathFromUrl(t.url) == e.filePath
                        && utils.getFilePathAndProtocolFromUrl(t.url).protocol === tabRegistry.tabs.file.protocol;
                });
            if (existingTab) {
                // Focus if not focused
                if (!this.selectedTabInstance || this.selectedTabInstance.id !== existingTab.id) {
                    this.tabState.triggerFocusAndSetAsSelected(existingTab.id);
                }
                if (e.position) {
                    this.tabState.gotoPosition(existingTab.id, e.position);
                }
            }
            else {
                commands.doOpenFile.emit(e);
            }
        });
        commands.doOpenOrActivateFileTab.on((e) => {
            // Basically we have to maintain the current focus
            const activeElement = document.activeElement;
            commands.doOpenOrFocusFile.emit(e);
            if (activeElement) {
                setTimeout(() => $(activeElement).focus(), 100);
            }
        });
        commands.doOpenOrFocusTab.on(e=>{
            // if open and not focused then focus and goto pos
            const existingTab =
                this.tabs.find(t => {
                    return t.id == e.tabId;
                });
            if (existingTab) {
                // Focus if not focused
                if (!this.selectedTabInstance || this.selectedTabInstance.id !== existingTab.id){
                    this.tabState.triggerFocusAndSetAsSelected(existingTab.id);
                }
                if (e.position) {
                    this.tabState.gotoPosition(existingTab.id, e.position);
                }
            }
            else { // otherwise reopen
                let codeTab: TabInstance = {
                    id: e.tabId,
                    url: e.tabUrl,
                    additionalData: null
                }

                // Add tab
                this.addTabToLayout(codeTab);

                // Focus
                this.tabState.selectTab(codeTab.id);
                if (e.position) {
                    this.tabState.gotoPosition(codeTab.id, e.position);
                }
            }
        });
        commands.closeFilesDirs.on((e)=>{
            let toClose = (filePath:string) => {
                return e.files.indexOf(filePath) !== -1 || e.dirs.some(dirPath => filePath.startsWith(dirPath));
            }
            let tabsToClose = this.tabs.filter((t, i) => {
                let {protocol, filePath} = utils.getFilePathAndProtocolFromUrl(t.url);
                return protocol === 'file' && toClose(filePath);
            });
            tabsToClose.forEach(t => this.tabHandle[t.id].triggerClose());
        });
        commands.undoCloseTab.on(() => {
            if (this.closedTabs.length) {
                let tab = this.closedTabs.pop();

                // Add tab
                this.addTabToLayout(tab);

                // Focus
                this.tabState.selectTab(tab.id);
            }
        });
        commands.duplicateTab.on((e) => {
            const currentFilePath = getCurrentFilePathOrWarn();
            if (!currentFilePath) return;
            if (!this.selectedTabInstance) return;

            let codeTab: TabInstance = {
                id: createId(),
                url: this.selectedTabInstance.url,
                additionalData: this.selectedTabInstance.additionalData
            }

            // Add tab
            this.addTabToLayout(codeTab);

            // Focus
            this.tabState.selectTab(codeTab.id);
        });

        /**
         * Goto tab by index
         */
        const gotoNumber = this.tabState._jumpToTabNumber;
        commands.gotoTab1.on(() => gotoNumber(1));
        commands.gotoTab2.on(() => gotoNumber(2));
        commands.gotoTab3.on(() => gotoNumber(3));
        commands.gotoTab4.on(() => gotoNumber(4));
        commands.gotoTab5.on(() => gotoNumber(5));
        commands.gotoTab6.on(() => gotoNumber(6));
        commands.gotoTab7.on(() => gotoNumber(7));
        commands.gotoTab8.on(() => gotoNumber(8));
        commands.gotoTab9.on(() => gotoNumber(9));

        /**
         * Next and previous tabs
         */
        commands.nextTab.on(() => {
            const currentTabId = this.selectedTabInstance && this.selectedTabInstance.id;
            const currentIndex = this.tabs.findIndex(t => t.id === currentTabId);
            let nextIndex = utils.rangeLimited({
                min: 0,
                max: this.tabs.length - 1,
                num: currentIndex + 1,
                loopAround: true
            });
            setTimeout(() => { // No idea why :-/
                this.tabState.triggerFocusAndSetAsSelected(this.tabs[nextIndex].id);
            });
        });
        commands.prevTab.on(() => {
            const currentTabId = this.selectedTabInstance && this.selectedTabInstance.id;
            const currentIndex = this.tabs.findIndex(t => t.id === currentTabId);
            let nextIndex = utils.rangeLimited({
                min: 0,
                max: this.tabs.length - 1,
                num: currentIndex - 1,
                loopAround: true
            });
            setTimeout(() => { // No idea why :-/
                this.tabState.triggerFocusAndSetAsSelected(this.tabs[nextIndex].id);
            });
        });

        /**
         * Close tab commands
         */
        commands.closeTab.on((e) => {
            // Remove the selected
            this.tabState.closeCurrentTab();
        });
        commands.closeOtherTabs.on((e) => {
            const currentTabId = this.selectedTabInstance && this.selectedTabInstance.id;
            const otherTabs = this.tabs.filter(t => t.id !== currentTabId);
            otherTabs.forEach(t => this.tabHandle[t.id].triggerClose());
        });
        commands.closeAllTabs.on((e) => {
            commands.closeOtherTabs.emit({});
            commands.closeTab.emit({});
        });

        /**
         * Find and Replace
         */
        state.subscribeSub(state => state.findOptions, (findQuery) => {
            let api = this.getSelectedTabApiIfAny();
            const options = state.getState().findOptions;
            if (options.isShown) {
                api.search.doSearch.emit(options);
            }
            else {
                api.search.hideSearch.emit(options);
            }
        });
        commands.findNext.on(() => {
            let component = this.getSelectedTabApiIfAny();
            let findOptions = state.getState().findOptions;
            component.search.findNext.emit(findOptions);
        });
        commands.findPrevious.on(() => {
            let component = this.getSelectedTabApiIfAny();
            let findOptions = state.getState().findOptions;
            component.search.findPrevious.emit(findOptions);
        });
        commands.replaceNext.on((e) => {
            let component = this.getSelectedTabApiIfAny();
            component.search.replaceNext.emit(e);
        });
        commands.replacePrevious.on((e) => {
            let component = this.getSelectedTabApiIfAny();
            component.search.replacePrevious.emit(e);
        });
        commands.replaceAll.on((e) => {
            let component = this.getSelectedTabApiIfAny();
            component.search.replaceAll.emit(e);
        });

        /**
         * Other Types Of tabs
         */
        commands.doOpenDependencyView.on((e) => {
            let codeTab: TabInstance = {
                id: createId(),
                url: `dependency://Dependency View`,
                additionalData: null,
            }

            // Add tab
            this.addTabToLayout(codeTab);

            // Focus
            this.tabState.selectTab(codeTab.id);
        });
        /** Only allows a single tab of a type */
        const openOrFocusSingletonTab = ({protocol, url}: { protocol: string, url: string }) => {
            // if open and active => focus
            // if open and not active => active
            // if not open and active
            if (this.selectedTabInstance
                && utils.getFilePathAndProtocolFromUrl(this.selectedTabInstance && this.selectedTabInstance.url).protocol === protocol) {
                this.tabState.focusSelectedTabIfAny();
                return;
            }

            let openTabIndex = this.tabs.findIndex(t => utils.getFilePathAndProtocolFromUrl(t.url).protocol === protocol);
            if (openTabIndex != -1) {
                this.tabState.triggerFocusAndSetAsSelected(this.tabs[openTabIndex].id);
                return;
            }

            let newTab: TabInstance = {
                id: createId(),
                url,
                additionalData: null,
            }
            // Add tab
            this.addTabToLayout(newTab);

            // Focus
            this.tabState.selectTab(newTab.id);
        }
        /** Documentation view */
        commands.toggleDocumentationBrowser.on(()=>{
            const protocol = tabRegistry.tabs.documentation.protocol;
            const url = `${protocol}://Documentation`;
            openOrFocusSingletonTab({ protocol, url });
        });
        /** Tested view */
        commands.doOpenTestResultsView.on(()=>{
            const protocol = tabRegistry.tabs.tested.protocol;
            const url = `${protocol}://Tested`;
            openOrFocusSingletonTab({ protocol, url });
        });
        /** Find and replace multi */
        commands.findAndReplaceMulti.on((e) => {
            const protocol = tabRegistry.tabs.farm.protocol;
            const url = `${protocol}://Find And Replace`;
            openOrFocusSingletonTab({ protocol, url });
        });
        /** Live demo view */
        commands.ensureLiveDemoTab.on((e) => {
            const protocol = tabRegistry.tabs.livedemo.protocol;
            const url = `${protocol}://${e.filePath}`;

            const currentTabId = this.selectedTabInstance && this.selectedTabInstance.id;
            openOrFocusSingletonTab({ protocol, url });
            this.moveCurrentTabRightIfAny();
            if (currentTabId) {
                this.tabState.triggerFocusAndSetAsSelected(currentTabId)
            }
        });
        commands.closeDemoTab.on(e => {
            // If tab is open we just close it
            const protocol = tabRegistry.tabs.livedemo.protocol;
            const existing = this.tabs.find(t => {
                return utils.getFilePathAndProtocolFromUrl(t.url).protocol == protocol;
            });
            if (existing) {
                this.tabState.closeTabById(existing.id);
                return;
            }
        });
        commands.ensureLiveDemoReactTab.on((e) => {
            const protocol = tabRegistry.tabs.livedemoreact.protocol;
            const url = `${protocol}://${e.filePath}`;

            const currentTabId = this.selectedTabInstance && this.selectedTabInstance.id;
            openOrFocusSingletonTab({ protocol, url });
            this.moveCurrentTabRightIfAny();
            if (currentTabId) {
                this.tabState.triggerFocusAndSetAsSelected(currentTabId)
            }
        });
        commands.closeDemoReactTab.on(e => {
            // If tab is open we just close it
            const protocol = tabRegistry.tabs.livedemoreact.protocol;
            const existing = this.tabs.find(t => {
                return utils.getFilePathAndProtocolFromUrl(t.url).protocol == protocol;
            });
            if (existing) {
                this.tabState.closeTabById(existing.id);
                return;
            }
        });
        /** AST view */
        let getCurrentFilePathOrWarn = () => {
            let tab = this.tabState.getSelectedTab();
            let notify = () => ui.notifyWarningNormalDisappear('Need a valid file path for this action. Make sure you have a *file* tab as active');
            if (!tab) {
                notify();
                return;
            }
            let {protocol, filePath} = utils.getFilePathAndProtocolFromUrl(tab.url);
            if (protocol !== 'file') {
                notify();
                return;
            }
            return filePath;
        }
        let openAnalysisViewForCurrentFilePath = (getUrl: (filePath: string) => string) => {
            let filePath = getCurrentFilePathOrWarn();
            if (!filePath) return;

            let codeTab: TabInstance = {
                id: createId(),
                url: getUrl(filePath),
                additionalData: null
            }

            // Add tab
            this.addTabToLayout(codeTab);

            // Focus
            this.tabState.selectTab(codeTab.id);
        }
        commands.doOpenASTView.on((e) => {
            openAnalysisViewForCurrentFilePath((filePath)=>{
                return `${tabRegistry.tabs.ast.protocol}://${filePath}`
            });
        });
        commands.doOpenASTFullView.on((e) => {
            openAnalysisViewForCurrentFilePath((filePath)=>{
                return `${tabRegistry.tabs.astfull.protocol}://${filePath}`
            });
        });
        commands.doOpenUmlDiagram.on((e) => {
            openAnalysisViewForCurrentFilePath((filePath)=>{
                return `${tabRegistry.tabs.uml.protocol}://${filePath}`
            });
        });
        commands.launchTsFlow.on((e) => {
            let filePath = getCurrentFilePathOrWarn();
            if (!filePath) return;

            let tsFlowTab: TabInstance = {
                id: createId(),
                url: `${tabRegistry.tabs.tsflow.protocol}://${filePath}`,
                additionalData: {
                    position: 0 /**  TODO: tsflow load from actual file path current cursor */
                }
            }

            // Add tab
            this.addTabToLayout(tsFlowTab);

            // Focus
            this.tabState.selectTab(tsFlowTab.id);
        });
    }

    ctrls: {
        root?: HTMLDivElement
    } = {}

    render() {
        return (
            <div ref={root => this.ctrls.root = root} style={csx.extend(csx.vertical, csx.flex, { maxWidth: '100%', overflow: 'hidden' }) } className="app-tabs">
            </div>
        );
    }

    onSavedChanged(tab: TabInstance, saved: boolean) {
        if (this.tabHandle[tab.id]) {
            this.tabHandle[tab.id].setSaved(saved);
        }
    }

    /**
     * Does exactly what it says.
     */
    addTabToLayout = (tab: TabInstance, sendToServer = true) => {
        this.tabs.push(tab);
        if (sendToServer) {
            this.sendTabInfoToServer();
            this.tabState.refreshTipHelp();
        }

        const {url, id} = tab;
        const {protocol,filePath} = utils.getFilePathAndProtocolFromUrl(tab.url);
        const props: tab.TabProps = {
            url,
            additionalData: tab.additionalData,
            onSavedChanged: (saved)=>this.onSavedChanged(tab,saved),
            onFocused: () => {
                if (this.selectedTabInstance && this.selectedTabInstance.id === id)
                    return;
                this.tabState.selectTab(id)
            },
            api: this.createTabApi(id),
            setCodeEditor: (codeEditor: CodeEditor) => this.codeEditorMap[id] = codeEditor
        };
        const title = tabRegistry.getTabConfigByUrl(url).getTitle(url);

        // Find the active stack if any
        let currentItemAndParent = this.getCurrentTabRootStackIfAny();

        // By default we try to add to (in desending order)
        //  The current stack
        //  the root stack
        //  the root
        let contentRoot =
            (currentItemAndParent && currentItemAndParent.parent)
            || this.layout.root.contentItems[0]
            || this.layout.root;

        contentRoot.addChild({
            type: 'react-component',
            component: protocol,
            title,
            props,
            id
        });
    }

    private getCurrentTabRootStackIfAny(): {item: GoldenLayout.ContentItem, parent: GoldenLayout.ContentItem} | undefined{
        if (this.selectedTabInstance) {
            const id = this.selectedTabInstance.id;
            const item: GoldenLayout.ContentItem = this.layout.root.contentItems[0].getItemsById(id)[0] as any;
            if (item && item.parent && item.parent.type == 'stack') {
                return { item, parent: item.parent };
            }
        }
    }

    private moveTabUtils = {
        /**
         * Utility to create a container that doesn't reinitialize its children
         */
        createContainer: (type:'stack'|'row'|'column') => {
            const item = this.layout.createContentItem({
                type: type,
                content: []
            }) as any as GoldenLayout.ContentItem;
            item.isInitialised = true; // Prevents initilizing its children
            return item;
        },
        /**
         * Utility that doesn't *uninitalize* the child it is removing
         */
         detachFromParent: (item: GoldenLayout.ContentItem) => {
             item.parent.removeChild(item, true);
         },
    }

    private moveCurrentTabRightIfAny = () => {

        let currentItemAndParent = this.getCurrentTabRootStackIfAny();
        if (!currentItemAndParent) return;
        const {item,parent} = currentItemAndParent;
        const root = parent.parent;

        /** Can't move the last item */
        if (parent.contentItems.length === 1) {
            return;
        }

        // If parent.parent is a `row` its prettier to just add to that row ;)
        if (root.type === 'row') {
            // Create a new container for just this tab
            this.moveTabUtils.detachFromParent(item);
            const newItemRootElement = this.moveTabUtils.createContainer('stack');
            newItemRootElement.addChild(item);

            // Add this new container to the root
            root.addChild(newItemRootElement);
        }
        else {
            const indexOfParentInRoot = parent.parent.contentItems.findIndex((c) => c == parent);

            // Create a new container for just this tab
            this.moveTabUtils.detachFromParent(item);
            const newItemRootElement = this.moveTabUtils.createContainer('stack');
            newItemRootElement.addChild(item);

            // Create a new layout to be the root of the two stacks
            const newRootLayout = this.moveTabUtils.createContainer('row');
            newRootLayout.addChild(newItemRootElement);

            // Also add the old parent to this new row
            const doTheDetachAndAdd = ()=>{
                // Doing this detach immediately breaks the layout
                // This is because for column / row when a child is removed the splitter is gone
                // And by chance this is the splitter that the new item was going to :-/
                this.moveTabUtils.detachFromParent(parent);
                newRootLayout.addChild(parent, 0);
            }
            if (root.type === 'column') {
                setTimeout(doTheDetachAndAdd, 10);
            }
            else {
                // type `root` *must* only have a single item at a time :)
                // So we *must* do it sync for that case
                doTheDetachAndAdd();
            }

            // Add this new container to the root
            root.addChild(newRootLayout, indexOfParentInRoot);
        }
    }

    private moveCurrentTabDownIfAny = () => {
        // Very similar to moveCurrentTabRightIfAny
        // Just replaced `row` with `column` and `column` with `row`.
        // This code can be consolidated but leaving as seperate as I suspect they might diverge
        let currentItemAndParent = this.getCurrentTabRootStackIfAny();
        if (!currentItemAndParent) return;

        const {item,parent} = currentItemAndParent;
        const root = parent.parent;

        /** Can't move the last item */
        if (parent.contentItems.length === 1) {
            return;
        }

        // If parent.parent is a `column` its prettier to just add to that column ;)
        if (root.type === 'column') {
            // Create a new container for just this tab
            this.moveTabUtils.detachFromParent(item);
            const newItemRootElement = this.moveTabUtils.createContainer('stack');
            newItemRootElement.addChild(item);

            // Add this new container to the root
            root.addChild(newItemRootElement);
        }
        else {
            const indexOfParentInRoot = parent.parent.contentItems.findIndex((c) => c == parent);

            // Create a new container for just this tab
            this.moveTabUtils.detachFromParent(item);
            const newItemRootElement = this.moveTabUtils.createContainer('stack');
            newItemRootElement.addChild(item);

            // Create a new layout to be the root of the two stacks
            const newRootLayout = this.moveTabUtils.createContainer('column');
            newRootLayout.addChild(newItemRootElement);

            // Also add the old parent to this new row
            const doTheDetachAndAdd = ()=>{
                // Doing this detach immediately breaks the layout
                // This is because for column / row when a child is removed the splitter is gone
                // And by chance this is the splitter that the new item was going to :-/
                this.moveTabUtils.detachFromParent(parent);
                newRootLayout.addChild(parent, 0);
            }
            if (root.type === 'row') {
                setTimeout(doTheDetachAndAdd, 10);
            }
            else {
                // type `root` *must* only have a single item at a time :)
                // So we *must* do it sync for that case
                doTheDetachAndAdd();
            }

            // Add this new container to the root
            root.addChild(newRootLayout, indexOfParentInRoot);
        }
    }

    private sendTabInfoToServer = () => {
        const serialized = GLUtil.serializeConfig(this.layout.toConfig(), this);
        server.setOpenUITabs({
            sessionId: getSessionId(),
            tabLayout: serialized,
            selectedTabId: this.selectedTabInstance && this.selectedTabInstance.id
        });
    }

    createTabApi(id: string) {
        const api = newTabApi();
        this.tabApi[id] = api;
        return api;
    }

    debugLayoutTree() {
        const config = this.layout.toConfig();
        const root = config.content;
        const generateSpaces = (indent:number) => Array((indent * 2) + 1).map(i => " ").join(' ');
        const printItem = (item, depth = 0) => {
            if (!depth){
                console.log('ROOT-----')
            }
            else {
                const indent = generateSpaces(depth);
                console.log(indent + item.type);
            }

            if (item.content) {
                item.content.forEach(c => printItem(c, depth + 1));
            }
        }
        // console.log(config);
        printItem(config);
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
        // console.log(tabInfo);
        const item = tabInfo.contentItem;
        const tab:JQuery = tabInfo.element;
        const tabConfig = tabInfo.contentItem.config;
        const id = tabConfig.id;
        // mouse down because we want tab state to change even if user initiates a drag
        tab.on('mousedown', (evt) => {
            // if the user is center clicking, close the tab
            const centerClick = evt.button === 1;
            if (centerClick) {
                tab.find('.lm_close_tab').trigger('click');
                return;
            }
            // But not if the user is clicking the close button
            const closeButtonClicked = evt.target && evt.target.className == "lm_close_tab";
            if (closeButtonClicked) {
                return;
            }
            this.tabState.selectTab(id);
        });
        let tabIndexDisplay: JQuery = null;
        const removeTabIndexDisplayIfAny = () => {
            if (tabIndexDisplay) {
                tabIndexDisplay.remove();
                tabIndexDisplay = null;
            }
        }
        this.tabHandle[id] = {
            saved: true,
            setSaved: (saved)=> {
                this.tabHandle[id].saved = saved;
                tab.toggleClass('unsaved', !saved);
            },
            triggerFocus: () => {
                /**
                 * setTimeout needed because we call `triggerFocus` when
                 * golden-layout is still in the process of changing tabs sometimes
                 */
                setTimeout(() => {
                    tabInfo.header.parent.setActiveContentItem(item);
                });
            },
            showIndex: (index: number) => {
                if (index > 9) {
                    // Wow this user has too many tabs. Abort
                    return;
                }
                tabIndexDisplay = $('<div class="alm_jumpIndex">' + index + '</div>');
                tab.append(tabIndexDisplay);
            },
            hideIndex: removeTabIndexDisplayIfAny,
            triggerClose: () => {
                tab.find('.lm_close_tab').trigger('click');
            },

            /** Selected class */
            addSelectedClass: () => {
                tab.addClass('alm_selected');
            },
            removeSelectedClass: () => {
                tab.removeClass('alm_selected');
            },
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
            triggerFocus: () => void;
            showIndex: (i: number) => void;
            hideIndex: () => void;
            triggerClose: () => void;

            /** Selected class */
            addSelectedClass: () => void;
            removeSelectedClass: () => void;
        }
    } = Object.create(null);
    /**
     * Having access to the current code editor is vital for some parts of the application
     * For this reason we allow the CodeTab to tell us about its codeEditor instance
     */
    codeEditorMap : {[id:string]: CodeEditor} = Object.create(null);
    tabs: TabInstance[] = [];
    /** Selected tab instance */
    _selectedTabInstance: TabInstance;
    set selectedTabInstance(value: TabInstance) {
        // The active tab class management
        if (this._selectedTabInstance && this.tabHandle[this._selectedTabInstance.id]) {
            this.tabHandle[this._selectedTabInstance.id].removeSelectedClass();
        }
        if (value && value.id && this.tabHandle[value.id]) {
            this.tabHandle[value.id].addSelectedClass();
        }
        // We don't tell non current tabs about search states.
        // So we need to tell them if they *come into focus*
        if (value && value.id && this.tabApi[value.id]) {
            const api = this.tabApi[value.id];
            const options = state.getState().findOptions;
            if (!options.isShown || !options.query) {
                api.search.hideSearch.emit({});
            }
            else {
                api.search.doSearch.emit(options);
            }
        }

        this._selectedTabInstance = value;
        tabStateChanged.emit({});
    }
    get selectedTabInstance() {
        return this._selectedTabInstance;
    }
    /** Tab Sate */
    tabState = {
        /**
         * Resize handling
         */
        _resizingDontReFocus: false,
        debouncedResize: utils.debounce(() => {
            this.tabState._resizingDontReFocus = true;
            this.tabState.resize();
        },200),
        resize: () => {
            this.layout.updateSize();
            this.tabState.resizeTheTabs();
        },
        resizeTheTabs: () => {
            this.tabs.forEach(t => this.tabApi[t.id].resize.emit({}));
        },

        setTabs: (tabs: TabInstance[]) => {
            this.tabs = tabs;
            this.sendTabInfoToServer();
            this.tabState.refreshTipHelp();
        },
        selectTab: (id: string) => {
            let lastSelectedTab = this.selectedTabInstance;
            if (lastSelectedTab && id !== lastSelectedTab.id) {
                this.tabApi[lastSelectedTab.id] && this.tabApi[lastSelectedTab.id].willBlur.emit({});
            }
            this.selectedTabInstance = this.tabs.find(t => t.id == id);
            this.tabState.focusSelectedTabIfAny();
            if (!lastSelectedTab || (lastSelectedTab && lastSelectedTab.id !== id)) {
                this.sendTabInfoToServer();
            }
        },
        focusSelectedTabIfAny: () => {
            this.selectedTabInstance && this.tabApi[this.selectedTabInstance.id].focus.emit({});
        },
        triggerFocusAndSetAsSelected: (id:string) => {
            this.tabHandle[id].triggerFocus();
            this.tabState.selectTab(id);
        },
        refreshTipHelp: () =>{
            // If no tabs show tips
            // If some tabs hide tips
            this.tabs.length ? TipRender.hideTips() : TipRender.showTips();
        },
        tabClosedInLayout: (id: string) => {
            const closedTabInstance = this.tabs.find(t => t.id == id);
            this.closedTabs.push(closedTabInstance);

            const index = this.tabs.map(t=>t.id).indexOf(id);

            delete this.tabHandle[id];
            delete this.tabApi[id];
            delete this.codeEditorMap[id];

            this.tabState.setTabs(this.tabs.filter(t=>t.id !== id));

            // Figure out the tab which will become active
            if (this.selectedTabInstance && this.selectedTabInstance.id === id){
                this.selectedTabInstance = GLUtil.prevOnClose({ id, config: this.layout.toConfig() });
            }

            // The close tab logic inside golden layout, can disconnect the active tab logic of ours
            // (we try to preserve current tab if some other tab closes)
            // So no matter what we need to refocus on the selected tab from within Golden-Layout
            if (this.selectedTabInstance) {
                this.tabHandle[this.selectedTabInstance.id].triggerFocus();
            }
        },
        gotoPosition: (id: string, position: EditorPosition) => {
            setTimeout(()=>this.tabApi[id].gotoPosition.emit(position));
        },

        /**
         * Tab closing
         */
        closeCurrentTab: () => {
            if (!this.selectedTabInstance) return;

            this.tabState.closeTabById(this.selectedTabInstance.id);
        },
        closeTabById: (id: string) => {
            this.tabHandle[id].triggerClose();
        },

        /**
         * Fast tab jumping
         */
        _showingTabIndexes: false,
        _jumpToTabNumber: (oneBasedIndex: number) => {
            const index = oneBasedIndex - 1;
            if (!this.tabs[index]) {
                return;
            }
            const tab = this.tabs[index];
            this.tabState.triggerFocusAndSetAsSelected(tab.id);
            this.tabState.hideTabIndexes();
        },
        _fastTabJumpListener: (evt: KeyboardEvent) => {
            const keyCodeFor1 = 49;
            const tabNumber = evt.keyCode - keyCodeFor1 + 1;

            if (tabNumber >= 1 && tabNumber <= 9) {
                this.tabState._jumpToTabNumber(tabNumber);
            }

            if (evt.keyCode == 39) /* Right */ {
                this.moveCurrentTabRightIfAny();
            }
            if (evt.keyCode == 40) /* Down */ {
                this.moveCurrentTabDownIfAny();
            }
            if (evt.keyCode == 68) /* d */ {
                commands.duplicateTab.emit({});
            }

            // prevent key prop
            evt.preventDefault();
            evt.stopPropagation();
            evt.stopImmediatePropagation();

            this.tabState.hideTabIndexes();
            // console.log(evt, tabNumber); // DEBUG
        },
        _removeOnMouseDown: (evt:MouseEvent) => {
            this.tabState.hideTabIndexes();
        },
        showTabIndexes: () => {
            if (this.tabState._showingTabIndexes) {
                this.tabState.hideTabIndexes();
            }
            // this.debugLayoutTree(); // DEBUG
            this.tabState._showingTabIndexes = true;
            window.addEventListener('keydown', this.tabState._fastTabJumpListener);
            window.addEventListener('mousedown', this.tabState._removeOnMouseDown);
            this.tabs.map((t,i)=>{
                if (!this.tabHandle[t.id]){
                    return;
                }
                this.tabHandle[t.id].showIndex(i + 1);
            });
            if (this.selectedTabInstance) {
                TabMoveHelp.showHelp();
            }
        },
        hideTabIndexes: () => {
            this.tabState._showingTabIndexes = false;
            window.removeEventListener('keydown', this.tabState._fastTabJumpListener);
            window.removeEventListener('mousedown', this.tabState._removeOnMouseDown);
            this.tabs.map((t,i)=>{
                if (!this.tabHandle[t.id]){
                    return;
                }
                this.tabHandle[t.id].hideIndex();
            });
            TabMoveHelp.hideHelp();
        },

        /**
         * Not to be used locally.
         * This is an external API used to drive app tabs contianer for refactorings etc.
         */
        getFocusedCodeEditorIfAny: (): CodeEditor => {
            if (!this.selectedTabInstance
                || !this.selectedTabInstance.id
                || !this.selectedTabInstance.url.startsWith('file:')
                || !this.codeEditorMap[this.selectedTabInstance.id]) {
                return null;
            }
            return this.codeEditorMap[this.selectedTabInstance.id];
        },
        getSelectedTab: (): TabInstance => {
            return this.selectedTabInstance;
        },
        getSelectedFilePath: (): string | undefined => {
            const selected = this.selectedTabInstance;
            if (selected) {
                let url = selected.url;
                if (url.startsWith('file://')) {
                    return utils.getFilePathFromUrl(url);
                }
            }
        },
        getOpenFilePaths: (): string[] => {
            return this.tabs.filter(t => t.url.startsWith('file://')).map(t => utils.getFilePathFromUrl(t.url));
        },
        addTabs: (tabs: TabInstance[]) => {
            tabs.forEach(tab => this.addTabToLayout(tab));
        },
        /**
         * TODO: this function is a bit heavy so can use some caching
         */
        errorsByFilePathFiltered: (): {
            errorsFlattened: types.CodeError[],
            errorsByFilePath: types.ErrorsByFilePath
        } => {
            const allState = state.getState();
            const filter = allState.errorsFilter.trim();
            const mode = allState.errorsDisplayMode;
            const allErrors = errorsCache.getErrors();

            /** Flatten errors as we need those for "gotoHistory" */
            let errorsFlattened = utils.selectMany(Object.keys(allErrors).map(x => allErrors[x]));

            /** Filter by string if any */
            if (filter) {
                errorsFlattened = errorsFlattened.filter(e => e.filePath.includes(filter) || e.message.includes(filter) || e.preview.includes(filter));
            }

            /** Filter by path if any */
            if (mode === types.ErrorsDisplayMode.openFiles) {
                const openFilePaths = utils.createMap(this.tabState.getOpenFilePaths());
                errorsFlattened = errorsFlattened.filter(e => openFilePaths[e.filePath]);
            }

            return {
                errorsFlattened,
                errorsByFilePath: utils.createMapByKey(errorsFlattened, (e) => e.filePath)
            };
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
        willBlur: new TypedEvent() as any,
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

/**
 * Golden layout helpers
 */
namespace GLUtil {
    /** The layout for serialization */
    type Layout = types.TabLayout;

    /**
     * Specialize the `Stack` type in the golden-layout config
     * because of how we configure golden-layout originally
     */
    type Stack = {
        type: 'stack'
        content: {
            id: string;
            props: tab.TabProps
        }[];
        activeItemIndex: number;
    }

    /** We map the stack to a tab stack which is more relevant to our configuration queries */
    interface TabStack {
        selectedIndex: number;
        tabs: TabInstance[];
    }

    /**
     * A visitor for stack
     * Navigates down to any root level stack or the stack as a child of an row / columns
     */
    export const visitAllStacks = (content: GoldenLayout.ItemConfig[], cb: (stack: Stack) => void) => {
        content.forEach(c => {
            if (c.type === 'row' || c.type === 'column') {
                visitAllStacks(c.content, cb);
            }
            if (c.type === 'stack') {
                cb(c as any);
            }
        });
    }

    /**
     * Gets the tab instaces for a given stack
     */
    export function toTabStack(stack: Stack): TabStack {
        const tabs: TabInstance[] = (stack.content || []).map(c => {
            const props: tab.TabProps = c.props;
            const id = c.id;
            return { id: id, url: props.url, additionalData: props.additionalData };
        });
        return {
            selectedIndex: stack.activeItemIndex,
            tabs
        };
    }

    /**
     * Get the gl layout instances for a given tab
     */
    export function fromTabStack(tabs: TabInstance[], appTabsContainer: AppTabsContainer): GoldenLayout.ItemConfig[] {
        return tabs.map(tab => {
            const {url, id, additionalData} = tab;
            const {protocol, filePath} = utils.getFilePathAndProtocolFromUrl(tab.url);
            const props: tab.TabProps = {
                url,
                additionalData,
                onSavedChanged: (saved) => appTabsContainer.onSavedChanged(tab, saved),
                onFocused: () => {
                    if (appTabsContainer.selectedTabInstance && appTabsContainer.selectedTabInstance.id === id)
                        return;
                    appTabsContainer.tabState.selectTab(id)
                },
                api: appTabsContainer.createTabApi(id),
                setCodeEditor: (codeEditor: CodeEditor) => appTabsContainer.codeEditorMap[id] = codeEditor
            };
            const title = tabRegistry.getTabConfigByUrl(url).getTitle(url);

            return {
                type: 'react-component',
                component: protocol,
                title,
                props,
                id
            };
        });
    }

    /**
     * Get the tabs in order
     */
    export function orderedTabs(config:GoldenLayout.Config): TabInstance[] {
        let result: TabInstance[] = [];

        const addFromStack = (stack: Stack) => result = result.concat(toTabStack(stack).tabs);

        // Add from all stacks
        visitAllStacks(config.content, addFromStack);

        return result;
    }

    /**
     * Serialize the tab layout
     */
    export function serializeConfig(config: GoldenLayout.Config, appTabsContainer: AppTabsContainer) {
        /** Assume its a stack to begin with */
        let result: Layout = {
            type: 'stack',
            width: 100,
            height: 100,
            tabs:[],
            subItems: [],
            activeItemIndex: 0,
        }

        /** The root is actually just `root` with a single content item if any */
        const goldenLayoutRoot = config.content[0];
        // and its empty so we good
        if (!goldenLayoutRoot) {
            return result;
        }

        /**
         * Recursion helpers
         */
        function addStackItemsToLayout(layout: Layout, glStack: GoldenLayout.ItemConfig) {
            const stack: Layout = {
                type: 'stack',
                width: glStack.width || 100,
                height: glStack.height || 100,
                tabs: toTabStack(glStack as any).tabs,
                subItems: [],
                activeItemIndex: (glStack as any).activeItemIndex,
            }
            layout.subItems.push(stack);
        }
        function addRowItemsToLayout(layout: Layout, glRow: GoldenLayout.ItemConfig) {
            const row: Layout = {
                type: 'row',
                width: glRow.width || 100,
                height: glRow.height || 100,
                tabs: [],
                subItems: [],
                activeItemIndex: 0,
            }
            layout.subItems.push(row);
            (glRow.content || []).forEach(c => callRightFunctionForGlChild(row, c));
        }
        function addColumnItemsToLayout(layout: Layout, glColumn: GoldenLayout.ItemConfig) {
            const column: Layout = {
                type: 'column',
                width: glColumn.width || 100,
                height: glColumn.height || 100,
                tabs: [],
                subItems: [],
                activeItemIndex: 0,
            }
            layout.subItems.push(column);
            (glColumn.content || []).forEach(c => callRightFunctionForGlChild(column, c));
        }
        function callRightFunctionForGlChild(layout: Layout, c: GoldenLayout.ItemConfigType) {
            if (c.type === 'column') {
                addColumnItemsToLayout(layout, c);
            }
            if (c.type === 'row') {
                addRowItemsToLayout(layout, c);
            }
            if (c.type === 'stack') {
                addStackItemsToLayout(layout, c);
            }
        }

        // So the root `type` is whatever it really is
        result.type = goldenLayoutRoot.type;
        /** If the root is a stack .. we done */
        if (goldenLayoutRoot.type === 'stack') {
            result.tabs = toTabStack(goldenLayoutRoot as any).tabs;
        }
        else {
            /** Start the recursion at the root */
            (goldenLayoutRoot.content || []).forEach(c => callRightFunctionForGlChild(result, c));
        }

        // console.log(result);
        // unserializeConfig(result, appTabsContainer); // DEBUG : how it will unserilize later
        return result;
    }

    export function unserializeConfig(layout: Layout, appTabsContainer: AppTabsContainer): any {
        /**
         * Recursion helpers
         */
        function stackLayout(layout: Layout): GoldenLayout.ItemConfig {
            const stack: GoldenLayout.ItemConfig = {
                type: 'stack',
                width: layout.width || 100,
                height: layout.height || 100,
                content: fromTabStack(layout.tabs, appTabsContainer),
                activeItemIndex: layout.activeItemIndex,
            }
            return stack;
        }
        function rowLayout(layout: Layout): GoldenLayout.ItemConfig {
            const row: GoldenLayout.ItemConfig = {
                type: 'row',
                width: layout.width || 100,
                height: layout.height || 100,
                content: layout.subItems.map(c => callRightFunctionForLayoutChild(c)),
            }
            return row;
        }
        function columnLayout(layout: Layout): GoldenLayout.ItemConfig {
            const column: GoldenLayout.ItemConfig = {
                type: 'column',
                width: layout.width || 100,
                height: layout.height || 100,
                content: layout.subItems.map(c => callRightFunctionForLayoutChild(c)),
            }
            return column;
        }
        function callRightFunctionForLayoutChild(layout: Layout): GoldenLayout.ItemConfigType {
            if (layout.type === 'column') {
                return columnLayout(layout);
            }
            if (layout.type === 'row') {
                return rowLayout(layout);
            }
            if (layout.type === 'stack') {
                return stackLayout(layout);
            }
        }

        const result: GoldenLayout.Config = {
            content: [callRightFunctionForLayoutChild(layout)]
        };

        // console.log(result); // DEBUG : the outcome of unserialization
        return result;
    }

    /**
     * It will be the previous tab on the current stack
     * and if the stack is empty it will be the active tab on previous stack (if any)
     */
    export function prevOnClose(args: { id: string, config: GoldenLayout.Config }): TabInstance | null {
        const stacksInOrder: TabStack[] = [];
        visitAllStacks(args.config.content, (stack) => stacksInOrder.push(toTabStack(stack)));

        /** Find the stack that has this id */
        const stackWithClosingTab = stacksInOrder.find(s => s.tabs.some(t => t.id === args.id));

        /** if the last tab in the stack */
        if (stackWithClosingTab.tabs.length === 1) {
            /** if this is the last stack then we will run out of tabs. Return null */
            if (stacksInOrder.length == 1) {
                return null;
            }
            /** return the active in the previous stack (with loop around) */
            const previousStackIndex = utils.rangeLimited({
                num: stacksInOrder.indexOf(stackWithClosingTab) - 1,
                min: 0,
                max: stacksInOrder.length - 1,
                loopAround: true
            });

            const previousStack = stacksInOrder[previousStackIndex];
            return previousStack.tabs[previousStack.selectedIndex];
        }
        /** Otherwise return the previous in the same stack (with loop around)*/
        else {
            const previousIndex = utils.rangeLimited({
                num: stackWithClosingTab.tabs.map(t => t.id).indexOf(args.id) - 1,
                min: 0,
                max: stackWithClosingTab.tabs.length - 1,
                loopAround: true
            });
            return stackWithClosingTab.tabs[previousIndex];
        }
    }
}

namespace TabMoveHelp {
    let tabMoveDisplay: JQuery = null;
    export function showHelp(){
        tabMoveDisplay = $(`
<div class="alm_tabMove">
    <div>
        <span class="keyStrokeStyle">Tab Number</span> Jump to tab
    </div>
    <div>
        <span class="keyStrokeStyle">ESC</span> Exit
    </div>
    <div>
        <span class="keyStrokeStyle"><i class="fa fa-arrow-right"></i></span>
        Move active tab to a new rightmost pane
    </div>
    <div>
        <span class="keyStrokeStyle"><i class="fa fa-arrow-down"></i></span>
        Move active tab to a new bottom pane
    </div>
    <div>
        <span class="keyStrokeStyle">d</span> Duplicate current tab
    </div>
</div>
            `);
        $(document.body).append(tabMoveDisplay);
    }
    export function hideHelp(){
        if (tabMoveDisplay){
            tabMoveDisplay.remove();
            tabMoveDisplay = null;
        }
    }
}

namespace TipRender {
    let tipDisplay: JQuery = null;
    export function showTips() {
        if (!tipDisplay) {
            const node = document.createElement('div');
            node.className="alm_tipRoot";
            tipDisplay = $(node);
            $('.lm_root').append(node);
            ReactDOM.render(<Tips/>,node);
        }
        tipDisplay.show();
    }
    export function hideTips() {
        if (tipDisplay){
            tipDisplay.hide();
        }
    }
}

/**
 * Emitted whenever the state changes
 * This bad boy is at the bottom because it broke syntax highlighting in atom :-/
 */
export const tabStateChanged = new TypedEvent<{}>();
