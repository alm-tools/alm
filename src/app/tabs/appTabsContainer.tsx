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
import {getSessionId, setSessionId} from "./clientSession";

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
export var appTabsContainer: AppTabsContainer;

@connect((state: state.StoreState): Props => {
    return {
        tabs: state.tabs,
        selectedTabIndex: state.selectedTabIndex
    };
})
@ui.Radium
export class AppTabsContainer extends ui.BaseComponent<Props, State>{

    closedTabs: state.TabInstance[] = [];

    constructor(props: Props) {
        super(props);

        this.state = {
            selected: 0,
        };
    }

    componentWillReceiveProps(nextProps: Props) {
        setTimeout(() => {
            let comp = this.getSelectedComponent();
            if (comp) {
                comp.focus();
            }
        });
    }

    refs: { [string: string]: tab.Component; }

    componentDidMount() {
        appTabsContainer = this;

        /**
         * Setup preventing the user to exit if there is an open tab
         */
        alertOnLeave.addCheck(() => this.props.tabs.filter(tab => !tab.saved).length && `You have ${this.props.tabs.length} tabs open (you can close them using Alt + W)`);

        commands.nextTab.on(() => {
            let selected = rangeLimited({ min: 0, max: this.props.tabs.length - 1, num: this.props.selectedTabIndex + 1, loopAround: true });
            this.selectTab(selected);
        });
        commands.prevTab.on(() => {
            let selected = rangeLimited({ min: 0, max: this.props.tabs.length - 1, num: this.props.selectedTabIndex - 1, loopAround: true });
            this.selectTab(selected);
        });

        commands.doOpenFile.on((e) =>{
            let codeTab: state.TabInstance = {
                id: createId(),
                url: `file://${e.filePath}`,
                saved: true
            }

            this.afterComponentDidUpdate(this.sendTabInfoToServer);
            this.afterComponentDidUpdate(this.focusAndUpdateStuffWeKnowAboutCurrentTab);
            if (e.position) {
                this.afterComponentDidUpdate(() => this.gotoPositionOnSelectedTab(e.position));
            }
            state.addTabAndSelect(codeTab);
        });

        commands.doOpenDependencyView.on((e) =>{
            let codeTab: state.TabInstance = {
                id: createId(),
                url: `dependency://Dependency View`,
                saved: true
            }

            this.afterComponentDidUpdate(this.sendTabInfoToServer);
            this.afterComponentDidUpdate(this.focusAndUpdateStuffWeKnowAboutCurrentTab);
            state.addTabAndSelect(codeTab);
        });

        commands.findAndReplaceMulti.on((e) =>{
            // if open and active => focus
            // if open and not active => active
            // if not open and active
            if (this.props.tabs.length
                && utils.getFilePathAndProtocolFromUrl(this.props.tabs[this.props.selectedTabIndex].url).protocol === 'farm'){
                this.getSelectedComponent().focus();
                return;
            }

            let openTabIndex = this.props.tabs.map(t=> utils.getFilePathAndProtocolFromUrl(t.url).protocol === 'farm').indexOf(true);
            if (openTabIndex !== -1) {
                this.selectTab(openTabIndex);
                return;
            }

            let farmTab: state.TabInstance = {
                id: createId(),
                url: `farm://Find And Replace`,
                saved: true
            }
            this.afterComponentDidUpdate(this.sendTabInfoToServer);
            this.afterComponentDidUpdate(this.focusAndUpdateStuffWeKnowAboutCurrentTab);
            state.addTabAndSelect(farmTab);
        });

        let getCurrentFilePathOrWarn = () => {
            let tab = state.getSelectedTab();
            let notify = () => ui.notifyWarningNormalDisappear('Need a valid file path for this action. Make sure you have a *file* tab as active');
            if (!tab) {
                notify();
                return;
            }
            let {protocol,filePath} = utils.getFilePathAndProtocolFromUrl(tab.url);
            if (protocol !== 'file'){
                notify();
                return;
            }
            return filePath;
        }

        let openAst = (mode:Types.ASTMode)=>{
            let filePath = getCurrentFilePathOrWarn();
            if (!filePath) return;

            let codeTab: state.TabInstance = {
                id: createId(),
                url: `${mode == Types.ASTMode.visitor ? 'ast' : 'astfull'}://${filePath}`,
                saved: true
            }

            this.afterComponentDidUpdate(this.sendTabInfoToServer);
            this.afterComponentDidUpdate(this.focusAndUpdateStuffWeKnowAboutCurrentTab);
            state.addTabAndSelect(codeTab);
        }

        commands.doOpenASTView.on((e) =>{
            openAst(Types.ASTMode.visitor);
        });

        commands.doOpenASTFullView.on((e) =>{
            openAst(Types.ASTMode.children);
        });

        commands.doOpenOrFocusFile.on((e)=>{
            // if open and focused just goto pos
            // if open and not focused then focus and goto pos
            // if not open the file and focus and goto pos
            if (this.props.tabs.length
                && utils.getFilePathFromUrl(this.props.tabs[this.props.selectedTabIndex].url) == e.filePath){
                if (e.position) {
                    this.gotoPositionOnSelectedTab(e.position)
                }
                else {
                    this.getSelectedComponent().focus();
                }
                return;
            }

            let openTabIndex = this.props.tabs.map(t=> utils.getFilePathFromUrl(t.url) == e.filePath).indexOf(true);
            if (openTabIndex !== -1) {
                if (e.position) {
                    this.afterComponentDidUpdate(() => this.gotoPositionOnSelectedTab(e.position));
                }
                this.selectTab(openTabIndex);
                return;
            }

            let codeTab: state.TabInstance = {
                id: createId(),
                url: `file://${e.filePath}`,
                saved: true
            }
            this.afterComponentDidUpdate(this.sendTabInfoToServer);
            this.afterComponentDidUpdate(this.focusAndUpdateStuffWeKnowAboutCurrentTab);
            if (e.position) {
                this.afterComponentDidUpdate(() =>
                        {
                            this.gotoPositionOnSelectedTab(e.position)
                        }
                    );
            }
            state.addTabAndSelect(codeTab);
        });

        commands.doOpenOrActivateFileTab.on((e)=>{
            // if open and active nothing
            // if open and not active then active
            // if not open the file and focus and goto pos
            if (this.props.tabs.length
                && utils.getFilePathFromUrl(this.props.tabs[this.props.selectedTabIndex].url) == e.filePath){
                return;
            }

            let openTabIndex = this.props.tabs.map(t=> utils.getFilePathFromUrl(t.url) == e.filePath).indexOf(true);
            if (openTabIndex !== -1) {
                this.selectTab(openTabIndex, false);
                return;
            }

            let codeTab: state.TabInstance = {
                id: createId(),
                url: `file://${e.filePath}`,
                saved: true
            }
            this.afterComponentDidUpdate(this.sendTabInfoToServer);
            this.afterComponentDidUpdate(this.updateStuffWeKnowAboutCurrentTab);
            state.addTabAndSelect(codeTab);
        });

        commands.doOpenOrFocusTab.on(e=>{
            // if open and focused just goto pos
            // if open and not focused then focus and goto pos
            // if not open the file and focus and goto pos
            if (this.props.tabs.length
                && this.props.tabs[this.props.selectedTabIndex].id == e.tabId){
                if (e.position) {
                    this.gotoPositionOnSelectedTab(e.position)
                }
                return;
            }

            let openTabIndex = this.props.tabs.map(t=> t.id == e.tabId).indexOf(true);
            if (openTabIndex !== -1) {
                if (e.position) {
                    this.afterComponentDidUpdate(() => this.gotoPositionOnSelectedTab(e.position));
                }
                this.selectTab(openTabIndex);
                return;
            }

            let codeTab: state.TabInstance = {
                id: e.tabId,
                url: e.tabUrl,
                saved: true
            }
            this.afterComponentDidUpdate(this.sendTabInfoToServer);
            this.afterComponentDidUpdate(this.focusAndUpdateStuffWeKnowAboutCurrentTab);
            if (e.position) {
                this.afterComponentDidUpdate(() =>this.gotoPositionOnSelectedTab(e.position));
            }
            state.addTabAndSelect(codeTab);
        });

        commands.closeTab.on((e)=>{
            // Remove the selected
            this.closeTab(this.props.selectedTabIndex);
        });

        commands.closeOtherTabs.on((e)=>{
            let tabs = this.props.tabs.filter((t,i)=>i == this.props.selectedTabIndex);
            this.afterComponentDidUpdate(this.sendTabInfoToServer);
            this.afterComponentDidUpdate(this.focusAndUpdateStuffWeKnowAboutCurrentTab);
            state.setTabs(tabs);
            this.selectTab(0);
        });

        commands.closeFilesDirs.on((e)=>{
            // To preserve the selected tab after closing
            let currentTabId = state.getSelectedTab() && state.getSelectedTab().id;

            let toClose = (filePath:string) => {
                return e.files.indexOf(filePath) !== -1 || e.dirs.some(dirPath => filePath.startsWith(dirPath));
            }
            let tabs = this.props.tabs.filter((t,i)=> {
                let {protocol,filePath} = utils.getFilePathAndProtocolFromUrl(t.url);
                return protocol !== 'file' || !toClose(filePath);
            });

            this.afterComponentDidUpdate(this.sendTabInfoToServer);
            this.afterComponentDidUpdate(this.focusAndUpdateStuffWeKnowAboutCurrentTab);
            state.setTabs(tabs);

            // ensure a valid selected tab index
            let tabStillOpen = this.props.tabs.map((t,i)=>({t,i})).find(ti=>ti.t.id == currentTabId);
            let selectedTabIndex = tabStillOpen ? tabStillOpen.i : this.props.tabs.length - 1;
            this.selectTab(selectedTabIndex);
        });

        commands.saveTab.on((e) => {
            let component = this.getSelectedComponent();
            if (component) {
                component.save();
            }
        });

        commands.esc.on(()=>{
            let component = this.getSelectedComponent();
            if (component) {
                component.focus();
            }
        });

        commands.findNext.on(()=>{
            let component = this.getSelectedComponent();
            if (component) {
                let findOptions = state.getState().findOptions;
                component.search.findNext(findOptions);
            }
        });
        commands.findPrevious.on(()=>{
            let component = this.getSelectedComponent();
            if (component) {
                let findOptions = state.getState().findOptions;
                component.search.findPrevious(findOptions);
            }
        });
        commands.replaceNext.on((e)=>{
            let component = this.getSelectedComponent();
            if (component) {
                component.search.replaceNext(e.newText);
            }
        });
        commands.replacePrevious.on((e)=>{
            let component = this.getSelectedComponent();
            if (component) {
                component.search.replacePrevious(e.newText);
            }
        });
        commands.replaceAll.on((e)=>{
            let component = this.getSelectedComponent();
            if (component) {
                component.search.replaceAll(e.newText);
            }
        });

        this.disposible.add(state.subscribeSub(state=>state.findOptions,(findQuery)=>{
            this.updateStuffWeKnowAboutCurrentTab();
        }));

        commands.openFileFromDisk.on(() => {
            ui.comingSoon("Open a file from the server disk");
        });

        commands.undoCloseTab.on(() => {
            if (this.closedTabs.length) {
                let tab = this.closedTabs.pop();
                state.addTabAndSelect(tab);
                this.selectTab(this.props.tabs.length - 1);
                this.afterComponentDidUpdate(this.sendTabInfoToServer);
            }
        });

        let gotoIndex = (index) => this.props.tabs[index] && this.selectTab(index);
        commands.gotoTab1.on(() => gotoIndex(0));
        commands.gotoTab2.on(() => gotoIndex(1));
        commands.gotoTab3.on(() => gotoIndex(2));
        commands.gotoTab4.on(() => gotoIndex(3));
        commands.gotoTab5.on(() => gotoIndex(4));
        commands.gotoTab6.on(() => gotoIndex(5));
        commands.gotoTab7.on(() => gotoIndex(6));
        commands.gotoTab8.on(() => gotoIndex(7));
        commands.gotoTab9.on(() => gotoIndex(8));

        /** Restore any open tabs from last session */
        server.getOpenUITabs({ sessionId: getSessionId() }).then((res) => {
            setSessionId(res.sessionId);

            if (!res.openTabs.length) return;

            let openTabs = res.openTabs;
            let tabInstances: state.TabInstance[] = openTabs.map(t=> {
                return {
                    id: createId(),
                    url: t.url,
                    saved: true
                };
            });

            state.addTabs(tabInstances);
            state.selectTab(this.props.tabs.length - 1);
            this.focusAndUpdateStuffWeKnowAboutCurrentTab();
        });
    }

    private sendTabInfoToServer = () => {
        server.setOpenUITabs({
            sessionId: getSessionId(),
            openTabs: this.props.tabs.map(t=>({
                url: t.url
            }))
        });
    }

    render() {
        let selectedIndex = this.props.selectedTabIndex;

        let titles = this.props.tabs.map((t, i) =>{
            let title = tabRegistry.getTabConfigByUrl(t.url).getTitle(t.url);

            var style = [tabHeader, i == selectedIndex ? tabHeaderActive : {}];

            let handleTitleClose = (event:React.SyntheticEvent) => {
                this.closeTab(i);
                event.stopPropagation();
            };
            let titleCloseStyle = {width:'1rem', textAlign:'center', marginLeft: '.2rem', ":hover": {color: styles.errorColor}};

            let titleIcon: JSX.Element;
            if (!t.saved){
                style.push(tabHeaderUnsaved);
                titleIcon = <Icon style={titleCloseStyle} name="life-ring" title="Save and close" onClick={handleTitleClose}/>
            }
            else {
                titleIcon = <Icon style={titleCloseStyle} name="times" onClick={handleTitleClose}/>;
            }

            return <span
                key={`tabHeader ${t.id}`}
                style={style}
                onClick={(event)=>this.onTabClicked(event.nativeEvent as MouseEvent,i)}>
                <span key={`tabHeaderTitle ${i}`}>{title}</span> {titleIcon}
            </span>
        });

        let rederedTabs = this.props.tabs.map((t,i)=>{
            let isSelected = selectedIndex == i;
            let style = ( isSelected ? {} : { display: 'none' });

            let Component = tabRegistry.getComponentByUrl(t.url);

            return <div className="app-tabs-container-component-div" key={t.id} style={[csx.flex,csx.flexRoot,style, {maxWidth:'100%'}]}>
                <Component ref={t.id} url={t.url} onSavedChanged={(saved)=>{this.onSavedChanged(saved,i)}} saved={t.saved}/>
            </div>
        });

        return (
            <div style={[csx.vertical,csx.flex,{maxWidth:'100%'}]} className="app-tabs">
                <div style={[csx.content,csx.horizontal, tabHeaderContainer]} className="app-tabs-header">
                    {titles}
                </div>
                <div style={[csx.flexRoot, csx.flex, csx.scroll]} className="app-tabs-body">
                    {
                        rederedTabs.length
                        ? rederedTabs
                        : <Tips/>
                     }
                </div>
            </div>
        );
    }

    onTabClicked = (event: MouseEvent,index) => {
        // center click:
        if (event.which == 2) {
            this.closeTab(index);
        }
        else {
            this.selectTab(index);
        }
    }

    onSavedChanged = (saved: boolean, index: number) => {
        state.setTabSaveStatus({index,saved});
    }

    gotoPositionOnSelectedTab(position: EditorPosition) {
        let component = this.getSelectedComponent();
        if (component) {
            component.gotoPosition(position);
        }
    }

    /** Called if the options change OR tab gets selected */
    updateStuffWeKnowAboutCurrentTab = () => {
        let component = this.getSelectedComponent();
        if (!component) return;

        let options = state.getState().findOptions;
        if (!options.isShown || !options.query) {
            component.search.hideSearch()
        }
        else {
            component.search.doSearch(options)
        }
    }

    private selectTab(selected: number, focus = true) {
        // cant select what aint there
        if (this.props.tabs.length == 0) {
            return;
        }

        if (this.props.selectedTabIndex == selected){
            let component = this.getSelectedComponent();
            if (component && focus){
                component.focus();
            }
        }

        this.afterComponentDidUpdate(this.focusAndUpdateStuffWeKnowAboutCurrentTab);
        state.selectTab(selected);
    }

    focusAndUpdateStuffWeKnowAboutCurrentTab = () => {
        let component = this.getSelectedComponent();
        if (component) {
            component.focus();
            this.updateStuffWeKnowAboutCurrentTab();
        }
    }

    getSelectedComponent(): tab.Component {
        let selected = this.props.selectedTabIndex;
        let tab = this.props.tabs[selected];
        return tab && tab.id ? this.refs[tab.id] : undefined;
    }

    closeTab(index: number) {
        // If no tabs
        if (!this.props.tabs.length) {
            return;
        }

        // inform the component
        let component = this.refs[this.props.tabs[index].id];
        component.close();

        let closed = this.props.tabs[index];
        this.closedTabs.push(closed);

        this.afterComponentDidUpdate(this.sendTabInfoToServer);
        state.removeTab(index);

        // If this is the selected tab, Figure out the next:
        if (index == this.props.selectedTabIndex) {
            // Nothing to do
            if (!this.props.tabs.length) {
                return;
            }
            // Previous
            let next = rangeLimited({ num: --index, min: 0, max: this.props.tabs.length });
            this.selectTab(next);
        }
        // If this is a tab before the selected, decrement selected
        else if (index < this.props.selectedTabIndex){
            this.afterComponentDidUpdate(this.focusAndUpdateStuffWeKnowAboutCurrentTab);
            state.selectPreviousTab({});
        }
    }
}

export function getFileName(filePath:string){
    let parts = filePath.split('/');
    return parts[parts.length - 1];
}
