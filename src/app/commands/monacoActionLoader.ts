import * as types from "../../common/types";
import * as utils from "../../common/utils";

/** Addons. These must be loaded before the function below is ever called so loaded here 🌹 */
import * as gitStatus from "../monaco/addons/gitStatus";
import * as jumpy from "../monaco/addons/jumpy";
import * as gitReset from "../monaco/addons/gitReset";
import * as htmlToTsx from "../monaco/addons/htmlToTsx";
import * as cssToTs from "../monaco/addons/cssToTs";
import * as jsonToDts from "../monaco/addons/jsonToDts";
import * as gotoTypeScriptSymbol from "../monaco/addons/gotoTypeScriptSymbol";
import * as findReferences from "../monaco/codeResults/findReferences";
import * as gotoDefinition from "../monaco/codeResults/gotoDefinition";
import * as renameVariable from "../monaco/codeResults/renameVariable";
import * as blaster from "../monaco/addons/blaster";
import * as quickFix from "../monaco/addons/quickFix";
import * as repl from "../monaco/addons/repl";
import * as removeUnusedImports from "../monaco/addons/removeUnusedImports";
const ensureImport =
    gitStatus
    || jumpy
    || gitReset
    || htmlToTsx
    || cssToTs
    || jsonToDts
    || gotoTypeScriptSymbol
    || findReferences
    || gotoDefinition
    || renameVariable
    || blaster
    || quickFix
    || repl
    || removeUnusedImports
    ;

/**
 * These are actions for which we have our own commands
 */
const blackListedActions = utils.createMap([
    // we have our own find experience
    'actions.find',
    'editor.action.nextMatchFindAction',
    'editor.action.previousMatchFindAction',
    // we have our own goto definition/references/rename experiences
    'editor.action.goToDeclaration',
    'editor.action.referenceSearch.trigger',
    'editor.action.rename',
    // we have our own quickfix implementation
    'editor.action.quickFix',
    // we have our own goto symbol for TypeScript
    // Sadly disabiling this means we lose it for `css` files too.
    // But its okay as far as I am concerned.
    'editor.action.quickOutline'
]);

/**
 * This creates a dummy monaco editor just to get its actions
 */
export function getActions(): types.MonacoActionInformation[] {
    const elt = document.createElement('div');
    const editor = monaco.editor.create(elt,{},[]);

    // WARNING: This isn't documented or well exposed
    // but this is what `quickCommand.ts` (the built in command pallet) uses
    // It uses its on (injected) version but fortunately its on the editor as well
    const keybindingService = (editor as any)._standaloneKeybindingService;
    // console.log(editor, keybindingService); // DEBUG

    const actions = editor.getActions().filter(a => !blackListedActions[a.id]);

    let result = actions.map(a=>{
        // can have multiple (but in my experience they only had singles or 0)
        let keyboards = keybindingService.lookupKeybindings(a.id).map(k => keybindingService.getLabelFor(k));
        let keyboard = keyboards[0];

        // if there was any keyboard
        // map to it look nice for us
        // We don't actually need to use these bindings other than the display it (as trigger is done by `id`).
        let kbd = null;
        if (keyboard) {
            kbd = keyboard
                .replace('UpArrow','Up')
                .replace('DownArrow','Down')
                .replace('LeftArrow','Left')
                .replace('RightArrow','Right')
                ;
        }

        return {
            label: a.label,
            id: a.id,
            kbd: kbd
        }
    });

    editor.dispose();
    elt.remove();
    return result;
}
