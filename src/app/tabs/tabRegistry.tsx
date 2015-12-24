/**
 * Does the mapping between urls to different tabs
 */
import * as utils from "../../common/utils";
import * as tab from "./tab";
import * as ui from "../ui";

/** Various tabs  */
import {Code} from "./codeTab";
import {DependencyView} from "./dependencyView";
import {ASTView} from "./astView";

let protocolToTab = {
    'file': Code,
    'dependency': DependencyView,
    'ast': ASTView,
    'astfull': ASTView,
}


export function getComponentByUrl(url: string): { new (props: any): tab.Component } {
    let {protocol} = utils.getFilePathAndProtocolFromUrl(url);
    let tab = protocolToTab[protocol];
    if (tab) return tab;

    let error = 'Unknown protocol: ' + protocol;
    ui.notifyWarningNormalDisappear(error);
    throw new Error(error);
}
