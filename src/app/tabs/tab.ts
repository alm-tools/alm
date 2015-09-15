/**
 * Anything to do with tabs should use this file
 */

import * as ui from "../ui";

export interface TabState {

}

export interface ComponentProps extends ui.React.Props<any> {
    // what you get
    url: string;
    
    // what you can tell us about
    onSaveChanged: (saved: boolean) => void;
}

export interface Component extends ui.React.Component<any, any> {
    focus();
    save();
}

export interface TabInstance {
    ref?: Component,

    url: string;
    title: string,
    saved: boolean,
}

/** If no filepath is provided `cwd` is used */
export function getUrl(protocol: string, filePath?: string) {
    return protocol + (filePath ? filePath : process.cwd);
}

export function getRef(args: { url: string, index: number }) {
    return `${args.url}:${args.index}`;
}