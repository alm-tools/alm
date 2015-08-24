import * as ui from "../ui";
import * as React from "react";
import {csx, Tabs} from "../ui";
import * as tab from "./tab";
import {DashboardTab} from "./dashboardTab";
import * as commands from "../commands/commands";

export interface Props {

}

export interface State {
    selected?: string;
    tabs?: tab.TabInstance[];
}

@ui.Radium
export class TabsContainer extends ui.BaseComponent<Props, State>{

    constructor(props: Props) {
        super(props);

        let dashboard1: tab.TabInstance = new DashboardTab('foo');
        let dashboard2: tab.TabInstance = new DashboardTab('bar');;

        this.state = {
            selected: dashboard2.url,
            tabs: [dashboard1, dashboard2]
        };
    }

    refs: { [string: string]: any; }

    componentDidMount() {
        commands.nextTab.on(() => {
            console.log('next tab');
        });
        commands.prevTab.on(() => {
            console.log('previous tab');
        });
    }

    render() {
        let tabs = this.state.tabs.map((T, index) => <ui.Tab key={index} label={T.getTitle()}>
            <T.Component/>
        </ui.Tab>);

        return <Tabs>
                {tabs}
            </Tabs>;
    }

}