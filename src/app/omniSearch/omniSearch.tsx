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
import {renderMatchedSegments, keyStrokeStyle, getFilteredItems} from ".././selectListView";

export interface Props {
}
export interface State {
}

enum SearchMode {
    /** Use if the user does something like `👎>` i.e. invalid mode key */
    Unknown,
    File,
    Command,
    Project,
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
    mode: SearchMode = SearchMode.File;

    searchState = new SearchState();

    constructor(props: Props) {
        super(props);

        this.searchState.stateChanged.on(() => this.forceUpdate());

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
        commands.findFile.on(() => {
            console.log('find file');
            this.openOmniSearch();
        });
        commands.findCommand.on(() => {
            console.log('find command');
            this.openOmniSearch();
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
            // also keep the input in focus
            if (this.searchState.isShown) {
                (ReactDOM.findDOMNode(this.refs.omniSearchInput) as HTMLInputElement).focus();
            }
        });
    }

    render() {
        let renderedResults: JSX.Element[] = this.searchState.renderResults();

        return <Modal
              isOpen={this.searchState.isShown}
              onRequestClose={this.searchState.closeOmniSearch}>
                <div style={[csx.vertical]}>
                    <div style={[csx.horizontal,csx.center]}>
                        <h4 style={{marginTop:'1rem', marginBottom: '1rem'} as any}>Omni Search <Icon name="search"/></h4>
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
        this.searchState.openOmniSearch();
    };
    onChangeFilter = debounce((e)=>{
        let filterValue = (ReactDOM.findDOMNode(this.refs.omniSearchInput) as HTMLInputElement).value;
        this.searchState.newValue(filterValue);
    },50);
    incrementSelected = debounce(() => {
        this.searchState.incrementSelected();
    }, 0, true);
    decrementSelected = debounce(() => {
        this.searchState.decrementSelected();
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
            this.searchState.choseIndex(this.searchState.selectedIndex);
        }
    };

}


/**
 * Omni search has a lot of UI work (debouncing and whatnot) in it,
 * don't want to sprinkel in all the MODE selection stuff in there as well
 * So ... created this class
 * Responsible for taking user input > parsing it and then > returning the rendered search results
 * Also maintains the selected index within the search results and takes approriate action if user commits to it
 */
class SearchState {
    /**
     * Current raw user input value
     */
    rawFilterValue: string;
    parsedFilterValue: string;

    /**
     * Various search lists
     */
    filePaths: string [] = [];
    availableProjects: ActiveProjectConfigDetails[] = [];

    /** Modes can use this to store their results */
    filteredValues:any[] = [];

    /**
     * Current mode
     */
    mode: SearchMode = SearchMode.File;
    _modeMap: { [key: string]: SearchMode } = {
        'f': SearchMode.File,
        'c': SearchMode.Command,
        'p': SearchMode.Project,
    };

    /**
     * showing search results
     */
    isShown: boolean = false;

    /**
     * The currently selected search result
     */
    selectedIndex: number = 0;

    /**
     * if there are new search results the user might care about, or user selection changed or whatever
     */
    stateChanged = new TypedEvent<{} >( );

    /** for performance reasons */
    maxShowCount = 15;

    constructor() {
        server.filePaths({}).then((res) => {
            this.filePaths = res.filePaths;
            this._updateIfUserIsSearching(SearchMode.File);
        });

        cast.filePathsUpdated.on((update) => {
            console.log(update);
            this.filePaths = update.filePaths;
            this._updateIfUserIsSearching(SearchMode.File);
        });

        commands.esc.on(()=>{
            this.closeOmniSearch();
        });

        server.availableProjects({}).then(res => {
            this.availableProjects = res;
        });

        cast.availableProjectsUpdated.on(res => {
            this.availableProjects = res;
        });
    }

    private _updateIfUserIsSearching(mode:SearchMode){
        if (this.mode == mode && this.isShown){
            this.stateChanged.emit({});
        }
    }

    renderResults(): JSX.Element[] {
        let renderedResults: JSX.Element[] = [];
        if (this.mode == SearchMode.File){
            let fileList: string[] = this.filteredValues;
            let fileListRendered = fileList.map((filePath, i) => {

                // Create rendered
                let renderedPath = renderMatchedSegments(filePath,this.rawFilterValue);
                let renderedFileName = renderMatchedSegments(getFileName(filePath), this.rawFilterValue);
                let rendered = <div>
                    <div>{renderedFileName}</div>
                    {renderedPath}
                </div>;

                return this._wrapRenderedItemForSelection(rendered, i)
            });
            renderedResults = fileListRendered;
        }

        if (this.mode == SearchMode.Project){
            let filteredProjects: ActiveProjectConfigDetails[] = this.filteredValues;
        }

        return renderedResults;
    }

    private _wrapRenderedItemForSelection(rendered: JSX.Element, index: number): JSX.Element {
        let selected = this.selectedIndex === index;
        let style = selected ? selectedStyle : {};
        let ref = selected && "selected";

        return (
            <div key={index} style={[style,styles.padded2,styles.hand, listItemStyle]} onClick={()=>this.choseIndex(index)} ref={ref}>
                {rendered}
            </div>
        );
    }

    choseIndex = (index:number) => {
        if (this.mode == SearchMode.File){
            let filePath = this.filteredValues[index];
            if (filePath) {
                commands.doOpenFile.emit({ filePath: filePath });
            }
        }
        this.closeOmniSearch();
    }

    newValue(value:string){
        this.rawFilterValue = value;

        // Parse the query to see what type it is
        this.parsedFilterValue = ''
        let trimmed = value.trim();
        if (trimmed.length > 2 && trimmed[1] == '>') {
            let mode = this._modeMap[trimmed[0]];
            if (!mode){
                this.mode = SearchMode.Unknown
                return;
            }
            else {
                this.mode = mode;
                this.parsedFilterValue = trimmed.substr(2);
            }
        }
        else { // if not explicit fall back to file
            this.mode = SearchMode.File;
        }

        if (this.mode == SearchMode.File){
            this.filteredValues = fuzzyFilter(this.filePaths, value);
            this.filteredValues = this.filteredValues.slice(0,this.maxShowCount);
        }

        if (this.mode == SearchMode.Project){
            this.filteredValues = getFilteredItems<ActiveProjectConfigDetails>({ items: this.availableProjects, textify: (p) => p.name, filterValue: this.parsedFilterValue });
        }

        this.selectedIndex = 0;
        this.stateChanged.emit({});
    }

    incrementSelected = () => {
        this.selectedIndex = rangeLimited({ num: this.selectedIndex + 1, min: 0, max: this.filteredValues.length - 1, loopAround: true });
        this.stateChanged.emit({});
    }

    decrementSelected = () => {
        this.selectedIndex = rangeLimited({ num: this.selectedIndex - 1, min: 0, max: this.filteredValues.length - 1, loopAround: true });
        this.stateChanged.emit({});
    }

    openOmniSearch = () => {
        this.isShown = true;
        this.stateChanged.emit({});
    }

    closeOmniSearch = () => {
        this.isShown = false;
        this.rawFilterValue = '';
        this.stateChanged.emit({});
    };
}

/** TODO: This exits to make creating new modes easier 🌹 */
// interface OmniSearchModeImplementation<T>{
//     /**
//      * config stuff
//      */
//     mode: Mode,
//     maxShowCount: number;
//
//     /**
//      * User searching stuff
//      */
//     newValue(value: string);
//     totalResultsNumber(): number;
//
//     /**
//      * Render
//      */
//     renderResults(): JSX.Element[];
//
//     /**
//      * Finally chose
//      */
//     choseIndex(index: number): void;
// }
