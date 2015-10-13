import * as ui from "../ui";
import * as React from "react";
import * as tab from "./tab";
// import {DashboardTab} from "./dashboardTab";
import {Code} from "./codeTab";
import * as commands from "../commands/commands";
import csx = require('csx');
import {createId} from "../../common/utils";

import {tabHeaderContainer,tabHeader,tabHeaderActive,tabHeaderUnsaved} from "../styles/styles";

import {server} from "../../socket/socketClient";
import {rangeLimited} from "../../common/utils";
import {statusBar} from "../statusBar";

import {setActiveProject,StoreState} from "../../state/state";
import {connect} from "react-redux";

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
            commands.openFile.emit({ filePath: abs.filePath });
        });
        server.makeAbsolute({ relativeFilePath: 'src/app/root.tsx'}).then(abs => {
            commands.openFile.emit({ filePath: abs.filePath });
        });
        server.makeAbsolute({ relativeFilePath: 'src/app/root.js'}).then(abs => {
            commands.openFile.emit({ filePath: abs.filePath });
        });
        server.makeAbsolute({ relativeFilePath: 'src/bas.ts'}).then(abs => {
            commands.openFile.emit({ filePath: abs.filePath });
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

        commands.openFile.on((e) =>{
            let codeTab: tab.TabInstance = {
                id: createId(),
                url: `file://${e.filePath}`,
                title: `${getFileName(e.filePath)}`,
                saved: true
            }

            this.state.tabs.push(codeTab);
            this.setState({ tabs: this.state.tabs });
            this.selectTab(this.state.tabs.length - 1);
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
                    {rederedTabs}
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
                setActiveProject(component.props.url);
            }
            else {
                setActiveProject('');
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
        setActiveProject('');

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
