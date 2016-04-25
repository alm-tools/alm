/**
 * This maintains the User interface Tabs for app,
 * e.g. selected tab, any handling of open tab requests etc.
 */

import * as ui from "../ui";
import * as React from "react";
import * as state from "../state/state";

import * as tab from "./tab";
import * as tabRegistry from "./tabRegistry";
import {Code} from "./codeTab";
import {DependencyView} from "./dependencyView";
import * as commands from "../commands/commands";
import * as utils from "../../common/utils";
import csx = require('csx');
import {createId} from "../../common/utils";
import * as constants from "../../common/constants";

import * as types from "../../common/types";
import {connect} from "react-redux";
import * as styles from "../styles/styles";
import {Tips} from "./tips";
import {Icon} from "../icon";
import {cast} from "../../socket/socketClient";
import * as alertOnLeave from "../utils/alertOnLeave";

/** Phosphor */
import {
  DockPanel
} from 'phosphor-dockpanel';

import {
  ResizeMessage, Widget
} from 'phosphor-widget';
require('./phosphorStyles.css')

/** Some more styles */
require('./appTabsContainerV2.css')


const getSessionId = () => window.location.hash.substr(1);
const setSessionId = (sessionId: string) => {
    const hash = '#' + sessionId;
    window.location.hash = hash;
    window.onhashchange = function() { window.location.hash = hash }
}

export interface Props {
    // redux connected below
    tabs?: state.TabInstance[];
    selectedTabIndex?: number;
}

export interface State {
}


/**
 * Create a placeholder content widget.
 */
function createContent(title: string): Widget {
  var widget = new Widget();
  widget.addClass('bas-content');
  widget.addClass(title.toLowerCase());

  widget.title.text = title;
  widget.title.closable = true;

  return widget;
}


export class AppTabsContainerV2 extends ui.BaseComponent<Props, State>{

    constructor(props: Props) {
        super(props);

        this.state = {
            selected: 0,
        };
    }

    componentDidMount() {
        var panel = new DockPanel();
        panel.id = 'main';

        panel.insertTabAfter(createContent('Red'));
        panel.insertTabAfter(createContent('Red'));
        panel.insertTabAfter(createContent('Red'));
        panel.insertTabAfter(createContent('Red'));

        panel.attach(this.ctrls.root);
    }

    ctrls: {
        root?: HTMLDivElement
    } = {}

    render() {
        return (
            <div ref={root=>this.ctrls.root = root} style={[csx.vertical,csx.flex,{maxWidth:'100%'}]} className="app-tabs">
                Hello World
            </div>
        );
    }
}
