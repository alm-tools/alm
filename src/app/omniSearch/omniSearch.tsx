import React = require("react");
import ReactDOM = require("react-dom");
import * as csx from '../base/csx';
import {BaseComponent} from "../ui";
import * as ui from "../ui";
import Modal = require('react-modal');
import * as styles from "../styles/themes/current/base";
import {debounce,createMap,rangeLimited,getFileName} from "../../common/utils";
import {cast, server, Types} from "../../socket/socketClient";
import * as commands from "../commands/commands";
import {match, filter as fuzzyFilter} from "fuzzaldrin";
import {Icon} from "../components/icon";
import {TypedEvent} from "../../common/events";
import * as state from "../state/state";
import * as types from "../../common/types";
import {AvailableProjectConfig} from "../../common/types";
import {Robocop} from "../components/robocop";
import * as utils from "../../common/utils";
import {tabState} from "../tabs/v2/appTabsContainer";
import * as typestyle from "typestyle";

const inputClassName = typestyle.style(styles.modal.inputStyleBase);

/** Stuff shared by the select list view */
import {renderMatchedSegments, getFilteredItems} from ".././selectListView";

export interface Props {
}
export interface State {
}

enum SearchMode {
    /**
     * Use if the user does something like `👎>` i.e. invalid mode key
     * This is also used to search for a mode
     */
    Unknown,
    File,
    Command,
    Project,
    Symbol,
    FilesInProject,
}

let selectedStyle = {
    background: '#545454',
    color: 'white'
};
let listItemStyle = {
    fontFamily: 'monospace',
    boxSizing: 'content-box' /** Otherwise the items don't expand to encapsulate children */
};

let searchingNameStyle = { marginTop: '0px', marginBottom: '0px', marginLeft: '10px', border: '1px solid grey', padding: '4px 4px', background: 'black' };

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
        commands.omniProjectSourcefile.on(() => {
            this.searchState.openOmniSearch(SearchMode.FilesInProject);
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
                <div style={csx.extend(csx.vertical, csx.flex)}>
                    <div style={csx.extend(csx.content, csx.horizontal,csx.center)}>
                        <h4 style={{marginTop:'1rem', marginBottom: '1rem'}}>Omni Search <Icon name="search"/></h4>
                        {searchingName ? <h5  style={searchingNameStyle}>{searchingName}</h5> : ''}
                        <div style={csx.flex}></div>
                        <div style={{fontSize:'0.9rem', color:'grey'}}><code style={styles.modal.keyStrokeStyle}>Esc</code> to exit <code style={styles.modal.keyStrokeStyle}>Enter</code> to select</div>
                    </div>

                    <div style={csx.extend(csx.content, styles.padded1TopBottom,csx.vertical)}>
                        <input
                            defaultValue={this.searchState.rawFilterValue}
                            className={inputClassName}
                            type="text"
                            ref="omniSearchInput"
                            placeholder="Filter"
                            onChange={this.onChangeFilter}
                            onKeyDown={this.onChangeSelected}
                        />
                    </div>

                    {this.searchState.optionalMessage()}

                    <div ref="searchScroll" className="scrollContainer" style={csx.extend(csx.vertical,csx.flex,{overflow:'auto'})}>
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
    keyboardShortcut: string;
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
    /** filepath */
    filePaths: string [] = [];
    filePathsCompleted: boolean = false;
    /** project */
    availableProjects: AvailableProjectConfig[] = [];
    /** commands */
    commands = commands.commandRegistry;
    /** symols */
    symbols: types.NavigateToItem[] = [];
    /** source code files */
    filesPathsInProject: string[] = [];

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
                searchingName: "Files",
                keyboardShortcut: commands.omniFindFile.config.keyboardShortcut
            },
            {
                mode: SearchMode.Command,
                description: 'Search for a Command',
                shortcut: 'c',
                searchingName: "Commands",
                keyboardShortcut: commands.omniFindCommand.config.keyboardShortcut
            },
            {
                mode: SearchMode.Project,
                description: 'Search for a TypeScript Project to work on',
                shortcut: 'p',
                searchingName: "Projects",
                keyboardShortcut: commands.omniSelectProject.config.keyboardShortcut
            },
            {
                mode: SearchMode.Symbol,
                description: 'Search for Symbols (Hieroglyphs) in active project',
                shortcut: 'h',
                searchingName: "Symbols",
                keyboardShortcut: commands.omniProjectSymbols.config.keyboardShortcut
            },
            {
                mode: SearchMode.FilesInProject,
                description: 'Search for TypeScript file in active project',
                shortcut: 't',
                searchingName: "Files In Project",
                keyboardShortcut: commands.omniProjectSourcefile.config.keyboardShortcut
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
                let queryFilePath = utils.getFilePathLine(this.parsedFilterValue).filePath;
                let renderedPath = renderMatchedSegments(filePath, queryFilePath);
                let renderedFileName = renderMatchedSegments(getFileName(filePath), queryFilePath);
                return (
                    <div>
                        <div>{renderedFileName}</div>
                        {renderedPath}
                    </div>
                );
            });
        }

        if (this.mode == SearchMode.FilesInProject){
            let fileList: string[] = this.filteredValues;
            renderedResults = this.createRenderedForList(fileList,(filePath)=>{
                // Create rendered
                let queryFilePath = utils.getFilePathLine(this.parsedFilterValue).filePath;
                let renderedPath = renderMatchedSegments(filePath, queryFilePath);
                let renderedFileName = renderMatchedSegments(getFileName(filePath), queryFilePath);
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
            let filteredProjects: AvailableProjectConfig[] = this.filteredValues;
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
            let filtered: types.NavigateToItem[] = this.filteredValues;
            renderedResults = this.createRenderedForList(filtered,(symbol)=>{
                // Create rendered
                // NOTE: Code duplicated in `gotoTypeScriptSymbol.tsx`
                let matched = renderMatchedSegments(symbol.name,this.parsedFilterValue);
                const color = ui.kindToColor(symbol.kind);
                const icon = ui.kindToIcon(symbol.kind);
                return (
                    <div>
                        <div style={csx.horizontal}>
                            <span>{matched}</span>
                            <span style={csx.flex}></span>
                            <strong style={{color}}>{symbol.kind}</strong>
                            &nbsp;
                            <span style={csx.extend({color, fontFamily:'FontAwesome'})}>{icon}</span>
                        </div>
                        <div>{symbol.fileName}:{symbol.position.line+1}</div>
                    </div>
                );
            });
        }

        if (this.mode == SearchMode.Unknown) {
            let filtered: SearchModeDescription[] = this.filteredValues;
            renderedResults = this.createRenderedForList(filtered,(modeDescription)=>{
                // Create rendered
                let matched = renderMatchedSegments(modeDescription.description, this.parsedFilterValue);
                return (
                    <div style={csx.extend(csx.horizontal)}>
                        <div>
                            {modeDescription.shortcut}{'>'} {matched}
                        </div>

                        <span style={csx.flex}></span>
                        <div style={commandKeyStrokeStyle}>{commandShortcutToDisplayName(modeDescription.keyboardShortcut)}</div>
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
                <div style={csx.content}>
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
            let {line} = utils.getFilePathLine(this.parsedFilterValue);
            if (filePath) {
                commands.doOpenFile.emit({ filePath: filePath, position: { line: line, ch: 0 } });
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
            let activeProject: AvailableProjectConfig = this.filteredValues[index];
            if (activeProject) {
                server.setActiveProjectConfigDetails(activeProject);
                state.setActiveProject(activeProject);
                state.setFilePathsInActiveProject([]);
            }
            this.closeOmniSearch();
            return;
        }

        if (this.mode == SearchMode.Symbol) {
            let symbol: types.NavigateToItem = this.filteredValues[index];
            if (symbol) {
                commands.doOpenOrFocusFile.emit({ filePath: symbol.filePath, position: symbol.position });
            }
            this.closeOmniSearch();
            return;
        }

        if (this.mode == SearchMode.FilesInProject) {
            let filePath = this.filteredValues[index];
            let {line} = utils.getFilePathLine(this.parsedFilterValue);
            if (filePath) {
                commands.doOpenFile.emit({ filePath: filePath, position: { line: line, ch: 0 } });
            }
            this.closeOmniSearch();
            return;
        }
    }

    /** Mode */
    /** This is the heart of the processing .. ensuring state consistency */
    newValue(value:string, wasShownBefore = true, modeChanged = false){
        this.rawFilterValue = value;
        let oldMode = this.mode;

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

        modeChanged = modeChanged || this.mode !== oldMode;
        let modeChangedOrJustOpened = modeChanged || !wasShownBefore;

        let potentiallyRefreshModeData =  modeChangedOrJustOpened ?
            this.refreshModeData() : Promise.resolve({});

        potentiallyRefreshModeData.then(()=>{
            if (this.mode == SearchMode.Unknown) {
                this.filteredValues = this.parsedFilterValue
                    ? getFilteredItems<SearchModeDescription>({ items: this.modeDescriptions, textify: (c) => c.description, filterValue: this.parsedFilterValue })
                    : this.modeDescriptions;
            }

            if (this.mode == SearchMode.File) {
                let {filePath} = utils.getFilePathLine(this.parsedFilterValue);
                this.filteredValues = fuzzyFilter(this.filePaths, filePath);
                this.filteredValues = this.filteredValues.slice(0,this.maxShowCount);
            }

            if (this.mode == SearchMode.FilesInProject) {
                let {filePath} = utils.getFilePathLine(this.parsedFilterValue);
                this.filteredValues = fuzzyFilter(this.filesPathsInProject, filePath);
            }

            if (this.mode == SearchMode.Command) {
                this.filteredValues = this.parsedFilterValue
                    ? getFilteredItems<commands.UICommand>({ items: this.commands, textify: (c) => c.config.description, filterValue: this.parsedFilterValue })
                    : this.commands;
            }

            if (this.mode == SearchMode.Project) {
                // only add a virtual project if the active file path is a .ts or .js file that isn't in active project
                const availableProjects = this.availableProjects.slice();
                let tab = tabState.getSelectedTab();
                let filePath = tab && utils.getFilePathFromUrl(tab.url);
                if (filePath
                    && utils.isJsOrTs(filePath)
                    && !state.inActiveProjectUrl(tab.url)) {
                    availableProjects.unshift({
                        name: "Virtual: " + utils.getFileName(filePath),
                        isVirtual: true,
                        tsconfigFilePath: filePath
                    });
                }

                this.filteredValues = this.parsedFilterValue
                    ? getFilteredItems<AvailableProjectConfig>({ items: availableProjects, textify: (p) => p.name, filterValue: this.parsedFilterValue })
                    : availableProjects;
            }

            if (this.mode == SearchMode.Symbol) {
                this.filteredValues = this.parsedFilterValue
                    ? getFilteredItems<types.NavigateToItem>({ items: this.symbols, textify: (p) => p.name, filterValue: this.parsedFilterValue })
                    : this.symbols;
                this.filteredValues = this.filteredValues.slice(0,this.maxShowCount);
            }

            this.selectedIndex = 0;

            this.stateChanged.emit({});
            if (modeChangedOrJustOpened){
                this.setParentUiRawFilterValue(this.rawFilterValue);
            }
        });
    }

    /** Mode */
    openOmniSearch = (mode: SearchMode) => {
        let wasAlreadyShown = this.isShown;
        this.isShown = true;

        let oldMode = this.mode;
        let oldRawFilterValue = this.rawFilterValue;

        this.mode = mode;
        let description = this.modeDescriptions.filter(x=>x.mode == mode)[0];
        this.rawFilterValue = description?description.shortcut+'>':'';

        // If already shown would be nice to preserve current user input
        // And if the new mode is different
        // And if the new mode is not *search* search mode
        if (wasAlreadyShown && oldMode !== this.mode && oldMode !== SearchMode.Unknown) {
            this.rawFilterValue = this.rawFilterValue + oldRawFilterValue.trim().substr(2);
        }

        this.newValue(this.rawFilterValue, wasAlreadyShown, oldMode !== this.mode);
    }

    /** Mode */
    refreshModeData(): Promise<any> {
        // If the new mode requires a search we do that here
        if (this.mode == SearchMode.Symbol) {
            return server.getNavigateToItems({}).then((res) => {
                this.symbols = res.items;
            });
        }

        if (this.mode == SearchMode.FilesInProject) {
            this.filesPathsInProject = state.getState().filePathsInActiveProject;
        }

        return Promise.resolve();
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
                <div key={index} style={csx.extend(style, styles.padded2, styles.hand, listItemStyle)} onClick={() => this.choseIndex(index) } ref={ref}>
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
