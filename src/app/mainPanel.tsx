import utils = require("../common/utils");
import styles = require("./styles/themes/current/base");
import React = require("react");
import ReactDOMServer = require("react-dom/server");
import csx = require('./base/csx');
import {BaseComponent} from "./ui";
import * as ui from "./ui";
import {cast,server} from "../socket/socketClient";
import * as commands from "./commands/commands";
import * as types from "../common/types";
import {AvailableProjectConfig} from "../common/types";
import {Clipboard} from "./components/clipboard";
import {PendingRequestsIndicator} from "./pendingRequestsIndicator";
import {Icon} from "./components/icon";
import {ButtonBlack} from "./components/buttons";
import {InputBlack} from "./components/inputs";
import * as pure from "../common/pure";
let {DraggableCore} = ui;

import {connect} from "react-redux";
import {StoreState,expandErrors,collapseErrors} from "./state/state";
import * as state from "./state/state";
import * as gotoHistory from "./gotoHistory";
import {tabState,tabStateChanged} from "./tabs/v2/appTabsContainer";
import * as settings from "./state/settings";
import {errorsCache} from "./globalErrorCacheClient";

let notificationKeyboardStyle = {
    border: '2px solid',
    borderRadius: '6px',
    display: 'inline-block',
    padding: '5px',
    background: 'grey',
}

export interface Props {
    // from react-redux ... connected below
    errorsExpanded?: boolean;
    activeProject?: AvailableProjectConfig;
    activeProjectFiles?: { [filePath: string]: boolean };
    socketConnected?: boolean;
    errorsDisplayMode?: types.ErrorsDisplayMode;
    errorsFilter?: string;
}
export interface State {
    /** height in pixels */
    height?: number;
}

let resizerWidth = 5;
let resizerStyle = {
    background: 'radial-gradient(#444,transparent)',
    height: resizerWidth+'px',
    cursor:'ns-resize',
    color: '#666',
}

@connect((state: StoreState): Props => {
    return {
        errorsExpanded: state.errorsExpanded,
        activeProject: state.activeProject,
        activeProjectFiles: state.activeProjectFilePathTruthTable,
        socketConnected: state.socketConnected,
        errorsDisplayMode: state.errorsDisplayMode,
        errorsFilter: state.errorsFilter,
    };
})
export class MainPanel extends BaseComponent<Props, State>{
    constructor(props:Props){
        super(props);
        this.state = {
            height: 250,
        }
    }

    componentDidMount() {
        settings.mainPanelHeight.get().then(res => {
            let height = res || this.state.height;
            height = Math.min(window.innerHeight - 100, height);
            this.setState({ height });
        });
        this.disposible.add(commands.toggleMessagePanel.on(()=>{
            state.getState().errorsExpanded?state.collapseErrors({}):state.expandErrors({});
        }));
        this.disposible.add(tabStateChanged.on(()=>{
            this.forceUpdate();
        }));
        this.disposible.add(errorsCache.errorsDelta.on(()=>{
            this.forceUpdate();
        }))
    }

    render(){
        const errorsUpdate = errorsCache.getErrorsLimited();
        let errorPanel = undefined;
        if (this.props.errorsExpanded){
            errorPanel = <div>

            <DraggableCore onDrag={this.handleDrag} onStop={this.handleStop}>
                <div style={csx.extend(csx.flexRoot, csx.centerCenter, resizerStyle)}><Icon name="ellipsis-h"/></div>
            </DraggableCore>

            <div style={csx.extend(styles.errorsPanel.main, { height: this.state.height }) }>
                {
                    <div
                        style={styles.errorsPanel.headerSection}>
                        <div style={csx.horizontal}>
                            <div style={csx.extend(csx.horizontal, csx.flex, csx.center, {marginRight:'10px'})}>
                                <ButtonBlack
                                    text={"Show All"}
                                    onClick={()=>state.setErrorsDisplayMode(types.ErrorsDisplayMode.all)}
                                    isActive={this.props.errorsDisplayMode == types.ErrorsDisplayMode.all}/>
                                <ButtonBlack
                                    text={"Show Only Open Files"}
                                    onClick={()=>state.setErrorsDisplayMode(types.ErrorsDisplayMode.openFiles)}
                                    isActive={this.props.errorsDisplayMode == types.ErrorsDisplayMode.openFiles}/>
                                <label style={{marginLeft:'10px'}}>
                                    Filter:
                                </label>
                                <InputBlack
                                    style={{marginRight:'10px', maxWidth:'200px'}}
                                    onChange={(value)=>state.setErrorsFilter(value)}
                                    value={this.props.errorsFilter}/>
                                <ButtonBlack
                                    text={"Clear"}
                                    disabled={!this.props.errorsFilter.trim()}
                                    onClick={()=>state.setErrorsFilter('')}/>
                            </div>
                            {errorsUpdate.tooMany
                                && <div
                                    style={styles.errorsPanel.tooMany}
                                    className="hint--bottom-left hint--info"
                                    data-hint="We only sync the top 50 per file with a limit of 250. That ensures that live linting doesn't slow anything else down.">
                                    {errorsUpdate.totalCount} total. Showing top {errorsUpdate.syncCount}.
                                </div>}
                        </div>
                    </div>
                }

                {
                    errorsUpdate.totalCount
                        ? this.renderErrors()
                        : <div style={styles.errorsPanel.success}>No Errors ❤</div>
                }
                </div>
            </div>
        }

        return (
            <div style={{zIndex:6 /* force over golden-layout */}}>
                {errorPanel}
            </div>
        );
    }

    renderErrors() {
        const errorsToRender: types.ErrorsByFilePath = tabState.errorsByFilePathFiltered().errorsByFilePath;
        return (
            <div style={{overflow:'auto'}}>{
            Object.keys(errorsToRender)
                .filter(filePath => !!errorsToRender[filePath].length)
                .map((filePath, i) => {
                    const errors = errorsToRender[filePath];

                    return <ErrorRenders.ErrorsForFilePath key={i} errors={errors} filePath={filePath} />;
                })
            }</div>
        );
    }

    toggleErrors = () => {
        if (this.props.errorsExpanded){
            collapseErrors({});
        }
        else{
            expandErrors({});
        }
    }

    openErrorLocation = (error: types.CodeError) => {
        gotoHistory.gotoError(error);
    }

    openFile = (filePath: string) => {
        commands.doOpenOrFocusFile.emit({ filePath });
    }

    handleDrag = (evt, ui: {
        node: Node,
        deltaX: number, deltaY: number,
        lastX: number, lastY: number,
    }) => {
        this.setState({ height: utils.rangeLimited({ num: this.state.height - ui.deltaY, min: 100, max: window.innerHeight - 100 }) });
    };

    handleStop = () => {
        const height = this.state.height;
        settings.mainPanelHeight.set(height);
    }

    componentWillUpdate(nextProps: Props, nextState: State) {
        if (nextState.height !== this.state.height
            || nextProps.errorsExpanded !== this.props.errorsExpanded) {
            tabState.debouncedResize();
        }
    }
}

/**
 * Pure components for rendering errors
 */
namespace ErrorRenders {

    const openErrorLocation = (error: types.CodeError) => {
        gotoHistory.gotoError(error);
    }

    interface ErrorsForFilePathProps {
        filePath: string,
        errors: types.CodeError[]
    }

    export class ErrorsForFilePath extends React.Component<ErrorsForFilePathProps, {}> {
        shouldComponentUpdate = pure.shouldComponentUpdate;

        render() {
            const codeErrors = this.props.errors;

            const errors = codeErrors.filter(x=>x.level === 'error');
            const warnings = codeErrors.filter(x=>x.level === 'warning');

            let errorsRendered =
                    // error before warning
                    errors.concat(warnings)
                    .map((e, j) => (
                        <SingleError key={`${j}`} error={e}/>
                    ));

            return <div>
                <div style={styles.errorsPanel.filePath} onClick={() => openErrorLocation(this.props.errors[0]) }>
                    <Icon name="file-code-o" style={{ fontSize: '.8rem' }}/>
                    &nbsp;{this.props.filePath}
                    (
                        {!!errors.length && <span style={{color: styles.errorColor}}>{errors.length}</span>}
                        {!!(errors.length && warnings.length) && ','}
                        {!!warnings.length && <span style={{color: styles.warningColor}}>{warnings.length}</span>}
                    )
                </div>

                <div style={styles.errorsPanel.perFileList}>
                    {errorsRendered}
                </div>
            </div>;
        }
    }

    export class SingleError extends React.Component<{error:types.CodeError},{}>{
        shouldComponentUpdate = pure.shouldComponentUpdate;

        render() {
            const e = this.props.error;
            const style = e.level === 'error'
                ? styles.errorsPanel.errorDetailsContainer
                : styles.errorsPanel.warningDetailsContainer;

            return (
                <div style={style} onClick={() => openErrorLocation(e) }>
                    <div style={styles.errorsPanel.errorDetailsContent}>
                        <div style={styles.errorsPanel.errorMessage}>
                            🐛({e.from.line + 1}: {e.from.ch + 1}) {e.message}
                            {' '}<Clipboard text={`${e.filePath}:${e.from.line + 1} ${e.message}`}/>
                        </div>
                        {e.preview ? <div style={styles.errorsPanel.errorPreview}>{e.preview}</div> : ''}
                    </div>
                </div>
            );
        }
    }
}
