// for keyboard shortcuts watch out for:
// https://github.com/ajaxorg/ace/wiki/Default-Keyboard-Shortcuts
//
// c9: means keyboard shortcut is consistent with cloud9 ide so don't change these

import * as Mousetrap from "mousetrap";
require("mousetrap/plugins/global-bind/mousetrap-global-bind");
import * as events from "../../common/events";

export var nextTab = new events.TypedEvent<{}>();
export var prevTab = new events.TypedEvent<{}>();

export var findFile = new events.TypedEvent<{}>();
export var findCommand = new events.TypedEvent<{}>();
export var doSelectProject = new events.TypedEvent<{}>();
export var didSelectProject = new events.TypedEvent<{projectName:string}>();

export var doOpenFile = new events.TypedEvent<{filePath:string}>();
export var didOpenFile = new events.TypedEvent<{filePath:string}>();

export var onCloseTab = new events.TypedEvent<{}>();
export var onSaveTab = new events.TypedEvent<{}>();

export function register() {

    /** Tabs */
    Mousetrap.bindGlobal('alt+k', function() {
        nextTab.emit({});
        return false;
    });
    Mousetrap.bindGlobal('alt+j', function() {
        prevTab.emit({});
        return false;
    });
    Mousetrap.bindGlobal('alt+w', function() { // c9
        onCloseTab.emit({});
        return false;
    });
    Mousetrap.bindGlobal('mod+s', function() { // c9
        onSaveTab.emit({});
        return false;
    });

    /**
     * OmniSearch
     */
    Mousetrap.bindGlobal('mod+p', function() { // atom,sublime
        findFile.emit({});
        return false;
    });
    Mousetrap.bindGlobal('mod+shift+p', function() { // atom,sublime
        findCommand.emit({});
        return false;
    });
    Mousetrap.bindGlobal('alt+shift+p', function() { // atom:ProjectManager
        doSelectProject.emit({});
        return false;
    });
}
