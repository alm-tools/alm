/**
 * Anything to do with tabs should use this file
 */

import * as ui from "../ui";

export interface ComponentProps {
    url: string;
}

export interface TabComponentClass {
    new <P extends ComponentProps>(p: P): ui.React.Component<P, any>;
}

export interface Tab {
    Component: TabComponentClass;
    getTitle(): string;
}

/** If no filepath is provided `cwd` is used */
export function getUrl(protocol: string, filePath?: string) {
    return protocol + (filePath ? filePath : process.cwd);
}