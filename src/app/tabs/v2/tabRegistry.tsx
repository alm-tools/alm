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
import {DependencyView} from "./dependencyView";
import {FindAndReplaceView} from "./findAndReplaceMulti";
import {DocumentationView} from "./documentationView";
import {UmlView} from "./umlView";
import {TsFlowView} from "./tsFlowView";
import {TestedView} from "./testedView";

type ComponentConstructor = { new (props: tab.TabProps): ui.BaseComponent<tab.TabProps,any> };

/**
 * Tabs get to choose how much they want to integrate with search
 */
export enum TabSearchSupport {
    None, // No search ui
    Basic, // Just the `find` search ui
    Advanced, // Find / Replace / Regex whole shebang
}

interface TabConfig {
    protocol: string;
    searchSupport: TabSearchSupport;
    getTitle(url:string): string;
    component: ComponentConstructor;
}

export const tabs = {
    file: {
        protocol: 'file',
        searchSupport: TabSearchSupport.Advanced,
        getTitle: utils.getFileName,
        component: Code,
    },
    ast: {
        protocol: 'ast',
        searchSupport: TabSearchSupport.None,
        getTitle: (url)=> `AST ${utils.getFileName(url)}`,
        component: ASTView,
    },
    astfull: {
        protocol: 'astfull',
        searchSupport: TabSearchSupport.None,
        getTitle: (url)=> `AST Full ${utils.getFileName(url)}`,
        component: ASTView,
    },
    dependency: {
        protocol: 'dependency',
        searchSupport: TabSearchSupport.Basic,
        getTitle: ()=> 'Dependency View',
        component: DependencyView,
    },
    farm: { // find and replace multi
        protocol: 'farm',
        searchSupport: TabSearchSupport.None,
        getTitle: (url)=> `Find In Project`,
        component: FindAndReplaceView,
    },
    documentation: {
        protocol: 'documentation',
        searchSupport: TabSearchSupport.Basic,
        getTitle: (url)=> `Documentation`,
        component: DocumentationView,
    },
    uml: {
        protocol: 'uml',
        searchSupport: TabSearchSupport.None,
        getTitle: (url) => `UML ${utils.getFileName(url)}`,
        component: UmlView,
    },
    tsflow: {
        protocol: 'tsflow',
        searchSupport: TabSearchSupport.None,
        getTitle: (url) => `TSFlow ${utils.getFileName(url)}`,
        component: TsFlowView,
    },
    tested: {
        protocol: 'tested',
        searchSupport: TabSearchSupport.None,
        getTitle: (url) => `Tests`,
        component: TestedView,
    },
}
let _ensuretabsType: {[protocol:string]:TabConfig} = tabs;

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
