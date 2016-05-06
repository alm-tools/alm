/**
 * Does the mapping between urls to different tabs
 * Anything about tabs that needs to change based on tab protocol should go here
 */
import * as utils from "../../../common/utils";
import * as tab from "./tab";
import * as ui from "../../ui";

/** Various tabs  */
import {Code} from "./codeTab";
import {ASTView} from "./astView";

type ComponentConstructor = { new (props: tab.TabProps): ui.BaseComponent<tab.TabProps,any> };

interface TabConfig {
    advancedSearch: boolean;
    getTitle(url:string): string;
    component: ComponentConstructor;
}

let tabs: {[protocol:string]:TabConfig} = {
    file: {
        advancedSearch: true,
        getTitle: utils.getFileName,
        component: Code,
    },
    ast: {
        advancedSearch: false,
        getTitle: (url)=> `AST ${utils.getFileName(url)}`,
        component: ASTView,
    },
    astfull: {
        advancedSearch: false,
        getTitle: (url)=> `AST Full ${utils.getFileName(url)}`,
        component: ASTView,
    },
}

export function getTabConfigs() {
    return Object.keys(tabs).map((protocol) => ({ protocol, config: tabs[protocol] }));
}

export function getComponentByUrl(url: string): ComponentConstructor {
    let {protocol} = utils.getFilePathAndProtocolFromUrl(url);
    let tab = tabs[protocol];
    if (tab) return tab.component;

    let error = 'Unknown protocol: ' + protocol;
    throw new Error(error);
}

export function getTabConfigByUrl(url: string): TabConfig {
    let {protocol} = utils.getFilePathAndProtocolFromUrl(url);
    let tab = tabs[protocol];
    if (tab) return tab;

    let error = 'Unknown protocol: ' + protocol;
    throw new Error(error);
}
