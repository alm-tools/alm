/**
 * Just renders an image
 */
import * as ui from "../ui";
import * as utils from "../../common/utils";
import * as React from "react";
import * as gls from "../base/gls";
import * as csx from "../../../node_modules/csx/csx";

export class ImageViewer extends ui.BaseComponent<{ filePath: string, onClick: () => any }, {}>{
    render() {
        const {filePath} = this.props;
        return <div style={csx.extend(csx.flex, csx.centerCenter)} onClick={this.props.onClick}>
            <img style={{}} src={`${utils.imageUrl}/${filePath}`}/>
        </div>
    }
}
