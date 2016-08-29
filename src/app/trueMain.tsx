/**
 * Load up TypeScript
 */
import _ts = require('byots');
const ensureImport = _ts;

/**
 * The main entry point for the front end
 */
import {Root} from "./root";
import * as commands from "./commands/commands";
import * as React from "react";
const ReactDOM = require("react-dom");
const ReactDOMServer = require("react-dom/server");
import { Provider } from 'react-redux';
import * as state from "./state/state";
import {store} from "./state/state";
import * as ui from "./ui";
import {tabState} from "./tabs/v2/appTabsContainer";
import * as settings from "./state/settings";
import * as clientSession from "./state/clientSession";
import * as types from "../common/types";
import {errorsCache} from "./globalErrorCacheClient";
import {testResultsCache} from "./clientTestResultsCache";

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

// Lost connection indicator
require('./lostConnection.css')

// Load clipboard and enable for all things clipboard
let Clipboard = require('clipboard/dist/clipboard.min');
new Clipboard('[data-clipboard-text]');

// Load hint.css for fancy (styleable) titles
require('hint.css/hint.css');

// Setup font awesome
require('font-awesome/css/font-awesome.css');

const afterLoaded = () => {
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
        errorsCache.setErrors(errorsUpdate);
    });
    cast.errorsDelta.on((errorsDelta) => {
        if (errorsDelta.initial) {
            errorsCache.clearErrors();
        }
        errorsCache.applyDelta(errorsDelta);
    });
    server.getTestResults({}).then((results)=>{
        testResultsCache.setResults(results);
    });
    cast.testResultsDelta.on((testResultsDelta) => {
        testResultsCache.applyTestResultsDelta(testResultsDelta);
    });
    pendingRequestsChanged.on((r)=>{
        state.setPendingRequests(r.pending);
    });
    let firstConnectionState = true;
    connectionStatusChanged.on(r=> {
        state.setSocketConnected(r.connected);
        if (firstConnectionState) {
            $('.alm-connection-status').css('display', 'block');
            firstConnectionState = false;
            return;
        }
        $('.alm-connection-status').toggleClass('alm-connection-status-active', !r.connected);
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
    cast.tsWorking.on(res => {
        state.setTSWorking(res);
    });
    cast.testedWorking.on(res => {
        state.setTestedWorking(res);
    });
    commands.sync.on(()=>{
        server.sync({});
    });
    commands.build.on(()=>{
        server.build({});
    });
    /** Consolidate the file edit stuff into a single command */
    cast.didEdits.on((e)=>{commands.fileContentsChanged.emit({filePath:e.filePath})});
    cast.savedFileChangedOnDisk.on((e)=>{commands.fileContentsChanged.emit({filePath:e.filePath})});
    commands.toggleDoctor.on(()=>{
        if (!state.inActiveProjectFilePath(tabState.getSelectedFilePath())){
            ui.notifyWarningNormalDisappear('Doctor is only available for files in active project');
            return;
        }
        state.toggleDoctor({});
    });
    commands.toggleSemanticView.on(()=>{
        if (!state.inActiveProjectFilePath(tabState.getSelectedFilePath())){
            ui.notifyWarningNormalDisappear('Semantic view is only available for files in active project');
            return;
        }
        state.toggleSemanticView({});
    });
    commands.duplicateWindow.on(()=>{
        const width = window.innerWidth;
        const height = window.innerHeight;
        window.open(`${window.location.href.replace(location.href,'')}#${types.urlHashNewSession}`, '',`innerWidth=${width}, innerHeight=${height}`);
    });

    /** Set the window session */
    server.getValidSessionId({ sessionId: clientSession.getSessionId() }).then((res) => {
        clientSession.setSessionId(res.sessionId);
        const sessionId = res.sessionId;
        // Now load all the other settings we want:

        /**
         * Pattern:
         * - Load the setting into redux
         * - Then keep it updated as redux changes
         */
        settings.showDoctor.get().then(res => {
            state.setShowDoctor(res);
            state.subscribeSub(s => s.showDoctor, (showDoctor) => {
                settings.showDoctor.set(showDoctor);
            });
        });
        settings.showSemanticView.get().then(res => {
            state.setShowSemanticView(res);
            state.subscribeSub(s => s.showSemanticView, (showSemanticView) => {
                settings.showSemanticView.set(showSemanticView);
            });
        });
        settings.errorsExpanded.get().then(res => {
            if (res) state.expandErrors({});
            else state.collapseErrors({});
            state.subscribeSub(s => s.errorsExpanded, (errorsExpanded) => {
                settings.errorsExpanded.set(errorsExpanded);
            });
        });
        settings.errorsDisplayMode.get().then(res => {
            state.setErrorsDisplayMode(res || types.ErrorsDisplayMode.all);
            state.subscribeSub(s => s.errorsDisplayMode, (errorsDisplayMode) => {
                settings.errorsDisplayMode.set(errorsDisplayMode);
            });
        });
        settings.fileTreeExpanded.get().then(res => {
            if (res) state.expandFileTree({});
            else state.collapseFileTree({});
            state.subscribeSub(s => s.fileTreeShown, (fileTreeShown) => {
                settings.fileTreeExpanded.set(fileTreeShown);
            });
        });
    });
};
afterLoaded();
