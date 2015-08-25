import * as ui from "../ui";
import * as React from "react";
import * as tab from "./tab";
import {DashboardTab} from "./dashboardTab";
import * as commands from "../commands/commands";

import {Tabs} from "./framework/tabs";

function loopAroundNext(currentIndex: number, length: number) {
    if ((++currentIndex) == length) {
        return 0;
    }
    else {
        return currentIndex;
    }
}
function loopAroundPrev(currentIndex: number, length: number) {
    if ((--currentIndex) == -1) {
        return length - 1;
    }
    else {
        return currentIndex;
    }
}

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

        let dashboard1: tab.TabInstance = new DashboardTab('foo');
        let dashboard2: tab.TabInstance = new DashboardTab('bar');;

        this.state = {
            selected: 0,
            tabs: [dashboard1, dashboard2]
        };
    }

    refs: { [string: string]: any; }

    componentDidMount() {
        commands.nextTab.on(() => {
            this.setState({ selected: loopAroundNext(this.state.selected, this.state.tabs.length) });
        });
        commands.prevTab.on(() => {
            this.setState({ selected: loopAroundPrev(this.state.selected, this.state.tabs.length) });
        });
    }

    render() {
        let tabTitles = this.state.tabs.map(t=> t.getTitle());
        let tabs = this.state.tabs.map((T, i) => {
            return T.getElement()
        });
        
        return (
            <Tabs selectedIndex={this.state.selected} titles={tabTitles} onTabClicked={this.onTabClicked}>
                {tabs}
            </Tabs>
        );
    }
    
    onTabClicked = (index)=>{
        this.setState({ selected: index });
    }
}