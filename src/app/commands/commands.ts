
import * as Mousetrap from "mousetrap";
import * as events from "./events";

export var nextTab = new events.TypedEvent<{}>();
export var prevTab = new events.TypedEvent<{}>();

export function register() {
    Mousetrap.bind('alt+n', function() {
        nextTab.emit({});
        return false;
    });
    Mousetrap.bind('alt+p', function() {
        prevTab.emit({});
        return false;
    });
}