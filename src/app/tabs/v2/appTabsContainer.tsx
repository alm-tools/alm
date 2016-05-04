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
import {CodeEditor} from "../../codemirror/codeEditor";

/**
 * Singleton + tab state migrated from redux to the local component
 * This is because the component isn't very react friendly
 */
declare var _helpMeGrabTheType: AppTabsContainer;
export let tabState: typeof _helpMeGrabTheType.tabState;
export const tabStateChanged = new TypedEvent<{}>();

export interface TabInstance {
    id: string;
    url: string;
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

            // Create tab instances
            let openTabs = res.openTabs;
            let tabInstances: TabInstance[] = openTabs.map(t => {
                return {
                    id: createId(),
                    url: t.url,
                    saved: true
                };
            });

            // Add the tabs to the layout
            this.tabs = [];
            tabInstances.forEach(t => this.addTabToLayout(t, false));

            // Select the last one
            tabInstances.length && tabState.selectTab(tabInstances[tabInstances.length - 1].id);
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
                this.tabState.tabClosedInLayout(evt.config.id);
            }
        });
        (this.layout as any).on('stateChanged', (evt) => {
            // console.log(evt); // DEBUG

            // Due to state changes layout needs to happen on *all tabs* (because it might expose some other tabs)
            // PREF : you can go thorough all the `stack` in the layout and only call resize on the active ones.
            this.tabState.resize();

            // Ignore the events where the user is dragging stuff
            // This is because at this time the `config` doesn't contain the *dragged* item.
            if (evt.origin && typeof evt.origin._dropSegment === 'string') {
                return;
            }
            // Ignore the events where the number of tabs doesn't match up
            // This is *also* because the user is dragging stuff
            const config = this.layout.toConfig();
            const orderedtabs = GLUtil.orderedTabs(this.layout.toConfig());
            if (orderedtabs.length !== this.tabs.length) {
                return;
            }

            // Store the tabs in the right order
            this.tabState.setTabs(orderedtabs);

            // If there was a selected tab focus on it again.
            this.selectedTabInstance && this.tabState.selectTab(this.selectedTabInstance.id);
        });

        /**
         * General command handling
         */
        this.setupCommandHandling()
    }

    /** Used to undo close tab */
    closedTabs: TabInstance[] = [];

    /**
     * Lots of commands are raised in the app that we need to care about
     * e.g. tab saving / tab switching / file opening etc.
     * We do that all in here
     */
    setupCommandHandling(){
        commands.saveTab.on((e) => {
            this.getSelectedTabApiIfAny().save.emit({});
        });
        commands.esc.on(() => {
            this.tabState.focusSelectedTabIfAny();
            this.tabState.hideTabIndexes();
        });
        commands.jumpToTab.on(()=>{
            // jump to tab
            this.tabState.showTabIndexes();
        });

        /**
         * File opening commands
         */
         commands.doOpenFile.on((e) => {
             let codeTab: TabInstance = {
                 id: createId(),
                 url: `file://${e.filePath}`
             }

             // Add tab
             this.addTabToLayout(codeTab);

             // Focus
             this.tabState.selectTab(codeTab.id);
             if (e.position) {
                 this.tabApi[codeTab.id].gotoPosition.emit(e.position);
             }
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
          * Close tab commands
          */
         commands.closeTab.on((e) => {
             // Remove the selected
             this.tabState.closeCurrentTab();
         });
          // TODO: tab
        //   commands.closeOtherTabs.on((e)=>{
        //       let tabs = this.props.tabs.filter((t,i)=>i == this.props.selectedTabIndex);
        //       this.afterComponentDidUpdate(this.sendTabInfoToServer);
        //       this.afterComponentDidUpdate(this.focusAndUpdateStuffWeKnowAboutCurrentTab);
        //       state.setTabs(tabs);
        //       this.selectTab(0);
        //   });
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

    /**
     * Does exactly what it says.
     */
    addTabToLayout = (tab: TabInstance, sendToServer = true) => {
        this.tabs.push(tab);
        if (sendToServer) {
            this.sendTabInfoToServer();
        }

        const {url, id} = tab;
        const {protocol,filePath} = utils.getFilePathAndProtocolFromUrl(tab.url);
        const props: tab.TabProps = {
            url,
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

        // Find the active stack if any.
        // If not find we just add it to the root
        let contentRoot = this.layout.root.contentItems[0];
        let currentItemAndParent = this.getCurrentTabRootStackIfAny();
        if (currentItemAndParent) contentRoot = currentItemAndParent.parent;

        // TODO: tab
        // if the root is empty add a stack as the root

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

    private moveCurrentTabRightIfAny = () => {

        /**
         * Utility to create a container that doesn't reinitialize its children
         */
        const createContainer = (type:'stack'|'row'|'column') => {
            const item = this.layout.createContentItem({
                type: type,
                content: []
            }) as any as GoldenLayout.ContentItem;
            item.isInitialised = true; // Prevents initilizing its children
            return item;
        }

        /**
         * Utility that doesn't *uninitalize* the child it is removing
         */
        const detachFromParent = (item: GoldenLayout.ContentItem) => {
            item.parent.removeChild(item, true);
        }

        // TODO: tab
        let currentItemAndParent = this.getCurrentTabRootStackIfAny();
        if (!currentItemAndParent) return;
        const {item,parent} = currentItemAndParent;
        const root = parent.parent;

        // Very much a WIP
        // Basing it on programatic reorder demo
        // https://www.golden-layout.com/examples/#2e5d0456964b59f9eec1ecb44e1d31eb

        /** Can't move the last item */
        if (parent.contentItems.length === 1) {
            return;
        }

        if (root.type === 'stack' || root.type === 'root') {
            // Remove from old
            parent.removeChild(item, true);
            root.removeChild(parent, true);

            // Create a new containers
            const newRootElement = createContainer('row');
            const newItemRootElement = createContainer('stack');

            // Add to new layout
            // First add item to move to a new stack
            newItemRootElement.addChild(item);
            // Next group the old parent and the new item root in the new `row`
            newRootElement.addChild(parent);
            newRootElement.addChild(newItemRootElement);
            // Finally add this new `row` to the old root
            root.addChild(newRootElement);
        }
        else if (root.type === 'row') {
            // Remove from old
            parent.removeChild(item, true);

            // Create a new container
            const newItemRootElement = createContainer('stack');

            // Add this new container
            newItemRootElement.addChild(item);

            // Add this new container to the root
            root.addChild(newItemRootElement);
        }
        else if (root.type === 'column') {
            // TODO: tab
            // i don't know :-/
            console.log('figure this out please');
        }
        else {
            console.error('Not a `stack` or `row` or `column` or `root` ... I did not see this comming');
        }

    }

    private moveCurrentTabDownIfAny = () => {
        // TODO: tab
        let currentItemAndParent = this.getCurrentTabRootStackIfAny();
        if (!currentItemAndParent) return;
    }

    private sendTabInfoToServer = () => {
        server.setOpenUITabs({
            sessionId: getSessionId(),
            openTabs: this.tabs.map(t=>({
                url: t.url
            }))
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
            // But not if the user is clicking the close button or center clicking (close)
            const centerClick = evt.button === 1;
            const closeButtonClicked = evt.target && evt.target.className == "lm_close_tab";
            if (centerClick || closeButtonClicked) {
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
            triggerFocus: () => void;
            showIndex: (i: number) => void;
            hideIndex: () => void;
            triggerClose: () => void;
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
        this._selectedTabInstance = value;
        tabStateChanged.emit({});
    }
    get selectedTabInstance() {
        return this._selectedTabInstance;
    }
    /** Tab Sate */
    tabState = {
        resize: () => {
            this.tabs.forEach(t=>this.tabApi[t.id].resize.emit({}));
        },
        setTabs: (tabs: TabInstance[]) => {
            this.tabs = tabs;
            this.sendTabInfoToServer();
        },
        selectTab: (id: string) => {
            this.selectedTabInstance = this.tabs.find(t => t.id == id);
            this.tabState.focusSelectedTabIfAny();
            // TODO: tab
            // this.updateStuffWeKnowAboutCurrentTab();
        },
        focusSelectedTabIfAny: () => {
            this.selectedTabInstance && this.tabApi[this.selectedTabInstance.id].focus.emit({});
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

        /**
         * Tab closing
         */
        closeCurrentTab: () => {
            if (!this.selectedTabInstance) return;

            this.tabHandle[this.selectedTabInstance.id].triggerClose();
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
             this.tabHandle[tab.id].triggerFocus();
             this.tabState.selectTab(tab.id);
             this.tabState.hideTabIndexes();
         },
        _fastTabJumpListener: (evt:KeyboardEvent)=>{
            const keyCodeFor1 = 49;
            const tabNumber = evt.keyCode - keyCodeFor1 + 1;

            if (tabNumber >= 1 && tabNumber <= 9){
                this.tabState._jumpToTabNumber(tabNumber);
            }

            if (evt.keyCode == 39) /* Right */ {
                this.moveCurrentTabRightIfAny();
            }
            if (evt.keyCode == 40) /* Down */ {
                this.moveCurrentTabDownIfAny();
            }

            // prevent key prop
            evt.preventDefault();
            evt.stopPropagation();
            evt.stopImmediatePropagation();

            this.tabState.hideTabIndexes();
            // console.log(evt, tabNumber); // DEBUG
        },
        showTabIndexes: () => {
            if (this.tabState._showingTabIndexes) {
                this.tabState.hideTabIndexes();
            }
            this.tabState._showingTabIndexes = true;
            window.addEventListener('keydown', this.tabState._fastTabJumpListener);
            this.tabs.map((t,i)=>{
                if (!this.tabHandle[t.id]){
                    return;
                }
                this.tabHandle[t.id].showIndex(i + 1);
            });
        },
        hideTabIndexes: () => {
            this.tabState._showingTabIndexes = false;
            window.removeEventListener('keydown', this.tabState._fastTabJumpListener);
            this.tabs.map((t,i)=>{
                if (!this.tabHandle[t.id]){
                    return;
                }
                this.tabHandle[t.id].hideIndex();
            });
        },

        /**
         * Not to be used locally
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

/**
 * Golden layout helpers
 */
namespace GLUtil {

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
        const tabs: TabInstance[] = stack.content.map(c => {
            const props: tab.TabProps = c.props;
            const id = c.id;
            return { id: id, url: props.url };
        });
        return {
            selectedIndex: stack.activeItemIndex,
            tabs
        };
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
