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

import {setCurrentFilePath, setInActiveProject, StoreState} from "../state/state";
import * as state from "../state/state";
import * as types from "../../common/types";
import {connect} from "react-redux";
import * as styles from "../styles/styles";
import {Tips} from "./tips";

export interface Props extends React.Props<any> {
    errorsExpanded?: boolean
}

export interface State {
    selected?: number;
    tabs?: tab.TabInstance[];
}

@connect((state: StoreState): Props => {
    return { errorsExpanded: state.errorsExpanded };
})
@ui.Radium
export class AppTabsContainer extends ui.BaseComponent<Props, State>{

    constructor(props: Props) {
        super(props);

        this.state = {
            selected: 0,
            tabs: []
        };

        this.setupDemoTab();
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
        server.makeAbsolute({ relativeFilePath: 'tests/success/simple/bas.ts'}).then(abs => {
            commands.doOpenFile.emit({ filePath: abs.filePath });
        });
    }

    componentDidMount() {
        commands.nextTab.on(() => {
            let selected = rangeLimited({ min: 0, max: this.state.tabs.length - 1, num: ++this.state.selected, loopAround: true });
            this.selectTab(selected);
        });
        commands.prevTab.on(() => {
            let selected = rangeLimited({ min: 0, max: this.state.tabs.length - 1, num: --this.state.selected, loopAround: true });
            this.selectTab(selected);
        });

        commands.doOpenFile.on((e) =>{
            let codeTab: tab.TabInstance = {
                id: createId(),
                url: `file://${e.filePath}`,
                title: `${getFileName(e.filePath)}`,
                saved: true
            }

            this.state.tabs.push(codeTab);
            this.setState({ tabs: this.state.tabs });
            this.selectTab(this.state.tabs.length - 1);

            if (e.position) {
                setTimeout(() => this.gotoPositionOnSelectedTab(e.position), 500);
            }
        });

        commands.doOpenOrFocusFile.on((e)=>{
            // if open and focused ignore
            // if open and not focused then focus
            // If not hand over to doOpenFile
            if (utils.getFilePathFromUrl(this.state.tabs[this.state.selected].url) == e.filePath){
                if (e.position) {
                    this.gotoPositionOnSelectedTab(e.position)
                }
                return;
            }

            let openTabIndex = this.state.tabs.map(t=> utils.getFilePathFromUrl(t.url) == e.filePath).indexOf(true);
            if (openTabIndex !== -1) {
                this.selectTab(openTabIndex);
                if (e.position) {
                    setTimeout(() => this.gotoPositionOnSelectedTab(e.position));
                }
                return;
            }

            commands.doOpenFile.emit(e);
        });

        commands.onCloseTab.on((e)=>{
            // Remove the selected
            this.closeTab(this.state.selected);
        });

        commands.onSaveTab.on((e) => {
            let component = this.getSelectedComponent();
            if (component) {
                component.save();
            }
        });
    }

    render() {

        let selectedIndex = this.state.selected;

        let titles = this.state.tabs.map((t, i) =>{
            let title = t.title;
            var style = [tabHeader.base, i == selectedIndex ? tabHeaderActive : {}];
            if (!t.saved){
                style.push(tabHeaderUnsaved);
            }
            return <span
                key={`tabHeader ${i}`}
                style={style}
                onClick={(event)=>this.onTabClicked(event.nativeEvent as MouseEvent,i)}>
                {title}
            </span>
        });

        let rederedTabs = this.state.tabs.map((t,i)=>{
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
        let state = this.state;
        state.tabs[index].saved = saved;
        this.setState({ tabs: state.tabs });
    }

    gotoPositionOnSelectedTab(position: EditorPosition) {
        let component = this.getSelectedComponent();
        if (component) {
            component.gotoPosition(position);
        }
    }

    private selectTab(selected: number) {
        /** Set timeout to allow the next tab to render */
        setTimeout(() => {
            // cant select what aint there
            if (this.state.tabs.length == 0) {
                return;
            }

            this.setState({ selected: selected });
            this.state.selected = selected;
            let component = this.getSelectedComponent();
            if (component) {
                component.focus();
                let url = this.state.tabs[selected].url;
                let filePath = utils.getFilePathFromUrl(url);
                if (filePath){
                    state.setCurrentFilePath(filePath);
                    server.isFilePathInActiveProject({filePath}).then(res=>{
                        res.inActiveProject ? state.setInActiveProject(types.TriState.True) : state.setInActiveProject(types.TriState.False);
                    });
                }
            }
            else {
                setCurrentFilePath('');
                state.setInActiveProject(types.TriState.Unknown);
            }
        });
    }

    getSelectedComponent(): tab.Component {
        let selected = this.state.selected;
        let component = this.refs[this.state.tabs[selected].id];
        return component;
    }

    closeTab(index: number) {
        // Always clear the status bar
        setCurrentFilePath('');
        state.setInActiveProject(types.TriState.Unknown);

        // If no tabs
        if (!this.state.tabs.length) {
            return;
        }

        // inform the component
        let component = this.refs[this.state.tabs[index].id];
        component.close();

        this.state.tabs.splice(index, 1);
        this.setState({ tabs: this.state.tabs });

        // If this is the selected tab, Figure out the next:
        if (index == this.state.selected) {
            // Nothing to do
            if (!this.state.tabs.length) {
                return;
            }
            // Previous
            let next = rangeLimited({ num: --index, min: 0, max: this.state.tabs.length });
            this.selectTab(next);
        }
        // If this is a tab before the selected, decrement selected
        else if (index < this.state.selected){
            this.state.selected--;
            this.setState({ selected: this.state.selected });
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
