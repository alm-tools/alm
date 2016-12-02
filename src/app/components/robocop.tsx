require('./robocop.css');

import React = require("react");
import * as csx from '../base/csx';
import {BaseComponent} from "../ui";
import * as ui from "../ui";
import * as utils from "../../common/utils";
import * as styles from "../styles/themes/current/base";
import * as state from "../state/state";

export interface Props {
}
export interface State {

}

export class Robocop extends BaseComponent<Props, State>{
    render(){
        return (
            <div className="progress">
              <div className="indeterminate"></div>
            </div>
        );
    }
}
