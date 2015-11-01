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
import * as state from "../state/state";
import * as types from "../../common/types";

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
    backgroundColor: 'rgb(42,42,42)',
    color: 'white',
    outline: 'none',
    padding: '2px',
    fontSize: '1.5rem',
    lineHeight: '2rem',
    fontFamily: 'monospace',

    border: '3px solid #3C3C3C',
    transition: 'border .2s',
    ':focus':{
        boxShadow: '0px 0px 1px 1px #3C3C3C'
    }
}
let selectedStyle = {
    background: '#545454',
    color: 'white'
};
let listItemStyle = {
    fontFamily: 'monospace'
};

let searchingNameStyle = { marginTop: '0', marginBottom: '0', marginLeft: '10px', border: '1px solid grey', padding: '4px 4px', background: 'black' };


@ui.Radium
export class OmniSearch extends BaseComponent<Props, State>{
    mode: SearchMode = SearchMode.File;

    searchState = new SearchState();

    constructor(props: Props) {
        super(props);

        this.searchState.stateChanged.on(() => this.forceUpdate());
        this.searchState.setParentUiRawFilterValue = (value) => {
            this.setRawFilterValue(value);
        };

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
            this.searchState.openOmniSearch(SearchMode.File);
        });
        commands.findCommand.on(() => {
            this.searchState.openOmniSearch(SearchMode.Command);
        });
        commands.selectProject.on(() => {
            this.searchState.openOmniSearch(SearchMode.Project);
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
                let input = (ReactDOM.findDOMNode(this.refs.omniSearchInput) as HTMLInputElement)
                input.focus();
                let len = input.value.length;
                input.setSelectionRange(len, len)
            }
        });
    }

    render() {
        let renderedResults: JSX.Element[] = this.searchState.renderResults();
        let searchingName = this.searchState.getSearchingName();

        return <Modal
              isOpen={this.searchState.isShown}
              onRequestClose={this.searchState.closeOmniSearch}>
                <div style={[csx.vertical]}>
                    <div style={[csx.horizontal,csx.center]}>
                        <h4 style={{marginTop:'1rem', marginBottom: '1rem'} as any}>Omni Search <Icon name="search"/></h4>
                        {searchingName ? <h5  style={searchingNameStyle}>{searchingName}</h5> : ''}
                        <div style={[csx.flex]}></div>
                        <div style={{fontSize:'0.9rem', color:'grey'} as any}><code style={keyStrokeStyle}>Esc</code> to exit <code style={keyStrokeStyle}>Enter</code> to select</div>
                    </div>

                    <div style={[styles.padded1TopBottom,csx.vertical]}>
                        <input
                            defaultValue={this.searchState.rawFilterValue}
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

    setRawFilterValue = (value:string) => {
        // also scroll to the end of the input after loading
        let input = (ReactDOM.findDOMNode(this.refs.omniSearchInput) as HTMLInputElement)
        if (!input) return;
        input.value = value;
        let len = value.length;
        input.setSelectionRange(len, len)
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

interface SearchModeDescription {
    mode: SearchMode;
    description : string;
    searchingName: string;
    shortcut: string;
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
    rawFilterValue: string = '';
    parsedFilterValue: string = '';

    /**
     * Various search lists
     */
    modeDescriptions: SearchModeDescription[] = []; // set in ctor
    filePaths: string [] = [];
    availableProjects: ActiveProjectConfigDetails[] = [];

    /** Modes can use this to store their results */
    filteredValues:any[] = [];

    /**
     * Current mode
     */
    mode: SearchMode = SearchMode.File;
    _modeMap: { [key: string]: SearchMode } = {}; // set in ctor

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
    /** If we change the raw user value */
    setParentUiRawFilterValue = (rawFilterValue:string)=>null;

    /** for performance reasons */
    maxShowCount = 15;

    constructor() {
        commands.esc.on(()=>{
            this.closeOmniSearch();
        });

        server.filePaths({}).then((res) => {
            this.filePaths = res.filePaths;
            this._updateIfUserIsSearching(SearchMode.File);
        });
        cast.filePathsUpdated.on((update) => {
            console.log(update);
            this.filePaths = update.filePaths;
            this._updateIfUserIsSearching(SearchMode.File);
        });

        server.availableProjects({}).then(res => {
            this.availableProjects = res;
        });
        cast.availableProjectsUpdated.on(res => {
            this.availableProjects = res;
        });

        this.modeDescriptions = [
            {
                mode: SearchMode.File,
                description: 'Search for a File in the working directory',
                shortcut: 'f',
                searchingName: "Files"
            },
            {
                mode: SearchMode.Command,
                description: 'Search for a Command',
                shortcut: 'c',
                searchingName: "Commands"
            },
            {
                mode: SearchMode.Project,
                description: 'Search for a TypeScript Project to work on',
                shortcut: 'p',
                searchingName: "Projects"
            }
        ];

        // setup mode map
        this.modeDescriptions.forEach(md => this._modeMap[md.shortcut] = md.mode);
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
            renderedResults = this.createRenderedForList(fileList,(filePath)=>{
                // Create rendered
                let renderedPath = renderMatchedSegments(filePath,this.parsedFilterValue);
                let renderedFileName = renderMatchedSegments(getFileName(filePath), this.parsedFilterValue);
                return (
                    <div>
                        <div>{renderedFileName}</div>
                        {renderedPath}
                    </div>
                );
            });
        }

        if (this.mode == SearchMode.Project){
            let filteredProjects: ActiveProjectConfigDetails[] = this.filteredValues;
            renderedResults = this.createRenderedForList(filteredProjects,(project)=>{
                // Create rendered
                let matched = renderMatchedSegments(project.name,this.parsedFilterValue);
                return (
                    <div>
                        {matched}
                    </div>
                );
            });
        }

        if (this.mode == SearchMode.Unknown){
            // TODO: show a nice list of options ... and use that to drive the selection of that to set mode!
            renderedResults = this.createRenderedForList(this.modeDescriptions,(modeDescription)=>{
                // Create rendered
                return (
                    <div>
                        <div>{modeDescription.shortcut}{'>'}</div>
                        {modeDescription.description}
                    </div>
                );
            });
        }

        return renderedResults;
    }

    getSearchingName(): string {
        let description = this.modeDescriptions.filter(x=>x.mode == this.mode)[0];
        if (!description) return '';
        else return description.searchingName;
    }

    private createRenderedForList<T>(items: T[], itemToRender: (item: T) => JSX.Element): JSX.Element[] {
        return items.map((item, index) => {
            let rendered = itemToRender(item);
            let selected = this.selectedIndex === index;
            let style = selected ? selectedStyle : {};
            let ref = selected && "selected";

            return (
                <div key={index} style={[style, styles.padded2, styles.hand, listItemStyle]} onClick={() => this.choseIndex(index) } ref={ref}>
                    {rendered}
                </div>
            );
        });
    }

    choseIndex = (index:number) => {
        if (this.mode == SearchMode.Unknown){
            let modeDescription = this.modeDescriptions[index];
            this.rawFilterValue = modeDescription.shortcut+'>';
            this.newValue(this.rawFilterValue);
            this.setParentUiRawFilterValue(this.rawFilterValue);
            return;
        }

        if (this.mode == SearchMode.File){
            let filePath = this.filteredValues[index];
            if (filePath) {
                commands.doOpenFile.emit({ filePath: filePath });
            }
            this.closeOmniSearch();
            return;
        }

        if (this.mode == SearchMode.Project){
            let activeProject:ActiveProjectConfigDetails = this.filteredValues[index];
            if (activeProject) {
                server.setActiveProjectName({ name: activeProject.name });
                state.setActiveProject(activeProject.name);
                state.setInActiveProject(types.TriState.Unknown);
            }
            this.closeOmniSearch();
            return;
        }
    }

    newValue(value:string){
        this.rawFilterValue = value;

        // Parse the query to see what type it is
        this.parsedFilterValue = ''
        let trimmed = value.trim();
        if (trimmed.length > 1 && trimmed[1] == '>') {
            let mode = this._modeMap[trimmed[0]];
            if (!mode){
                this.mode = SearchMode.Unknown
                this.parsedFilterValue = trimmed;
            }
            else {
                this.mode = mode;
                this.parsedFilterValue = trimmed.substr(2);
            }
        }
        else { // if not explicit fall back to modes
            this.mode = SearchMode.Unknown;
            this.parsedFilterValue = trimmed;
        }


        if (this.mode == SearchMode.Unknown) {
            this.filteredValues = this.modeDescriptions;
        }

        if (this.mode == SearchMode.File) {
            this.filteredValues = fuzzyFilter(this.filePaths, this.parsedFilterValue);
            this.filteredValues = this.filteredValues.slice(0,this.maxShowCount);
        }

        if (this.mode == SearchMode.Project) {
            this.filteredValues = this.parsedFilterValue
                ? getFilteredItems<ActiveProjectConfigDetails>({ items: this.availableProjects, textify: (p) => p.name, filterValue: this.parsedFilterValue })
                : this.availableProjects;
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

    openOmniSearch = (mode: SearchMode) => {
        let oldMode = this.mode;
        let oldRawFilterValue = this.rawFilterValue;

        this.mode = mode;
        let description = this.modeDescriptions.filter(x=>x.mode == mode)[0];
        this.rawFilterValue = description?description.shortcut+'>':'';

        // If already shown would be nice to just change a few leading characters
        if (this.isShown && oldMode !== SearchMode.Unknown) {
            this.rawFilterValue = this.rawFilterValue + oldRawFilterValue.trim().substr(2);
        }

        this.isShown = true;
        this.newValue(this.rawFilterValue);
        this.setParentUiRawFilterValue(this.rawFilterValue);
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
