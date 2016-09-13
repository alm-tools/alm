/**
 * Just renders an image
 */
import * as ui from "../ui";
import * as utils from "../../common/utils";
import * as React from "react";
import * as gls from "../base/gls";
import * as csx from '../base/csx';

/**
 * ViewerJS
 * https://github.com/fengyuanchen/viewerjs
 */
const Viewer = require('viewerjs/dist/viewer');
require('viewerjs/dist/viewer.css');
require('./imageViewer.css');


export class ImageViewer extends ui.BaseComponent<{ filePath: string, onClick: () => any }, {}>{
    componentDidMount() {
        const root = this.refs['img'];
        var viewer = new Viewer(root, {
            toolbar: true,
            inline: true,
            navbar: false,
            button: false,
            movable: false, // Because it conflicts with flex box centering
        });
        this.disposible.add({
            dispose: () => viewer.destroy()
        });
    }
    render() {
        const {filePath} = this.props;
        return <div style={csx.extend(csx.flex, csx.centerCenter) } onClick={this.props.onClick}>
            <img ref="img" style={{opacity:0}} src={`${utils.imageUrl}/${filePath}`}/>
        </div>
    }
}
