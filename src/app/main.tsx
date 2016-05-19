/**
 * The main entry point for the front end
 */
import {Root} from "./root";
import * as commands from "./commands/commands";
import * as React from "react";
var ReactDOM = require("react-dom");
import { Provider } from 'react-redux';
import * as state from "./state/state";
import {store} from "./state/state";
import * as ui from "./ui";
import * as constants from "../common/constants";
import {tabState} from "./tabs/v2/appTabsContainer";

import {server, cast, pendingRequestsChanged, connectionStatusChanged} from "../socket/socketClient";
var Modal = require('react-modal');

// Having jQuery ($) on the console helps us debug certin libs that use jQuery
import $ = require('jquery');
(window as any).$ = $

// prevent backspace
import {preventBackspaceNav} from "./utils/preventBackspaceNav";
preventBackspaceNav();

// Normalize css
require('normalize.css');

// Load clipboard and enable for all things clipboard
let Clipboard = require('clipboard/dist/clipboard.min');
new Clipboard('[data-clipboard-text]');

// Load hint.css for fancy (styleable) titles
require('hint.css/hint.css');

// Setup font awesome
require('font-awesome/css/font-awesome.css');

// Setup ntypescript
require('ntypescript');

document.addEventListener('DOMContentLoaded', () => {
    // The main app element
    var appElement = document.getElementById('app');

    // Register a modal location
    Modal.setAppElement(appElement);

    // Render the main app
    ReactDOM.render(<Provider store={store}><Root /></Provider>, appElement);

    // Register commands
    commands.register();

    // For testing
    // server.echo({text:"123",num:345}).then((res)=>console.log(res));

    // Anything that should mutate the state
    server.getErrors({}).then((errorsUpdate)=>{
        state.setErrorsUpdate(errorsUpdate);
    });
    cast.errorsUpdated.on((errorsByFilePath)=>{
        state.setErrorsUpdate(errorsByFilePath);
    });
    pendingRequestsChanged.on((r)=>{
        state.setPendingRequests(r.pending);
    });
    connectionStatusChanged.on(r=> {
        state.setSocketConnected(r.connected);
    });
    server.getActiveProjectConfigDetails({}).then(res=>{
        state.setActiveProject(res);
    });
    cast.activeProjectConfigDetailsUpdated.on(res => {
        state.setActiveProject(res);
    });
    server.activeProjectFilePaths({}).then(res=>{
        state.setFilePathsInActiveProject(res.filePaths);
    });
    cast.activeProjectFilePathsUpdated.on(res=>{
        state.setFilePathsInActiveProject(res.filePaths);
    });
    server.filePaths({}).then((res) => {
        state.setFilePaths({filePaths:res.filePaths,rootDir:res.rootDir, completed: res.completed});
    });
    cast.filePathsUpdated.on((res) => {
        state.setFilePaths({filePaths:res.filePaths,rootDir:res.rootDir, completed: res.completed});
    });
    server.getCompleteOutputStatusCache({}).then(res => {
        state.completeOuputStatusCacheUpdated(res);
    });
    cast.fileOutputStatusUpdated.on((res) => {
        state.fileOuputStatusUpdated(res);
    });
    cast.completeOutputStatusCacheUpdated.on((res) => {
        state.completeOuputStatusCacheUpdated(res);
    });
    server.getLiveBuildResults({}).then(res => {
        state.setLiveBuildResults(res);
    });
    cast.liveBuildResults.on((res) => {
        state.setLiveBuildResults(res);
    });
    commands.sync.on(()=>{
        server.sync({});
    });
    commands.build.on(()=>{
        server.build({});
    });
    /** Consolidate the file edit stuff into a single command */
    cast.didEdit.on((e)=>{commands.fileContentsChanged.emit({filePath:e.filePath})});
    cast.savedFileChangedOnDisk.on((e)=>{commands.fileContentsChanged.emit({filePath:e.filePath})});
    commands.toggleDoctor.on(()=>{
        if (!state.inActiveProjectFilePath(tabState.getSelectedFilePath())){
            ui.notifyWarningNormalDisappear('Doctor is only available for files in active project');
            return;
        }
        state.toggleDoctor({});
    });
    commands.duplicateWindow.on(()=>{
        const width = window.innerWidth;
        const height = window.innerHeight;
        window.open(`${window.location.href.replace(location.href,'')}#${constants.urlHashNewSession}`, '',`innerWidth=${width}, innerHeight=${height}`);
    });

    // http://stackoverflow.com/questions/12381563/how-to-stop-browser-back-button-using-javascript
    const ____hash = window.location.hash || constants.urlHashNormal;
    window.location.hash = ____hash;
    window.location.hash = "Again-No-back-button"; // again because google chrome don't insert first hash into history
    window.location.hash = ____hash; // again so that if there was a hash it can be used for routing
    window.onhashchange = function() { window.location.hash = ____hash; }
});
