/**
 * Use this as a template for creating a new tab type
 */

/** imports */
import * as ui from "../../ui";
import * as csx from "../../base/csx";
import * as tab from "./tab";
import { server, cast } from "../../../socket/socketClient";
import * as utils from "../../../common/utils";
import * as styles from "../../styles/styles";
import * as ReactDOM from 'react-dom';
import * as React from 'react';
import * as types from '../../../common/types';
import * as gls from '../../base/gls';
import { style } from 'typestyle';
import { ButtonBlack } from "../../components/buttons";

export interface Props extends tab.TabProps {
}
export interface State {
    status: types.LiveDemoBundleResult
}

const startOfOutput = '--START--\n';

export class LiveDemoReactView extends ui.BaseComponent<Props, State> {
    output = startOfOutput;
    filePath = '';
    constructor(props: Props) {
        super(props);
        this.state = {
            status: {
                type: 'bundling'
            }
        };
        this.filePath = utils.getFilePathFromUrl(props.url);
    }
    componentDidMount() {
        server.enableLiveDemoReact({ filePath: this.filePath });
        this.disposible.add(
            cast.liveDemoBuildComplete.on((status) => {
                // console.log("reload"); // DEBUG
                this.setState({ status });
                if (status.type === 'success') {
                    this.reload();
                }
            })
        );

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

    iframe?: HTMLIFrameElement;

    render() {
        const type = this.state.status.type;
        const color = type === 'bundling'
            ? 'yellow'
            : type === 'success'
                ? '#0f0'
                : 'red';

        return (
            <div
                tabIndex={0}
                style={csx.extend(csx.vertical, csx.flex, csx.newLayerParent, styles.someChildWillScroll, { color: styles.textColor })}
                onKeyPress={this.handleKey}
                onFocus={this.props.onFocused}>
                <div className={style({ height: '30px' }, csx.horizontal, csx.content, csx.center as any, csx.Box.padding(5))}>
                    <div>
                        <svg height={"10px"} width={"10px"} viewBox="0 0 10 10" style={{
                            boxShadow: `0px 0px 28px 0px ${color}`
                        }}>
                            <circle fill={color} r={5} cx={5} cy={5} />
                        </svg>
                    </div>
                    <div style={{ color: '#999', marginLeft: '5px' }}>
                        {this.state.status.type}
                    </div>
                    <gls.Flex />
                    <ButtonBlack text="reload" onClick={this.reload} />
                </div>
                <iframe ref={ref => this.iframe = ref} src={this.getIframeUrl()} style={{
                    height: 'calc(100% - 30px)',
                    width: '100%',
                    border: 'none',
                    backgroundColor: 'white',
                }} />
            </div>
        );
    }

    private reload = () => {
        this.iframe && this.iframe.contentWindow.location.reload();
    }

    private getIframeUrl = () => {
        return `${window.location.protocol}//${window.location.hostname}:${window.location.port}${types.liveDemoMountUrl}/`;
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
