// for keyboard shortcuts watch out for: 
// https://github.com/ajaxorg/ace/wiki/Default-Keyboard-Shortcuts

import * as Mousetrap from "mousetrap";
require("mousetrap/plugins/global-bind/mousetrap-global-bind");
import * as events from "../../common/events";

export var nextTab = new events.TypedEvent<{}>();
export var prevTab = new events.TypedEvent<{}>();

export var findFile = new events.TypedEvent<{}>();
export var findCommand = new events.TypedEvent<{}>();

export var onOpenFile = new events.TypedEvent<{filePath:string}>();
export var onDidOpenFile = new events.TypedEvent<{filePath:string}>();
export var onCloseFile = new events.TypedEvent<{filePath:string}>();

export function register() {
    
    /** Tabs */
    Mousetrap.bindGlobal('alt+n', function() {
        nextTab.emit({});
        return false;
    });
    Mousetrap.bindGlobal('alt+p', function() {
        prevTab.emit({});
        return false;
    });
    
    /**
     * OmniSearch
     */
    Mousetrap.bindGlobal('mod+p', function() {
        findFile.emit({});
        return false;
    });
    Mousetrap.bindGlobal('mod+shift+p', function() {
        findCommand.emit({});
        return false;
    });
}