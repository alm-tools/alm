import * as React from "react";
import {BaseComponent, RaisedButton, AppBar, MenuItem, LeftNav, TextField, Dialog, FlatButton} from "./ui";
import * as ui from "./ui";
import * as csx from "csx";
import {TabsContainer} from "./tabs/tabsContainer";
import * as commands from "./commands/commands";
var Modal = require('react-modal');
import * as styles from "./styles/styles";
import {getAllFiles,cast} from "./socket/socketClient";
import {match, filter as fuzzyFilter} from "fuzzaldrin";
import {debounce,createMap} from "../common/utils";

let menuItems = [
    { route: 'get-started', text: 'Get Started' },
    { route: 'customization', text: 'Customization' },
    { route: 'components', text: 'Components' },
    { type: MenuItem.Types.SUBHEADER, text: 'Resources' },
    {
        type: MenuItem.Types.LINK,
        payload: 'https://github.com/basarat/ped',
        text: 'GitHub'
    },
];

export interface State {
    isOmniSearchOpen?: boolean;
    fileList?: string[];
    filterValue?: string;
}

@ui.Radium
export class Root extends BaseComponent<{}, State>{

    constructor(props: {}) {
        super(props);

        this.state = {
            filterValue: '',
            fileList : []
        };
    }

    refs: {
        [string: string]: any;
        leftNav: any;
        omniSearch: any;
        omniSearchInput: any;
    }

    toggle = () => {
        this.refs.leftNav.toggle();
    }

    componentDidMount() {
        getAllFiles({}).then((res) => {
            this.setState({fileList:res.fileList});
        });
        
        cast.fileListUpdated.on((update)=>{
            console.log(update);
            this.setState({fileList:update.fileList});
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
        
        let OmniSearchPanelActions = [
            <FlatButton
            label="Close"
            primary={true}
            onTouchTap={this.closeOmniSearch} />
        ];
        
        let fileList = this.state.fileList;
        fileList = fuzzyFilter(fileList, this.state.filterValue);
        fileList = fileList.slice(0,50);
        let fileListRendered = fileList.map(result => highlightMatch(result, this.state.filterValue));
        
        return <div>
                {
                //     <AppBar
                //     title="TypeScript Builder"
                //     iconClassNameRight="muidocs-icon-navigation-expand-more"
                //     onLeftIconButtonTouchTap={this.toggle}
                // />
                }
                <LeftNav ref="leftNav" docked={false} menuItems={menuItems} />
                
                <Modal
                      isOpen={this.state.isOmniSearchOpen}
                      onRequestClose={this.closeOmniSearch}>
                        <div style={[csx.vertical]}>
                            <div style={[csx.horizontal]}>
                                <h4>Omni Search</h4>
                                <div style={[csx.flex]}></div>
                                <div style={[styles.userTip]}>Press <code style={styles.keyStroke}>esc</code> to close</div>
                            </div>
                          
                            <TextField 
                                ref="omniSearchInput" 
                                floatingLabelText="Filter"
                                onChange={this.onChangeFilter}
                            />
                            
                            <div style={[csx.vertical,csx.flex,{overflow:'auto'}]}>
                                <div style={[csx.vertical]}>
                                    {fileListRendered}
                                 </div>
                                
                            </div>
                        </div>
                </Modal>

                <TabsContainer/>
            </div>;
    }
    
    openOmniSearch = () => {
        this.setState({ isOmniSearchOpen: true });
        this.refs.omniSearchInput.focus();
    };
    closeOmniSearch = ()=>{
        this.setState({ isOmniSearchOpen: false, filterValue: '' });
    };
    onChangeFilter = debounce((e)=>{
        this.setState({ filterValue: this.refs.omniSearchInput.getValue() });
    },50);
}


/** 
 * Based on https://github.com/atom/fuzzy-finder/blob/51f1f2415ecbfab785596825a011c1d2fa2658d3/lib/fuzzy-finder-view.coffee#L56-L74
 */
function highlightMatch(result: string, query: string): JSX.Element {
    let matches = match(result, query);
    let matchMap = createMap(matches);
    // TODO: collapse contiguous sections into a single `<strong>`
    let rendered = result.split('').map((c,i)=> {
        if (!matchMap[i]){
            return c;
        }
        else {
            return <strong>{c}</strong>
        }
    });
    return (
        <div key={result}>
            {rendered}
        </div>
    );
}