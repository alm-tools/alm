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

export interface Props {
}
export interface State {
    isOmniSearchOpen?: boolean;
    filterValue?: string;
    selectedIndex?: number;
}

@ui.Radium
export class OmniSearch extends BaseComponent<Props, State>{
    /** not in state as we don't want react diffing it */
    fileList: string[] = [];
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
        server.getAllFiles({}).then((res) => {
            this.fileList = res.fileList;
            this.forceUpdate();
        });

        cast.fileListUpdated.on((update) => {
            console.log(update);
            this.fileList = update.fileList;
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
        this.filteredResults = fuzzyFilter(this.fileList, filterValue);
        this.filteredResults = this.filteredResults.slice(0,this.maxShowCount);
        this.setState({ filterValue, selectedIndex:0 });
    },50);
    incrementSelected = debounce(()=>{
        this.setState({ selectedIndex: rangeLimited(++this.state.selectedIndex, 0, Math.min(this.maxShowCount - 1,this.filteredResults.length - 1), true) });
    },0,true);
    decrementSelected = debounce(()=>{
        this.setState({ selectedIndex: rangeLimited(--this.state.selectedIndex, 0, Math.min(this.maxShowCount - 1,this.filteredResults.length - 1), true) });
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
            let file = this.filteredResults[this.state.selectedIndex];
            if (file) {
                // TODO: Open the file
                console.log('open', file);
                server.getFileContents({filePath: file}).then((res)=>{
                    console.log('got contents!',res.contents);
                });
            }
            this.closeOmniSearch();
        }
    };
}


/** 
 * Based on https://github.com/atom/fuzzy-finder/blob/51f1f2415ecbfab785596825a011c1d2fa2658d3/lib/fuzzy-finder-view.coffee#L56-L74
 */
function getMatches(result: string, query: string) {
    let matches = match(result, query);
    let matchMap = createMap(matches);
    // collapse contiguous sections into a single `<strong>`
    let currentUnmatchedCharacters = [];
    let currentMatchedCharacters = [];
    let combined: { str: string, matched: boolean }[] = [];
    function closeOffUnmatched() {
        if (currentUnmatchedCharacters.length) {
            combined.push({ str: currentUnmatchedCharacters.join(''), matched: false });
            currentUnmatchedCharacters = [];
        }
    }
    function closeOffMatched() {
        if (currentMatchedCharacters.length) {
            combined.push({ str: currentMatchedCharacters.join(''), matched: true });
            currentMatchedCharacters = [];
        }
    }
    result.split('').forEach((c, i) => {
        let isMatched = matchMap[i];
        if (isMatched) {
            if (currentMatchedCharacters.length) {
                currentMatchedCharacters.push(c);
            }
            else {
                currentMatchedCharacters = [c]
                // close off any unmatched characters
                closeOffUnmatched();
            }
        }
        else {
            if (currentUnmatchedCharacters.length) {
                currentUnmatchedCharacters.push(c);
            }
            else {
                currentUnmatchedCharacters = [c]
                // close off any matched characters
                closeOffMatched();
            }
        }
    });
    closeOffMatched();
    closeOffUnmatched();
    return combined;
}

function renderMatched(matched: { str: string, matched: boolean }[]): JSX.Element[] {
    return matched.map((item, i) => {
        if (item.matched) {
            return <strong key={i}>{item.str}</strong>;
        }
        else {
            return <span key={i}>{item.str}</span>;
        }
    });
}

function highlightMatch(result: string, query: string, selected: boolean): JSX.Element {
    let matchesInPath = getMatches(result, query);
    let matchesInFileName = getMatches(getFileName(result), query);

    // Create rendered
    let renderedPath = renderMatched(matchesInPath);
    let renderedFileName = renderMatched(matchesInFileName);

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