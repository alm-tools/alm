/**
 * Just renders an image
 */
import * as ui from "../ui";
import * as utils from "../../common/utils";
import * as React from "react";

export class ImageViewer extends ui.BaseComponent<{ filePath: string }, {}>{
    render() {
        return <div>Render an image here</div>
    }
}
