import * as ui from "../../ui";
import * as csx from "../../base/csx";
import * as React from "react";
import * as tab from "./tab";
import {server, cast} from "../../../socket/socketClient";
import * as commands from "../../commands/commands";
import * as utils from "../../../common/utils";
import * as d3 from "d3";
import {Types} from "../../../socket/socketContract";
import * as types from "../../../common/types";
import {IconType} from "../../../common/types";
import * as $ from "jquery";
import * as styles from "../../styles/themes/current/base";
import * as onresize from "onresize";
import {Clipboard} from "../../components/clipboard";
import * as typeIcon from "../../components/typeIcon";
import * as gls from "../../base/gls";
import * as typestyle from "typestyle";
import {MarkDown} from "../../markdown/markdown";
import {testResultsCache} from "../../clientTestResultsCache";
import {Icon} from "../../components/icon";
import * as state from "../../state/state";

import {blackHighlightColor} from "../../styles/themes/current/base";

export interface Props extends tab.TabProps {
}
export interface State {
    tests?: types.TestSuitesByFilePath;
    testResultsStats?: types.TestContainerStats;
    selected?: string | null;
    testedWorking?: types.Working;
}

export namespace TestedViewStyles {
    export const headerClassName = typestyle.style({
        fontWeight: 'bold',
        cursor: 'pointer',
        '&:hover': {
            textDecoration: 'underline'
        }
    });
    export const clickable = typestyle.style({
        cursor: 'pointer',
        '&:hover': {
            textDecoration: 'underline'
        }
    });
}

/** Utility */
const makeReactKeyOutOfPosition = (position: EditorPosition) => {
    return position.line + ':' + position.ch;
}
const formatStats = (stats: types.TestContainerStats): string => {
    return `Σ: ${stats.testCount} (✓: ${stats.passCount}, ✘: ${stats.failCount}, ◎: ${stats.skipCount}) ${utils.formatMilliseconds(stats.durationMs)}`
}

export class TestedView extends ui.BaseComponent<Props, State> {

    constructor(props: Props) {
        super(props);
        this.state = {
            tests: Object.create(null),
            selected: null
        };
    }

    componentDidMount() {

        /**
         * Initial load + load on result change
         */
        this.loadData();
        this.disposible.add(
            testResultsCache.testResultsDelta.on(() => {
                this.loadData();
            })
        );
        this.disposible.add(state.subscribeSub(s=>s.testedWorking, (testedWorking)=>{
            this.setState({testedWorking});
        }));

        // Listen to tab events
        const api = this.props.api;
        this.disposible.add(api.resize.on(this.resize));
        this.disposible.add(api.focus.on(this.focus));
        this.disposible.add(api.save.on(this.save));
        this.disposible.add(api.close.on(this.close));
        this.disposible.add(api.gotoPosition.on(this.gotoPosition));
        // Listen to search tab events
        this.disposible.add(api.search.doSearch.on(this.search.doSearch));
        this.disposible.add(api.search.hideSearch.on(this.search.hideSearch));
        this.disposible.add(api.search.findNext.on(this.search.findNext));
        this.disposible.add(api.search.findPrevious.on(this.search.findPrevious));
        this.disposible.add(api.search.replaceNext.on(this.search.replaceNext));
        this.disposible.add(api.search.replacePrevious.on(this.search.replacePrevious));
        this.disposible.add(api.search.replaceAll.on(this.search.replaceAll));
    }

    ctrls: {
        root?: HTMLDivElement
    }  = {};

    render() {
        return (
            <div
                ref={(root)=>this.ctrls.root = root}
                onFocus={this.props.onFocused}
                tabIndex={0}
                style={csx.extend(csx.vertical, csx.flex, csx.newLayerParent, styles.someChildWillScroll, {color: styles.textColor}) }
                onKeyPress={this.handleKey}>
                <gls.FlexVertical style={{ overflow: 'hidden', padding: '10px'}}>
                    {this.renderHeader() }
                    <gls.SmallVerticalSpace/>
                    <gls.FlexVertical>
                        <gls.FlexHorizontal>
                            <gls.ContentVertical style={{ overflow: 'auto', backgroundColor: styles.blackHighlightColor, padding: '10px', width: '200px' }}>
                                {
                                    this.renderFiles()
                                }
                            </gls.ContentVertical>
                            <gls.SmallHorizontalSpace/>
                            <gls.FlexVertical style={{ overflow: 'auto', backgroundColor: styles.blackHighlightColor, padding: '10px' }}>
                                {
                                    this.state.selected
                                        ? this.renderSelectedNode()
                                        : 'Select a module from the left to view results 🌹'
                                }
                            </gls.FlexVertical>
                        </gls.FlexHorizontal>
                    </gls.FlexVertical>
                </gls.FlexVertical>
            </div>
        );
    }

    renderHeader(){
        if (!this.state.testResultsStats) {
            return <div>No test runs yet.</div>
        }
        const testResultsStats = testResultsCache.getStats();
        const failing = !!testResultsStats.failCount;
        const totalThatRan = testResultsStats.passCount + testResultsStats.failCount;
        const working = this.state.testedWorking && this.state.testedWorking.working;
        const summary = formatStats(testResultsStats);
        const testStatsRendered = !!testResultsStats.testCount && <span>
            {
                failing
                ? <span style={{ color: styles.errorColor, fontWeight: 'bold'}}>
                    <Icon name={styles.icons.tested} spin={!!working}/> {testResultsStats.failCount}/{totalThatRan} Tests Failing
                </span>
                : <span style={{ color: styles.successColor, fontWeight: 'bold'}}>
                    <Icon name={styles.icons.tested} spin={!!working}/> {testResultsStats.passCount}/{totalThatRan} Tests Passed
                </span>
            }
        </span>
        return (
            <gls.ContentHorizontal>
                <gls.Content>
                    {testStatsRendered}
                </gls.Content>
                <gls.Flex/>
                <gls.Content>
                    {summary}
                </gls.Content>
            </gls.ContentHorizontal>
        );
    }

    renderFiles(){
        return Object.keys(this.state.tests).map((fp, i) => {
            const item = this.state.tests[fp];
            const fileName = utils.getFileName(fp);
            const failing = !!item.stats.failCount;
            const totalThatRan =  item.stats.passCount + item.stats.failCount;
            return (
                <div
                    key={i}
                    title={fp}
                    className={TestedViewStyles.headerClassName}
                    style={csx.extend({
                        paddingTop: '2px', paddingBottom: '2px', paddingLeft: '2px',
                        color: failing ? styles.errorColor : styles.successColor,
                        backgroundColor: this.state.selected === fp ? styles.selectedBackgroundColor: 'transparent',
                    }, styles.ellipsis)}
                    onClick={() => this.handleModuleSelected(item) }>
                    <Icon name="file-text-o" /> ({failing ? item.stats.failCount : item.stats.passCount}/{totalThatRan}) {fileName}
                </div>
            )
        });
    }

    renderSelectedNode() {
        const filePath = this.state.selected;
        const test = this.state.tests[filePath];
        if (!test) {
            return <div>The selected filePath: {filePath} is no longer in the test restuls</div>
        }
        const someFailing = !!test.stats.failCount;
        return <gls.ContentVerticalContentPadded padding={10}>
            <div
                style={{
                    color: someFailing ? styles.errorColor : styles.successColor
                }}>
                <gls.InlineBlock> {formatStats(test.stats)} </gls.InlineBlock>
            </div>
            <div className={TestedViewStyles.clickable} style={{fontSize: '.8em', textDecoration: 'underline'}}>
                <span
                onClick={()=>{
                    commands.doOpenOrFocusFile.emit({
                        filePath: filePath,
                    });
                }}>{filePath}</span>
            </div>
            <gls.Content>
                {test.suites.map(s=>this.renderSuite(s))}
            </gls.Content>
        </gls.ContentVerticalContentPadded>
    }

    renderSuite(suite: types.TestSuiteResult) {
        const color = !!suite.stats.failCount ? styles.errorColor
            : !!suite.stats.passCount ? styles.successColor
            : styles.highlightColor;
        return <div key={makeReactKeyOutOfPosition(suite.testLogPosition.lastPositionInFile)} style={{
            fontSize: '13px',
            border: `1px solid ${color}`,
            marginTop:'5px', padding: '5px'
        }}>

            <gls.InlineBlock style={{
                    color: color
                }}>
                <Icon name={styles.icons.testedSuite}/> <span
                className={TestedViewStyles.headerClassName}
                onClick={()=>this.openTestLogPositionInSelectedModule(suite.testLogPosition)}>
                    {suite.description}
                </span>
            </gls.InlineBlock>
            <gls.SmallVerticalSpace space={10}/>
            {formatStats(suite.stats)}
            <gls.SmallVerticalSpace space={10}/>
            {suite.tests.map(s=>this.renderTest(s))}
            <gls.SmallVerticalSpace space={10}/>
            {suite.suites.map(s=>this.renderSuite(s))}
        </div>
    }

    renderTest(test: types.TestResult) {
        return <div key={makeReactKeyOutOfPosition(test.testLogPosition.lastPositionInFile) } style={{padding: '5px'}}>
            <gls.InlineBlock
                style={{
                    color: test.status === types.TestStatus.Success ? styles.successColor
                        : test.status === types.TestStatus.Fail ? styles.errorColor
                            : styles.highlightColor
                }}>
                <Icon name={styles.icons.testedTest}/> <span
                className={TestedViewStyles.headerClassName}
                onClick={() => this.openTestLogPositionInSelectedModule(test.testLogPosition) }>
                    {test.description}
                </span>
            </gls.InlineBlock>
            &nbsp;&nbsp;<gls.InlineBlock style={{fontSize: '10px'}}>{test.durationMs != undefined ? utils.formatMilliseconds(test.durationMs) : ''}</gls.InlineBlock>
            {
                test.status === types.TestStatus.Fail && <div style={{
                    padding: '5px',
                    margin: '5px',
                    backgroundColor: 'black'
                }}>
                    <gls.ContentVerticalContentPadded padding={10}>
                        <div><Clipboard text={test.error.message}/> {test.error.message}</div>
                        {!!test.error.testLogPosition.stack.length && test.error.testLogPosition.stack.map(s => {
                            return <div key={makeReactKeyOutOfPosition(s.position)} style={{fontSize: '11px'}} onClick={()=>this.openFilePathPosition(s)}>
                                <Icon name="eye"/>
                                &nbsp;&nbsp;<gls.InlineBlock className={TestedViewStyles.clickable}>{s.filePath}:{s.position.line + 1}:{s.position.ch + 1}</gls.InlineBlock>
                            </div>
                        }) }
                    </gls.ContentVerticalContentPadded>
                </div>
            }
        </div>
    }

    openTestLogPositionInSelectedModule = (pos: types.TestLogPosition) => {
        const filePath = this.state.selected;
        commands.doOpenOrFocusFile.emit({
            filePath,
            position: pos.lastPositionInFile,
        })
    }

    openFilePathPosition = (fpPos: types.FilePathPosition) => {
        commands.doOpenOrFocusFile.emit(fpPos);
    }

    handleNodeClick = (node: types.DocumentedType) => {
        commands.doOpenOrFocusFile.emit({
            filePath: node.location.filePath,
            position: node.location.position
        });
    }

    handleModuleSelected = (node: types.TestModule) => {
        this.setState({ selected: node.filePath });
    }

    handleKey = (e: any) => {
        let unicode = e.charCode;
        if (String.fromCharCode(unicode).toLowerCase() === "r") {
            this.loadData();
        }
    }

    loadData = () => {
        const results = testResultsCache.getResults();
        const testResultsStats = testResultsCache.getStats();
        this.setState({tests: results, testResultsStats});
    }

    /**
     * TAB implementation
     */
    resize = () => {
        // Not needed
    }

    focus = () => {
        this.ctrls.root.focus();
    }

    save = () => {
    }

    close = () => {
    }

    gotoPosition = (position: EditorPosition) => {
    }

    search = {
        doSearch: (options: FindOptions) => {
        },

        hideSearch: () => {
        },

        findNext: (options: FindOptions) => {
        },

        findPrevious: (options: FindOptions) => {
        },

        replaceNext: ({newText}: { newText: string }) => {
        },

        replacePrevious: ({newText}: { newText: string }) => {
        },

        replaceAll: ({newText}: { newText: string }) => {
        }
    }
}
