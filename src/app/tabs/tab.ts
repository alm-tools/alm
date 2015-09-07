/**
 * Anything to do with tabs should use this file
 */

import * as ui from "../ui";

export interface ComponentProps {
    key: string;
    ref: string;
    url: string;
}

export interface TabComponentClass {
    new <P extends ComponentProps>(p: P): ui.React.Component<P, any>;
}

/** Once we have a tab instance it should be considered immutable */
export interface TabInstance {
    getElement(index:number): JSX.Element;
    getTitle(): string;
    url: string;
}

/** If no filepath is provided `cwd` is used */
export function getUrl(protocol: string, filePath?: string) {
    return protocol + (filePath ? filePath : process.cwd);
}

export function getRef(url: string, index: number){
    return `${url}:${index}`;
}