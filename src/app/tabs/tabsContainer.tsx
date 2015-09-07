import * as ui from "../ui";
import * as React from "react";
import * as tab from "./tab";
import {DashboardTab} from "./dashboardTab";
import {CodeTab} from "./codeTab";
import * as commands from "../commands/commands";

import {Tabs} from "./framework/tabs";
import {server} from "../../socket/socketClient";

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

        let codeSample0: tab.TabInstance = new CodeTab('node_modules/ntypescript/src/compiler/checker.ts');
        let codeSample1: tab.TabInstance = new CodeTab('src/app/root.tsx');
        let codeSample2: tab.TabInstance = new CodeTab('src/app/root.js');
        //let dashboardSample: tab.TabInstance = new DashboardTab('Dashboard');

        this.state = {
            selected: 0,
            tabs: [codeSample0,codeSample1,codeSample2]
        };
    }

    refs: { [string: string]: any; }

    componentDidMount() {
        commands.nextTab.on(() => {
            let selected = loopAroundNext(this.state.selected, this.state.tabs.length);
            this.setState({ selected });
            let ref = tab.getRef(this.state.tabs[selected].url,selected);
            let component = this.refs[ref];
            if (component && component.focus) {
                component.focus();
            }
        });
        commands.prevTab.on(() => {
            this.setState({ selected: loopAroundPrev(this.state.selected, this.state.tabs.length) });
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
    
    onTabClicked = (index)=>{
        this.setState({ selected: index });
    }
}