/**
 * Use this as a template for creating a new tab type
 */

/** imports */
import * as ui from "../../ui";
import * as csx from "../../base/csx";
import * as React from "react";
import * as tab from "./tab";
import { server, cast } from "../../../socket/socketClient";
import * as commands from "../../commands/commands";
import * as utils from "../../../common/utils";
import * as d3 from "d3";
import { Types } from "../../../socket/socketContract";
import * as types from "../../../common/types";
import { IconType } from "../../../common/types";
import * as $ from "jquery";
import * as styles from "../../styles/styles";
import * as onresize from "onresize";
import { Clipboard } from "../../components/clipboard";
import * as typeIcon from "../../components/typeIcon";
import * as gls from "../../base/gls";
import * as typestyle from "typestyle";
import { MarkDown } from "../../markdown/markdown";
import * as ReactDOM from 'react-dom';
import { Indicator } from '../../components/indicator';
import { style } from 'typestyle';

export interface Props extends tab.TabProps {
}
export interface State {
    status: 'running' | 'done' | 'error'
}

export class LiveDemoView extends ui.BaseComponent<Props, State> {
    output = '';
    filePath = '';
    constructor(props: Props) {
        super(props);
        this.state = {
            status: 'running'
        };
        this.filePath = utils.getFilePathFromUrl(props.url);
    }
    componentDidMount() {
        /**
         * Initial load + load on project change
         */
        server.enableLiveDemo({ filePath: this.filePath });
        this.disposible.add(
            cast.liveDemoData.on((data) => {
                if (data.type === 'start') {
                    this.output = '';
                    this.setState({ status: 'running' });
                }
                else if (data.type === 'data') {
                    this.output = this.output + data.data;
                    this.forceUpdate();
                }
                else if (data.type === 'end') {
                    this.setState({ status: !data.code ? 'done' : 'error' });
                }
                else {
                    const _ensure: never = data;
                }
            })
        );
        this.disposible.add(commands.ensureLiveDemoTab.on(({ filePath }) => {
            this.filePath = filePath;
            server.enableLiveDemo({ filePath });
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

    render() {
        const color = this.state.status === 'running'
            ? '#0f0'
            : this.state.status === 'done'
                ? '#999'
                /** Error */
                : 'red';


        return (
            <div
                tabIndex={0}
                style={csx.extend(csx.vertical, csx.flex, csx.newLayerParent, styles.someChildWillScroll, { color: styles.textColor })}
                onKeyPress={this.handleKey}
                onFocus={this.props.onFocused}>
                <div style={{ overflow: 'hidden', display: 'flex', padding: '10px', flexDirection: 'column', height: '100%' }}>
                    <div className={style({ height: '30px' }, csx.horizontal, csx.content, csx.center as any, csx.Box.padding(5))}>
                        <div>
                            <Indicator color={color} />
                        </div>
                        <div style={{ color: '#999', marginLeft: '10px' }}>
                            {this.state.status}
                        </div>
                    </div>
                    <pre style={{
                        overflow: 'auto',
                        display: 'flex',
                        flex: '1',
                        margin: '0px',
                        padding: '5px',
                        border: '1px solid #333',
                    }}>{this.output}</pre>
                </div>
            </div>
        );
    }

    handleKey = (e: any) => {
        let unicode = e.charCode;
        if (String.fromCharCode(unicode).toLowerCase() === "r") {

        }
    }

    filter = () => {
        // TODO:
    }

    /**
     * TAB implementation
     */
    resize = () => {
        // Not needed
    }

    focus = () => {
        (ReactDOM.findDOMNode(this) as any).focus();
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

        replaceNext: ({ newText }: { newText: string }) => {
        },

        replacePrevious: ({ newText }: { newText: string }) => {
        },

        replaceAll: ({ newText }: { newText: string }) => {
        }
    }
}
