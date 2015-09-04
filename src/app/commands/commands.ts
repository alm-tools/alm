
import * as Mousetrap from "mousetrap";
import * as events from "../../common/events";

export var nextTab = new events.TypedEvent<{}>();
export var prevTab = new events.TypedEvent<{}>();

export var findFile = new events.TypedEvent<{}>();
export var findCommand = new events.TypedEvent<{}>();

export var openFile = new events.TypedEvent<{filePath:string}>();

export function register() {
    
    /** Tabs */
    Mousetrap.bind('alt+n', function() {
        nextTab.emit({});
        return false;
    });
    Mousetrap.bind('alt+p', function() {
        prevTab.emit({});
        return false;
    });
    
    /**
     * OmniSearch
     */
    Mousetrap.bind('mod+p', function() {
        findFile.emit({});
        return false;
    });
    Mousetrap.bind('mod+shift+p', function() {
        findCommand.emit({});
        return false;
    });
}