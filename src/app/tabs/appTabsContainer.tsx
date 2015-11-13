/**
 * This maintains the User interface Tabs for app,
 * e.g. selected tab, any handling of open tab requests etc.
 */

import * as ui from "../ui";
import * as React from "react";
import * as tab from "./tab";
// import {DashboardTab} from "./dashboardTab";
import {Code} from "./codeTab";
import * as commands from "../commands/commands";
import * as utils from "../../common/utils";
import csx = require('csx');
import {createId} from "../../common/utils";

import {tabHeaderContainer,tabHeader,tabHeaderActive,tabHeaderUnsaved} from "../styles/styles";

import {server} from "../../socket/socketClient";
import {rangeLimited} from "../../common/utils";
import {statusBar} from "../statusBar";

import * as state from "../state/state";
import * as types from "../../common/types";
import {connect} from "react-redux";
import * as styles from "../styles/styles";
import {Tips} from "./tips";
import {Icon} from "../icon";
import {cast} from "../../socket/socketClient";

export interface Props extends React.Props<any> {
    // redux connected below
    tabs?: state.TabInstance[];
    selectedTabIndex?: number;
}

export interface State {
}

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

        commands.doOpenOrFocusFile.on((e)=>{
            // if open and focused just goto pos
            // if open and not focused then focus and goto pos
            // if not open the file and focus and goto pos
            if (this.props.tabs.length
                && utils.getFilePathFromUrl(this.props.tabs[this.props.selectedTabIndex].url) == e.filePath){
                if (e.position) {
                    this.gotoPositionOnSelectedTab(e.position)
                }
                return;
            }

            let openTabIndex = this.props.tabs.map(t=> utils.getFilePathFromUrl(t.url) == e.filePath).indexOf(true);
            if (openTabIndex !== -1) {
                this.selectTab(openTabIndex);
                if (e.position) {
                    this.afterComponentDidUpdate(() => this.gotoPositionOnSelectedTab(e.position));
                }
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
                this.afterComponentDidUpdate(() => this.gotoPositionOnSelectedTab(e.position));
            }
            state.addTabAndSelect(codeTab);
        });

        commands.closeTab.on((e)=>{
            // Remove the selected
            this.closeTab(this.props.selectedTabIndex);
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
                component.findNext(findOptions);
            }
        });

        commands.findPrevious.on(()=>{
            let component = this.getSelectedComponent();
            if (component) {
                let findOptions = state.getState().findOptions;
                component.findPrevious(findOptions);
            }
        });

        commands.replaceNext.on((e)=>{
            let component = this.getSelectedComponent();
            if (component) {
                component.replaceNext(e.newText);
            }
        });

        commands.replaceAll.on((e)=>{
            let component = this.getSelectedComponent();
            if (component) {
                component.replaceAll(e.newText);
            }
        });

        this.disposible.add(state.subscribeSub(state=>state.findOptions,(findQuery)=>{
            this.sendOrClearSearchOnCurrentComponent();
        }));

        server.getActiveProjectConfigDetails({}).then(res=>{
            state.setActiveProject(res);
        });

        cast.activeProjectConfigDetailsUpdated.on(res => {
            state.setActiveProject(res);
            this.afterComponentDidUpdate(this.focusAndUpdateStuffWeKnowAboutCurrentTab);
        });

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

        /** Restore any open tabs from last session */
        server.getOpenUITabs({}).then((res) => {
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
            openTabs: this.props.tabs.map(t=>({
                url: t.url
            }))
        });
    }

    render() {
        let selectedIndex = this.props.selectedTabIndex;

        let titles = this.props.tabs.map((t, i) =>{
            let title = utils.getFileName(t.url);

            var style = [tabHeader, i == selectedIndex ? tabHeaderActive : {}];

            let handleTitleClose = (event:React.SyntheticEvent) => {
                this.closeTab(i);
                event.stopPropagation();
            };
            let titleCloseStyle = {width:'1rem', textAlign:'center', marginLeft: '.2rem', ":hover": {color: styles.errorColor}};

            let titleIcon: JSX.Element;
            if (!t.saved){
                style.push(tabHeaderUnsaved);
                titleIcon = <Icon style={titleCloseStyle} name="life-ring" onClick={handleTitleClose}/>
            }
            else {
                titleIcon = <Icon style={titleCloseStyle} name="times" onClick={handleTitleClose}/>;
            }

            return <span
                key={`tabHeader ${i}`}
                style={style}
                onClick={(event)=>this.onTabClicked(event.nativeEvent as MouseEvent,i)}>
                <span key={`tabHeaderTitle ${i}`}>{title}</span> {titleIcon}
            </span>
        });

        let rederedTabs = this.props.tabs.map((t,i)=>{
            let isSelected = selectedIndex == i;
            let style = ( isSelected ? {} : { display: 'none' });

            let Component = getComponentByUrl(t.url);

            return <div className="app-tabs-container-component-div" key={t.id} style={[csx.flex,csx.flexRoot,style]}>
                <Component ref={t.id} url={t.url} onSavedChanged={(saved)=>{this.onSavedChanged(saved,i)}}/>
            </div>
        });

        return (
            <div style={[csx.vertical,csx.flex]} className="app-tabs">
                <div style={[csx.horizontal, tabHeaderContainer]} className="app-tabs-header">
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
    sendOrClearSearchOnCurrentComponent(){
        let component = this.getSelectedComponent();
        if (!component) return;

        let options = state.getState().findOptions;
        if (!options.isShown || !options.query) {
            component.hideSearch()
        }
        else {
            component.search(options)
        }
    }

    private selectTab(selected: number) {
        // cant select what aint there
        if (this.props.tabs.length == 0) {
            return;
        }

        this.afterComponentDidUpdate(this.focusAndUpdateStuffWeKnowAboutCurrentTab);
        state.selectTab(selected);
    }

    focusAndUpdateStuffWeKnowAboutCurrentTab = () => {
        let component = this.getSelectedComponent();
        if (component) {
            component.focus();
            this.sendOrClearSearchOnCurrentComponent();
            let url = this.props.tabs[this.props.selectedTabIndex].url;
            let filePath = utils.getFilePathFromUrl(url);
            if (filePath){
                state.setCurrentFilePath(filePath);
                server.isFilePathInActiveProject({filePath}).then(res=>{
                    res.inActiveProject ? state.setInActiveProject(types.TriState.True) : state.setInActiveProject(types.TriState.False);
                });
            }
        }
        else {
            state.setCurrentFilePath('');
            state.setInActiveProject(types.TriState.Unknown);
        }
    }

    getSelectedComponent(): tab.Component {
        let selected = this.props.selectedTabIndex;
        let tab = this.props.tabs[selected];
        return tab && tab.id ? this.refs[tab.id] : undefined;
    }

    closeTab(index: number) {
        // Always clear the status bar
        state.setCurrentFilePath('');
        state.setInActiveProject(types.TriState.Unknown);

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

/** TODO: implement other protocol tabs */
export function getComponentByUrl(url:string) {
    return Code;
}
