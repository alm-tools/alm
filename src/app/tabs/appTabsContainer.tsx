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
}

export interface State {
    selected?: number;
}

@connect((state: state.StoreState): Props => {
    return {
        tabs: state.tabs
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

        // this.setupDemoTab();
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

    /** For Demo only */
    setupDemoTab(){
        server.makeAbsolute({ relativeFilePath: 'node_modules/ntypescript/src/compiler/checker.ts' }).then(abs => {
            commands.doOpenFile.emit({ filePath: abs.filePath });
        });
        server.makeAbsolute({ relativeFilePath: 'src/app/root.tsx'}).then(abs => {
            commands.doOpenFile.emit({ filePath: abs.filePath });
        });
        server.makeAbsolute({ relativeFilePath: 'src/app/root.js'}).then(abs => {
            commands.doOpenFile.emit({ filePath: abs.filePath });
        });
        server.makeAbsolute({ relativeFilePath: 'tests/success/simple/foo.ts'}).then(abs => {
            commands.doOpenFile.emit({ filePath: abs.filePath });
        });
        server.makeAbsolute({ relativeFilePath: 'tests/success/simple/bas.tsx'}).then(abs => {
            commands.doOpenFile.emit({ filePath: abs.filePath });
        });
    }

    componentDidMount() {
        commands.nextTab.on(() => {
            let selected = rangeLimited({ min: 0, max: this.props.tabs.length - 1, num: ++this.state.selected, loopAround: true });
            this.selectTab(selected);
        });
        commands.prevTab.on(() => {
            let selected = rangeLimited({ min: 0, max: this.props.tabs.length - 1, num: --this.state.selected, loopAround: true });
            this.selectTab(selected);
        });

        commands.doOpenFile.on((e) =>{
            let codeTab: state.TabInstance = {
                id: createId(),
                url: `file://${e.filePath}`,
                saved: true
            }

            state.addTab(codeTab);
            this.sendTabInfoToServer();

            this.selectTab(this.props.tabs.length - 1);

            if (e.position) {
                setTimeout(() => this.gotoPositionOnSelectedTab(e.position), 500);
            }
        });

        commands.doOpenOrFocusFile.on((e)=>{
            // if open and focused ignore
            // if open and not focused then focus
            // If not hand over to doOpenFile
            if (this.props.tabs.length
                && utils.getFilePathFromUrl(this.props.tabs[this.state.selected].url) == e.filePath){
                if (e.position) {
                    this.gotoPositionOnSelectedTab(e.position)
                }
                return;
            }

            let openTabIndex = this.props.tabs.map(t=> utils.getFilePathFromUrl(t.url) == e.filePath).indexOf(true);
            if (openTabIndex !== -1) {
                this.selectTab(openTabIndex);
                if (e.position) {
                    setTimeout(() => this.gotoPositionOnSelectedTab(e.position));
                }
                return;
            }

            commands.doOpenFile.emit(e);
        });

        commands.closeTab.on((e)=>{
            // Remove the selected
            this.closeTab(this.state.selected);
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
            this.updateActiveFileInformation();
        });

        commands.openFileFromDisk.on(() => {
            ui.comingSoon("Open a file from the server disk");
        });

        commands.undoCloseTab.on(() => {
            if (this.closedTabs.length) {
                let tab = this.closedTabs.pop();
                state.addTab(tab);
                this.selectTab(this.props.tabs.length - 1);
                this.sendTabInfoToServer();
            }
        });

        /** Restore any open tabs from last session */
        server.getOpenUITabs({}).then((res) => {
            let openTabs = res.openTabs;
            let tabInstances: state.TabInstance[] = openTabs.map(t=> {
                return {
                    id: createId(),
                    url: t.url,
                    saved: true
                };
            });

            state.addTabs(tabInstances);
            this.selectTab(this.props.tabs.length - 1);
        });
    }

    render() {

        let selectedIndex = this.state.selected;

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
            this.setState({ selected: index });
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
        /** Set timeout to allow the next tab to render */
        setTimeout(() => {
            // cant select what aint there
            if (this.props.tabs.length == 0) {
                return;
            }

            this.setState({ selected: selected });
            this.updateActiveFileInformation();
        });
    }

    updateActiveFileInformation() {
        let component = this.getSelectedComponent();
        if (component) {
            component.focus();
            this.sendOrClearSearchOnCurrentComponent();
            let url = this.props.tabs[this.state.selected].url;
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
        let selected = this.state.selected;
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

        state.removeTab(index);
        this.sendTabInfoToServer();

        // If this is the selected tab, Figure out the next:
        if (index == this.state.selected) {
            // Nothing to do
            if (!this.props.tabs.length) {
                return;
            }
            // Previous
            let next = rangeLimited({ num: --index, min: 0, max: this.props.tabs.length });
            this.selectTab(next);
        }
        // If this is a tab before the selected, decrement selected
        else if (index < this.state.selected){
            this.state.selected--;
            this.setState({ selected: this.state.selected });
        }
    }

    private sendTabInfoToServer(){
        server.setOpenUITabs({
            openTabs: this.props.tabs.map(t=>({
                url: t.url
            }))
        });
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
