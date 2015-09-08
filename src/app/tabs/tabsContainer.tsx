import * as ui from "../ui";
import * as React from "react";
import * as tab from "./tab";
import {DashboardTab} from "./dashboardTab";
import {CodeTab} from "./codeTab";
import * as commands from "../commands/commands";

import {Tabs} from "./framework/tabs";
import {server} from "../../socket/socketClient";
import {rangeLimited} from "../../common/utils";

export interface Props {

}

export interface State {
    selected?: number;
    tabs?: tab.TabInstance[];
}

@ui.Radium
export class TabsContainer extends ui.BaseComponent<Props, State>{

    constructor(props: Props) {
        super(props);

        let codeSample0: tab.TabInstance = new CodeTab('node_modules/ntypescript/src/compiler/checker.ts');
        let codeSample1: tab.TabInstance = new CodeTab('src/app/root.tsx');
        let codeSample2: tab.TabInstance = new CodeTab('src/app/root.js');
        //let dashboardSample: tab.TabInstance = new DashboardTab('Dashboard');

        this.state = {
            selected: 0,
            tabs: [codeSample0,codeSample1,codeSample2]
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
            server.getFileContents({ filePath: e.filePath }).then((res) => {
                console.log('got contents!', res.contents);
                
                commands.onDidOpenFile.emit({ filePath: e.filePath });
            });
        });
    }

    render() {
        let tabTitles = this.state.tabs.map(t=> t.getTitle());
        let tabs = this.state.tabs.map((t, i) => {
            return t.getElement(i)
        });
        
        return (
            <Tabs selectedIndex={this.state.selected} titles={tabTitles} onTabClicked={this.onTabClicked}>
                {tabs}
            </Tabs>
        );
    }
    
    onTabClicked = (index) => {
        this.setState({ selected: index });
        this.selectTab(index);
    }
    
    private selectTab(selected: number) {
        /** Set timeout to allow the next tab to render */
        setTimeout(() => {
            this.setState({ selected: selected });
            let ref = tab.getRef(this.state.tabs[selected].url, selected);
            let component = this.refs[ref];
            if (component) {
                component.focus();
            }
        });
    }
}