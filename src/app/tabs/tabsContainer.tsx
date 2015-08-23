import * as ui from "../ui";
import * as React from "react";
import {csx, Tabs} from "../ui";
import * as tab from "./tab";
import {DashboardTab} from "./dashboardTab";

export interface Props {

}

export interface State {
    tabs: tab.Tab[];
}

@ui.Radium
export class TabsContainer extends ui.BaseComponent<Props, State>{

    constructor(props: Props) {
        super(props);

        let dashboard: tab.Tab = DashboardTab;

        this.state = {
            tabs: [dashboard, dashboard]
        };
    }

    refs: { [string: string]: any; }


    render() {

        let tabs = this.state.tabs.map((T, index) => <ui.Tab key={index} label={T.getTitle() }>
            <T.Component/>
            </ui.Tab>);

        return <Tabs initialSelectedIndex={0}>
                {tabs}
            </Tabs>;
    }

}