import React = require("react");
import Radium = require('radium');
import csx = require('csx');
import {BaseComponent} from "./ui";
import * as ui from "./ui";
var Modal = require('react-modal');
import * as styles from "./styles/styles";
import {debounce,createMap,rangeLimited,getFileName} from "../common/utils";
import {cast, server} from "../socket/socketClient";
import * as commands from "./commands/commands";
import {match, filter as fuzzyFilter} from "fuzzaldrin";
import {renderMatchedSegments} from "./selectListView";

export interface Props {
}
export interface State {
    isOmniSearchOpen?: boolean;
    filterValue?: string;
    selectedIndex?: number;
}

@ui.Radium
export class OmniSearch extends BaseComponent<Props, State>{
    relativeFilePaths: string[] = [];
    /** Because doing this in render is slow */
    filteredResults: string[] = [];

    maxShowCount = 15;

    constructor(props: Props) {
        super(props);

        this.state = this.propsToState(props);
    }

    propsToState(props: Props): State {
        return {
        };
    }
    componentWillReceiveProps(props: Props) {
        this.setState(this.propsToState(props));
    }

    refs: {
        [string: string]: any;
        omniSearch: any;
        omniSearchInput: any;
    }

    componentDidMount() {
        server.fileList({}).then((res) => {
            this.relativeFilePaths = res.relativeFilePaths;
            this.forceUpdate();
        });

        cast.fileListUpdated.on((update) => {
            console.log(update);
            this.relativeFilePaths = update.relativeFilePaths;
            this.forceUpdate();
        });

        commands.findFile.on(() => {
            console.log('find file');
            this.openOmniSearch();
        });
        commands.findCommand.on(() => {
            console.log('find command');
            this.openOmniSearch();
        });
    }

    render() {
        let fileList = this.filteredResults;
        let selectedIndex = this.state.selectedIndex;
        let fileListRendered = fileList.map((result,i) => highlightMatch(result, this.state.filterValue, selectedIndex === i));

        return <Modal
              isOpen={this.state.isOmniSearchOpen}
              onRequestClose={this.closeOmniSearch}>
                <div style={[csx.vertical]}>
                    <div style={[csx.horizontal]}>
                        <h4>Omni Search</h4>
                        <div style={[csx.flex]}></div>
                        <div style={[styles.userTip]}>Press <code style={styles.keyStroke}>esc</code> to close</div>
                    </div>

                    <div style={[styles.paddedTopBottom1,csx.vertical]}>
                        <input
                            type="text"
                            ref="omniSearchInput"
                            placeholder="Filter"
                            onChange={this.onChangeFilter}
                            onKeyDown={this.onChangeSelected}
                        />
                    </div>

                    <div style={[csx.vertical,csx.flex,{overflow:'auto'}]}>
                        <div style={[csx.vertical]}>
                            {fileListRendered}
                         </div>
                    </div>
                </div>
        </Modal>
    }

    openOmniSearch = () => {
        this.setState({ isOmniSearchOpen: true });
        this.refs.omniSearchInput.getDOMNode().focus();
    };
    closeOmniSearch = ()=>{
        this.setState({ isOmniSearchOpen: false, filterValue: '' });
    };
    onChangeFilter = debounce((e)=>{
        let filterValue = this.refs.omniSearchInput.getDOMNode().value;
        this.filteredResults = fuzzyFilter(this.relativeFilePaths, filterValue);
        this.filteredResults = this.filteredResults.slice(0,this.maxShowCount);
        this.setState({ filterValue, selectedIndex:0 });
    },50);
    incrementSelected = debounce(() => {
        this.setState({ selectedIndex: rangeLimited({ num: ++this.state.selectedIndex, min: 0, max: Math.min(this.maxShowCount - 1, this.filteredResults.length - 1), loopAround: true }) });
    }, 0, true);
    decrementSelected = debounce(() => {
        this.setState({ selectedIndex: rangeLimited({ num: --this.state.selectedIndex, min: 0, max: Math.min(this.maxShowCount - 1, this.filteredResults.length - 1), loopAround: true }) });
    },0,true);
    onChangeSelected = (e)=>{
        if (e.key == 'ArrowUp'){
            e.preventDefault();
            this.decrementSelected();
        }
        if (e.key == 'ArrowDown') {
            e.preventDefault();
            this.incrementSelected();
        }
        if (e.key == 'Enter'){
            e.preventDefault();
            let relativeFilePath = this.filteredResults[this.state.selectedIndex];
            if (relativeFilePath) {
                server.makeAbsolute({ relativeFilePath }).then(abs => {
                    commands.docOpenFile.emit({ filePath: abs.filePath });
                });
            }
            this.closeOmniSearch();
        }
    };
}

/** Specific to omniSearch */
function highlightMatch(result: string, query: string, selected: boolean): JSX.Element {
    // Create rendered
    let renderedPath = renderMatchedSegments(result,query);
    let renderedFileName = renderMatchedSegments(getFileName(result), query);

    let selectedStyle = selected ? {
        background: 'grey',
        color: 'white'
    } : {};
    return (
        <div key={result} style={[selectedStyle,styles.padded2]}>
            <div>{renderedFileName}</div>
            {renderedPath}
        </div>
    );
}
