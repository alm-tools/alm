import * as ui from "../ui";
import * as React from "react";
import * as tab from "./tab";
import {DashboardTab} from "./dashboardTab";
import {CodeTab} from "./codeTab";
import * as commands from "../commands/commands";
import csx = require('csx');

import {tabHeaderContainer,tabHeader,tabHeaderActive} from "../styles/styles";

import {AppTabs} from "./appTabs";
import {server} from "../../socket/socketClient";
import {rangeLimited} from "../../common/utils";

export interface Props {

}

export interface State {
    selected?: number;
    tabs?: tab.TabInstance[];
}

@ui.Radium
export class AppTabsContainer extends ui.BaseComponent<Props, State>{

    constructor(props: Props) {
        super(props);

        let codeSample0: tab.TabInstance = new CodeTab('node_modules/ntypescript/src/compiler/checker.ts');
        let codeSample1: tab.TabInstance = new CodeTab('src/app/root.tsx');
        let codeSample2: tab.TabInstance = new CodeTab('src/app/root.js');
        let codeSample3: tab.TabInstance = new CodeTab('src/bas.ts');
        //let dashboardSample: tab.TabInstance = new DashboardTab('Dashboard');

        this.state = {
            selected: 3,
            tabs: [codeSample0, codeSample1, codeSample2, codeSample3]
        };
    }

    refs: { [string: string]: tab.TabComponent; }

    componentDidMount() {
        commands.nextTab.on(() => {
            let selected = rangeLimited({ min: 0, max: this.state.tabs.length - 1, num: ++this.state.selected, loopAround: true });
            this.selectTab(selected);
        });
        commands.prevTab.on(() => {
            let selected = rangeLimited({ min: 0, max: this.state.tabs.length - 1, num: --this.state.selected, loopAround: true });
            this.selectTab(selected);
        });
        
        commands.onOpenFile.on((e) =>{
            // TODO: Open the file
            console.log('open', e.filePath);
            let codeTab: tab.TabInstance = new CodeTab(e.filePath);
            this.state.tabs.push(codeTab);
            this.setState({ tabs: this.state.tabs });
            this.onTabClicked(this.state.tabs.length - 1);
        });
        
        commands.onCloseTab.on((e)=>{
            // If no tabs
            if (!this.state.tabs.length) {
                return;
            }
            
            // Remove the selected
            let selected = this.state.selected;
            this.state.tabs.splice(selected, 1);
            this.setState({ tabs: this.state.tabs });
            
            // Figure out the next:
            // Nothing to do
            if (!this.state.tabs.length) {
                return;
            }
            // Previous
            let next = rangeLimited({num:--selected,min:0,max:this.state.tabs.length});
            this.selectTab(next);
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
        
        let titles = this.state.tabs.map(t=> t.getTitle()).map((t, i) =>
            <span
                key={`tabHeader ${i}`}
                style={[tabHeader.base, i == selectedIndex ? tabHeaderActive : {}]}
                onClick={()=>this.onTabClicked(i)}>
                {t}
            </span>
        );
        
        let tabs = this.state.tabs.map((t, i) => {
            return t.getElement(i)
        });
        
        let rederedTabs = tabs.map((c,i)=>{
            let isSelected = selectedIndex == i;
            let style = ( isSelected ? {} : { display: 'none' });
            return <div style={[style,csx.flex]}>
                {c}
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
    
    onTabClicked = (index) => {
        this.setState({ selected: index });
        this.selectTab(index);
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
            }
        });
    }
    
    getSelectedComponent(): tab.TabComponent {
        let selected =this.state.selected;
        let ref = tab.getRef(this.state.tabs[selected].url, selected);
        let component = this.refs[ref];
        return component;
    }
}