/**
 * We thought a lot out how to expose *inline* information.
 * There was no sane way of having that without keyboard shortcut or dialog overload
 * We we have `docu`, the single point of useful inforation but only at the cursor location
 */
import * as ui from "../../ui";
import csx = require("csx");
import * as React from "react";
import * as ReactDOM from "react-dom";
import * as state from "../../state/state";
import {connect} from "react-redux";

enum Features {
    Type,
    Signature,
    JSDoc,
    Error,
}

interface DocuState {
    cursor: EditorPosition;
}

type Editor = CodeMirror.EditorFromTextArea;

interface Props{
    cm?: Editor,
    filePath?: string,

    // Connected below
    showDocu?: boolean,
}

let docuStyle = {
    zIndex : '4', // To come over CM
    width: '25%',
    height: '25%',
    color: '#DDD',
    padding: '5px',
    background: '#343333',

    // place to right
    right: '0px',
    left: 'inherit',
}

@connect((state: state.StoreState): Props => {
    return {
        showDocu: state.showDocu
    };
})
export class Docu extends ui.BaseComponent<Props,any> {
    componentDidMount(){
        console.log(this.props);
    }
    componentWillUnmount(){
        console.log('unmount')
    }
    render(){
        return <div style={csx.extend(csx.newLayer,docuStyle)}>
            Docu
        </div>;
    }
}
