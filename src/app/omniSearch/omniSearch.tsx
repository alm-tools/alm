import React = require("react");
import ReactDOM = require("react-dom");
import Radium = require('radium');
import csx = require('csx');
import {BaseComponent} from "../ui";
import * as ui from "../ui";
import Modal = require('react-modal');
import * as styles from "../styles/styles";
import {debounce,createMap,rangeLimited,getFileName} from "../../common/utils";
import {cast, server, Types} from "../../socket/socketClient";
import * as commands from "../commands/commands";
import {match, filter as fuzzyFilter} from "fuzzaldrin";
import {Icon} from "../icon";
import {TypedEvent} from "../../common/events";
import * as state from "../state/state";
import * as types from "../../common/types";
import * as CodeMirror from "codemirror";
import {Robocop} from "../robocop";

/** Stuff shared by the select list view */
import {renderMatchedSegments, getFilteredItems} from ".././selectListView";

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
    Symbol,
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

        searchScroll: Element;
        selected: Element;
    }

    componentDidMount() {
        commands.omniFindFile.on(() => {
            this.searchState.openOmniSearch(SearchMode.File);
        });
        commands.omniFindCommand.on(() => {
            this.searchState.openOmniSearch(SearchMode.Command);
        });
        commands.omniSelectProject.on(() => {
            this.searchState.openOmniSearch(SearchMode.Project);
        });
        commands.omniProjectSymbols.on(() => {
            this.searchState.openOmniSearch(SearchMode.Symbol);
        });
    }

    wasShown = false;
    componentWillUpdate(){
        this.wasShown = this.searchState.isShown;
    }

    componentDidUpdate() {
        // get the dom node that is selected
        // make sure its parent scrolls to make this visible
        setTimeout(()=>{
            if (this.refs.selected) {
                let selected = this.refs.selected as HTMLDivElement;
                let searchScroll = this.refs.selected as HTMLDivElement;
                selected.scrollIntoViewIfNeeded(false);
            }
            // also keep the input in focus
            if (this.searchState.isShown) {
                let input = this.refs.omniSearchInput as HTMLInputElement
                input.focus();

                // and scroll to the end if its just been shown
                if (!this.wasShown){
                    let len = input.value.length;
                    input.setSelectionRange(len, len);
                    this.wasShown = true;
                }
            }
        });
    }

    render() {
        let renderedResults: JSX.Element[] = this.searchState.renderResults();
        let searchingName = this.searchState.getSearchingName();

        return <Modal
              isOpen={this.searchState.isShown}
              onRequestClose={this.searchState.closeOmniSearch}>
                <div style={[csx.vertical, csx.flex]}>
                    <div style={[csx.horizontal,csx.center]}>
                        <h4 style={{marginTop:'1rem', marginBottom: '1rem'} as any}>Omni Search <Icon name="search"/></h4>
                        {searchingName ? <h5  style={searchingNameStyle}>{searchingName}</h5> : ''}
                        <div style={[csx.flex]}></div>
                        <div style={{fontSize:'0.9rem', color:'grey'} as any}><code style={styles.modal.keyStrokeStyle}>Esc</code> to exit <code style={styles.modal.keyStrokeStyle}>Enter</code> to select</div>
                    </div>

                    <div style={[styles.padded1TopBottom,csx.vertical]}>
                        <input
                            defaultValue={this.searchState.rawFilterValue}
                            style={styles.modal.inputStyle}
                            type="text"
                            ref="omniSearchInput"
                            placeholder="Filter"
                            onChange={this.onChangeFilter}
                            onKeyDown={this.onChangeSelected}
                        />
                    </div>

                    {this.searchState.optionalMessage()}

                    <div ref="searchScroll" className="scrollContainer" style={[csx.vertical,csx.flex,{overflow:'auto'}]}>
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
    onChangeSelected = (event) => {
        let keyStates = ui.getKeyStates(event);

        if (keyStates.up || keyStates.tabPrevious) {
            event.preventDefault();
            this.decrementSelected();
        }
        if (keyStates.down || keyStates.tabNext) {
            event.preventDefault();
            this.incrementSelected();
        }
        if (keyStates.enter) {
            event.preventDefault();
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
 *
 * functions marched with "mode" contain mode specific logic
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
    filePaths: string [] = []; filePathsCompleted: boolean = false;
    availableProjects: ActiveProjectConfigDetails[] = [];
    commands = commands.commandRegistry;
    symbols: Types.NavigateToItem[] = [];

    /** Modes can use this to store their results */
    filteredValues:any[] = [];

    /**
     * Current mode
     */
    mode: SearchMode = SearchMode.File;
    modeDescriptions: SearchModeDescription[] = []; // set in ctor
    modeMap: { [key: string]: SearchMode } = {}; // set in ctor

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
    maxShowCount = 20;

    constructor() {
        commands.esc.on(()=>{
            this.closeOmniSearch();
        });

        this.filePaths = state.getState().filePaths.filter(fp=> fp.type == types.FilePathType.File).map(fp=> fp.filePath);
        state.subscribeSub(state=> state.filePaths, (filePaths) => {
            this.filePaths = filePaths.filter(fp=> fp.type == types.FilePathType.File).map(fp=> fp.filePath);
            this.updateIfUserIsSearching(SearchMode.File);
        });
        this.filePathsCompleted = state.getState().filePathsCompleted;
        state.subscribeSub(state=> state.filePathsCompleted, (filePathsCompleted) => {
            this.filePathsCompleted = filePathsCompleted;
            this.updateIfUserIsSearching(SearchMode.File);
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
            },
            {
                mode: SearchMode.Symbol,
                description: 'Search for sYmbols in active project',
                shortcut: 'y',
                searchingName: "Symbols"
            }
        ];

        // setup mode map
        this.modeDescriptions.forEach(md => this.modeMap[md.shortcut] = md.mode);
    }

    /** Mode */
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

        if (this.mode == SearchMode.Command){
            let filtered: commands.UICommand[] = this.filteredValues;
            renderedResults = this.createRenderedForList(filtered,(command)=>{
                // Create rendered
                let matched = renderMatchedSegments(command.config.description,this.parsedFilterValue);
                return (
                    <div style={csx.horizontal}>
                        <span>{matched}</span>
                        <span style={csx.flex}></span>
                        {command.config.keyboardShortcut &&
                            <div style={commandKeyStrokeStyle}>{commandShortcutToDisplayName(command.config.keyboardShortcut)}</div>}
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

        if (this.mode == SearchMode.Symbol){
            let filtered: Types.NavigateToItem[] = this.filteredValues;
            renderedResults = this.createRenderedForList(filtered,(symbol)=>{
                // Create rendered
                let matched = renderMatchedSegments(symbol.name,this.parsedFilterValue);
                return (
                    <div>
                        <div style={csx.horizontal}>
                            <span>{matched}</span>
                            <span style={csx.flex}></span>
                            <strong style={{color:ui.kindToColor(symbol.kind)} as any}>{symbol.kind}</strong>
                        </div>
                        <div>{symbol.fileName}:{symbol.position.line+1}</div>
                    </div>
                );
            });
        }

        if (this.mode == SearchMode.Unknown){
            let filtered: SearchModeDescription[] = this.filteredValues;
            renderedResults = this.createRenderedForList(filtered,(modeDescription)=>{
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

    /** Mode */
    optionalMessage(): JSX.Element {
        if (this.mode == SearchMode.File && !this.filePathsCompleted){
            let messageStyle = {
                fontSize: '.6rem',
                textAlign: 'center',
                background: '#333',
                color: "#ddd",
                padding: '5px',
                fontWeight: 'bold',
                boxShadow: 'inset 0 0 6px black',
            };
            return (
                <div>
                    <div style={messageStyle}>Indexing ({this.filePaths.length})</div>
                    <Robocop/>
                </div>
            );
        }

        return null;
    }

    /** Mode */
    choseIndex = (index: number) => {
        if (this.mode == SearchMode.Unknown) {
            let modeDescription: SearchModeDescription = this.filteredValues[index];
            this.rawFilterValue = modeDescription.shortcut + '>';
            this.newValue(this.rawFilterValue);
            this.setParentUiRawFilterValue(this.rawFilterValue);
            return;
        }

        if (this.mode == SearchMode.File) {
            let filePath = this.filteredValues[index];
            if (filePath) {
                commands.doOpenFile.emit({ filePath: filePath });
            }
            this.closeOmniSearch();
            return;
        }

        if (this.mode == SearchMode.Command) {
            let command: commands.UICommand = this.filteredValues[index];
            if (command) {
                command.emit({});
            }
            if (command !== commands.omniFindFile
                && command !== commands.omniFindCommand
                && command !== commands.omniSelectProject) {
                this.closeOmniSearch();
            }
            return;
        }

        if (this.mode == SearchMode.Project) {
            let activeProject: ActiveProjectConfigDetails = this.filteredValues[index];
            if (activeProject) {
                server.setActiveProjectConfigDetails(activeProject);
                state.setActiveProject(activeProject);
                state.setFilePathsInActiveProject([]);
            }
            this.closeOmniSearch();
            return;
        }

        if (this.mode == SearchMode.Symbol) {
            let symbol: Types.NavigateToItem = this.filteredValues[index];
            if (symbol) {
                commands.doOpenOrFocusFile.emit({ filePath: symbol.filePath, position: symbol.position });
            }
            this.closeOmniSearch();
            return;
        }
    }

    /** Mode */
    newValue(value:string){
        this.rawFilterValue = value;

        // Parse the query to see what type it is
        this.parsedFilterValue = ''
        let trimmed = value.trim();
        if (trimmed.length > 1 && trimmed[1] == '>') {
            let mode = this.modeMap[trimmed[0]];
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
            this.filteredValues = this.parsedFilterValue
                ? getFilteredItems<SearchModeDescription>({ items: this.modeDescriptions, textify: (c) => c.description, filterValue: this.parsedFilterValue })
                : this.modeDescriptions;
        }

        if (this.mode == SearchMode.File) {
            this.filteredValues = fuzzyFilter(this.filePaths, this.parsedFilterValue);
            this.filteredValues = this.filteredValues.slice(0,this.maxShowCount);
        }

        if (this.mode == SearchMode.Command) {
            this.filteredValues = this.parsedFilterValue
                ? getFilteredItems<commands.UICommand>({ items: this.commands, textify: (c) => c.config.description, filterValue: this.parsedFilterValue })
                : this.commands;
        }

        if (this.mode == SearchMode.Project) {
            this.filteredValues = this.parsedFilterValue
                ? getFilteredItems<ActiveProjectConfigDetails>({ items: this.availableProjects, textify: (p) => p.name, filterValue: this.parsedFilterValue })
                : this.availableProjects;
        }

        if (this.mode == SearchMode.Symbol) {
            this.filteredValues = this.parsedFilterValue
                ? getFilteredItems<Types.NavigateToItem>({ items: this.symbols, textify: (p) => p.name, filterValue: this.parsedFilterValue })
                : this.symbols;
            this.filteredValues = this.filteredValues.slice(0,this.maxShowCount);
        }

        this.selectedIndex = 0;
        this.stateChanged.emit({});
    }

    /** Mode */
    openOmniSearch = (mode: SearchMode) => {
        let oldMode = this.mode;
        let oldRawFilterValue = this.rawFilterValue;

        this.mode = mode;
        let description = this.modeDescriptions.filter(x=>x.mode == mode)[0];
        this.rawFilterValue = description?description.shortcut+'>':'';

        // If already shown would be nice to preserve current user input
        // And if the new mode is different
        // And if the new mode is not *search* search mode
        if (this.isShown && oldMode !== this.mode && oldMode !== SearchMode.Unknown) {
            this.rawFilterValue = this.rawFilterValue + oldRawFilterValue.trim().substr(2);
        }

        let afterReady = () => {
            this.isShown = true;
            this.newValue(this.rawFilterValue);
            this.setParentUiRawFilterValue(this.rawFilterValue);
        }

        // If the new mode requires a search we do that here
        if (this.mode == SearchMode.Symbol){
            server.getNavigateToItems({}).then((res)=>{
                this.symbols = res.items;
                afterReady();
            });
        }
        else {
            afterReady();
        }
    }

    getSearchingName(): string {
        if (this.mode == SearchMode.Unknown){
            return 'Modes';
        }

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

    private updateIfUserIsSearching(mode:SearchMode){
        if (this.mode == mode && this.isShown){
            this.newValue(this.rawFilterValue);
        }
    }

    incrementSelected = () => {
        this.selectedIndex = rangeLimited({ num: this.selectedIndex + 1, min: 0, max: this.filteredValues.length - 1, loopAround: true });
        this.stateChanged.emit({});
    }

    decrementSelected = () => {
        this.selectedIndex = rangeLimited({ num: this.selectedIndex - 1, min: 0, max: this.filteredValues.length - 1, loopAround: true });
        this.stateChanged.emit({});
    }

    closeOmniSearch = () => {
        this.isShown = false;
        this.rawFilterValue = '';
        this.stateChanged.emit({});
    };
}

var commandKeyStrokeStyle = {
    fontSize: '.7rem',
    color: '#DDD',
    background: '#111',
    paddingLeft: '4px',
    paddingRight: '4px',
    border: '2px solid',
    borderRadius: '4px',
};

/** Utility function for command display */
function commandShortcutToDisplayName(shortcut: string): string {
    let basic = shortcut
        .replace(/mod/g,commands.modName)
        .replace(/alt/g,'Alt')
        .replace(/shift/g,'Shift');
    let onPlus = basic.split('+');
    onPlus[onPlus.length - 1] = onPlus[onPlus.length - 1].toUpperCase();
    return onPlus.join(' + ');
}
