/**
 * Anything to do with tabs should use this file
 */

import * as React from "react";
import {TypedEvent} from "../../../common/events";

export interface ComponentProps {
    // what you get
    url: string;

    // what you can tell us about
    onSavedChanged: (saved: boolean) => void;

    // Useful
    saved: boolean;

    /**
     * API used to trigger effects in the component
     * Since components are created by layout we don't have their refs
     * so instead we trigger events in the API that the component listens to
     *
     * Also since its props the component can ignore a few of these if it wants
     */
    api: {
        focus: TypedEvent<{}>,
        save: TypedEvent<{}>,
        close: TypedEvent<{}>,
        gotoPosition: TypedEvent<EditorPosition>;

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
}


/** If no filepath is provided `cwd` is used */
export function getUrl(protocol: string, filePath?: string) {
    return protocol + (filePath ? filePath : process.cwd);
}
