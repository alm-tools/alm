/**
 * Anything to do with tabs should use this file
 */

import * as React from "react";
export interface TabState {

}

export interface ComponentProps extends React.Props<any> {
    // what you get
    url: string;

    // what you can tell us about
    onSavedChanged: (saved: boolean) => void;
}

export interface Component extends React.Component<any, any> {
    focus();
    save();
    close();
    gotoPosition(position: EditorPosition);

    /**
     * FAR : having these here means that *all tabs* get to participate in this
     * so they don't need custom *find* UI
     */
    /** Called at the start of a new search or on focusing */
    search(options: FindOptions);
    /** Called to clear the search if the tab is in focus when that happens */
    hideSearch();
    findNext(options: FindOptions);
    findPrevious(options: FindOptions);
    replaceNext(newText: string);
    replaceAll(newText: string);
}

export interface TabInstance {
    id: string;
    url: string;
    saved: boolean,
}

/** If no filepath is provided `cwd` is used */
export function getUrl(protocol: string, filePath?: string) {
    return protocol + (filePath ? filePath : process.cwd);
}
