/**
 * Anything to do with tabs should use this file
 */

import * as React from "react";
import {TypedEvent} from "../../../common/events";
import {CodeEditor} from "../../monaco/editor/codeEditor";

/**
 * API used to trigger effects in the component
 * Since components are created by layout we don't have their refs
 * so instead we trigger events in the API that the component listens to
 *
 * Also since its props the component can ignore a few of these if it wants
 */
export interface TabApi {
    resize: TypedEvent<{}>,
    focus: TypedEvent<{}>,
    save: TypedEvent<{}>,
    close: TypedEvent<{}>,
    gotoPosition: TypedEvent<EditorPosition>,
    willBlur: TypedEvent<{}>,

    /**
     * FAR : having these here means that *all tabs* get to participate in this
     * so they don't need custom *find* UI
     */
    search: {
        /** Called at the start of a new search or on focusing */
        doSearch: TypedEvent<FindOptions>;
        /** Called to clear the search if the tab is in focus when that happens */
        hideSearch: TypedEvent<{}>;
        findNext: TypedEvent<FindOptions>;
        findPrevious: TypedEvent<FindOptions>;
        replaceNext: TypedEvent<{newText: string}>;
        replacePrevious: TypedEvent<{newText: string}>;
        replaceAll: TypedEvent<{newText: string}>;
    }
}

/**
 * Note: Because of golden-layout we cannot use *mutating* props.
 * Basically finding a way to send new props will be fairly hacky
 * So instead props *never change after the tab is created*.
 */
export interface TabProps {
    /** what we give to tabs */
    url: string;
    /** any additional info the tab needs to do its jobs */
    additionalData: any;

    /**
     * What the tab gets to tell the container
     */
    onSavedChanged: (saved: boolean) => void;
    /** Useful for stuff like code editor navigation recording etc */
    setCodeEditor: (codeEditor: CodeEditor) => void;
    /**
     * User can change *active* tab by clicking into a tab body
     * Allow the tab to tell us about that.
     * No need for blur as we automatically assume all others are blurred.
     */
    onFocused: () => void;

    /** Tab API. Effectively allows the container to call functions on a Tab */
    api: TabApi;
}


/** If no filepath is provided `cwd` is used */
export function getUrl(protocol: string, filePath?: string) {
    return protocol + (filePath ? filePath : process.cwd);
}
