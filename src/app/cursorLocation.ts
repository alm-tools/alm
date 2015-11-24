/**
 * Singleton that maintains the cursor history
 */
import * as commands from "./commands/commands";
import * as utils from "../common/utils";

/** The current cursor location */
let currentIndex = 0;

/** Subscribe to user requests to move around */
commands.previousCursorLocation.on(()=>{
    previous();
});
commands.nextCursorLocation.on(()=>{
    next();
})

export function previous() {
    console.log('goto previous');
}

export function next() {
    console.log('goto next');
}
