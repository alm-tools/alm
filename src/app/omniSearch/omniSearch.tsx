import React = require("react");
import ReactDOM = require("react-dom");
import Radium = require('radium');
import csx = require('csx');
import {BaseComponent} from "../ui";
import * as ui from "../ui";
var Modal = require('react-modal');
import * as styles from "../styles/styles";
import {debounce,createMap,rangeLimited,getFileName} from "../../common/utils";
import {cast, server} from "../../socket/socketClient";
import * as commands from "../commands/commands";
import {match, filter as fuzzyFilter} from "fuzzaldrin";
import {Icon} from "../icon";
import {TypedEvent} from "../../common/events";

/** Stuff shared by the select list view */
import {renderMatchedSegments, keyStrokeStyle} from ".././selectListView";

export interface Props {
}
export interface State {
    isOmniSearchOpen?: boolean;
    filterValue?: string;
    selectedIndex?: number;
}

enum Mode {
    FileSearch,
    ProjectSearch
}

let inputStyle = {
    backgroundColor: '#333',
    color: 'white',
    outline: 'none',
    padding: '2px',
    border: '2px solid #3C3C3C',
    fontSize: '1.5rem',
    lineHeight: '2rem',
    fontFamily: 'monospace'
}
let selectedStyle = {
    background: '#545454',
    color: 'white'
};
let listItemStyle = {
    fontFamily: 'monospace'
};


@ui.Radium
export class OmniSearch extends BaseComponent<Props, State>{
    filePaths: string[] = [];
    /** Because doing this in render is slow */
    filePathsFiltered: string[] = [];

    maxShowCount = 15;

    mode: Mode = Mode.FileSearch;

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

        selected: Element;
    }

    componentDidMount() {
        server.filePaths({}).then((res) => {
            this.filePaths = res.filePaths;
            this.forceUpdate();
        });

        cast.filePathsUpdated.on((update) => {
            console.log(update);
            this.filePaths = update.filePaths;
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
        commands.esc.on(()=>{
            this.closeOmniSearch();
        });
    }

    componentDidUpdate() {
        // get the dom node that is selected
        // make sure its parent scrolls to make this visible
        setTimeout(()=>{
            if (this.refs.selected) {
                let selected = ReactDOM.findDOMNode(this.refs.selected) as HTMLDivElement;
                selected.scrollIntoViewIfNeeded(false);
            }
        });
    }

    render() {
        let selectedIndex = this.state.selectedIndex;

        let renderedResults: JSX.Element[] = [];
        if (this.mode == Mode.FileSearch){
            let fileList = this.filePathsFiltered;
            let fileListRendered = fileList.map((result, i) => this.renderHighlightedMatchItem(result, this.state.filterValue, selectedIndex === i, i));
            renderedResults = fileListRendered;
        }

        return <Modal
              isOpen={this.state.isOmniSearchOpen}
              onRequestClose={this.closeOmniSearch}>
                <div style={[csx.vertical]}>
                    <div style={[csx.horizontal, csx.center]}>
                        <h4>Omni Search <Icon name="search"/></h4>
                        <div style={[csx.flex]}></div>
                        <div style={{fontSize:'0.9rem', color:'grey'} as any}><code style={keyStrokeStyle}>Esc</code> to exit <code style={keyStrokeStyle}>Enter</code> to select</div>
                    </div>

                    <div style={[styles.padded1TopBottom,csx.vertical]}>
                        <input
                            style={inputStyle}
                            type="text"
                            ref="omniSearchInput"
                            placeholder="Filter"
                            onChange={this.onChangeFilter}
                            onKeyDown={this.onChangeSelected}
                        />
                    </div>

                    <div className="scrollContainer" style={[csx.vertical,csx.flex,{overflow:'auto'}]}>
                        {renderedResults}
                    </div>
                </div>
        </Modal>
    }

    openOmniSearch = () => {
        this.setState({ isOmniSearchOpen: true });
        (ReactDOM.findDOMNode(this.refs.omniSearchInput) as HTMLInputElement).focus();
    };
    closeOmniSearch = ()=>{
        this.setState({ isOmniSearchOpen: false, filterValue: '' });
    };
    onChangeFilter = debounce((e)=>{
        let filterValue = (ReactDOM.findDOMNode(this.refs.omniSearchInput) as HTMLInputElement).value;
        this.filePathsFiltered = fuzzyFilter(this.filePaths, filterValue);
        this.filePathsFiltered = this.filePathsFiltered.slice(0,this.maxShowCount);
        this.setState({ filterValue, selectedIndex:0 });
    },50);
    incrementSelected = debounce(() => {
        this.setState({ selectedIndex: rangeLimited({ num: ++this.state.selectedIndex, min: 0, max: Math.min(this.maxShowCount - 1, this.filePathsFiltered.length - 1), loopAround: true }) });
    }, 0, true);
    decrementSelected = debounce(() => {
        this.setState({ selectedIndex: rangeLimited({ num: --this.state.selectedIndex, min: 0, max: Math.min(this.maxShowCount - 1, this.filePathsFiltered.length - 1), loopAround: true }) });
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
            this.selectIndex(this.state.selectedIndex);
        }
    };
    selectIndex = (index:number) => {
        let relativeFilePath = this.filePathsFiltered[index];
        if (relativeFilePath) {
            server.makeAbsolute({ relativeFilePath }).then(abs => {
                commands.doOpenFile.emit({ filePath: abs.filePath });
            });
        }
        this.closeOmniSearch();
    }

    renderHighlightedMatchItem(result: string, query: string, selected: boolean,index: number): JSX.Element {
        // Create rendered
        let renderedPath = renderMatchedSegments(result,query);
        let renderedFileName = renderMatchedSegments(getFileName(result), query);

        let style = selected ? selectedStyle : {};

        let ref = selected && "selected";
        return (
            <div key={result} style={[style,styles.padded2,styles.hand, listItemStyle]} onClick={()=>this.selectIndex(index)} ref={ref}>
                <div>{renderedFileName}</div>
                {renderedPath}
            </div>
        );
    }
}


/**
 * Omni search has a lot of UI work in it,
 * don't want to sprike in all the MODE selection stuff in there as well
 * So ... created this class
 * Responsible for taking user input > parsing it and then > returning the rendered search results
 * Also maintains the selected index within the search results
 */
class SearchState {
    /**
     * Various search lists
     */
    filePaths: string [] = [];

    /**
     * Current mode
     */
    mode: Mode = Mode.FileSearch;

    /**
     * showing search results
     */
    isShown: boolean;

    /**
     * if there are new search results the user might care about
     */
    updatedSearchResults = new TypedEvent<{}>();

    constructor() {
        server.filePaths({}).then((res) => {
            this.filePaths = res.filePaths;
            this._updateIfUserIsSearching(Mode.FileSearch);
        });

        cast.filePathsUpdated.on((update) => {
            console.log(update);
            this.filePaths = update.filePaths;
            this._updateIfUserIsSearching(Mode.FileSearch);
        });
    }

    private _updateIfUserIsSearching(mode:Mode){
        if (this.mode == mode && this.isShown){
            this.updatedSearchResults.emit({});
        }
    }


}
