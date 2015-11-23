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

interface Props {
    cm?: Editor,
    filePath?: string,

    // Connected below
    showDoctor?: boolean,
}

interface State {
    singleCursor?: boolean;
    onBottom?: boolean; // or on bottom ... depending upon cursor
}

let docuStyle = {
    zIndex : '4', // To come over CM
    color: '#DDD',
    padding: '5px',
    background: '#343333',
    fontSize: '.8rem',

    // place to right
    right: '0px',
    left: 'inherit',

    // margin on all side to clear CM scroll bars and look good in general
    margin: '12px',

    // Overflow y and break in x
    overflowY: 'auto',
    wordWrap: 'break-word',

    // Don't let it get too big
    width: '30%',
    maxWidth: '400px',
    minWidth: '200px',
    height: '30%',
    maxHeight: '400px',
    minHeight: '100px',

    opacity: '0.8', // Light as this is not the user's focus
    transition: 'opacity .2s, top .2s, bottom .2s',
    ':hover':{
        opacity: '1'
    }
}

let docuOnTopStyle = {
    top: '0px',
    bottom: 'inherit'
}

let docuOnBottomStyle = {
    top: 'inherit',
    bottom: '0px'
}

@connect((state: state.StoreState): Props => {
    return {
        showDoctor: state.showDoctor
    };
})
@ui.Radium
export class Doctor extends ui.BaseComponent<Props,State> {
    componentDidMount() {
        setTimeout(()=>{
            this.props.cm.on('cursorActivity', this.handleCursorActivity);
            this.handleCursorActivity();
        });
    }
    componentWillUnmount() {
        this.props.cm.off('cursorActivity', this.handleCursorActivity);
    }

    handleCursorActivity = () => {
        let cm = this.props.cm;
        let doc = cm.getDoc();
        let many = doc.somethingSelected() || doc.listSelections().length > 1;
        if (many) {
            if (this.state.singleCursor) {
                this.setState({ singleCursor: false });
            }
            return;
        }
        else if (!this.state.singleCursor) {
            this.setState({ singleCursor: true });
        }

        let cursor = doc.getCursor();
        let scrollInfo = cm.getScrollInfo();
        let topLine = cm.coordsChar({top:scrollInfo.top,left: scrollInfo.left}, 'local').line;
        let bottomLine = cm.coordsChar({ top: scrollInfo.top + scrollInfo.clientHeight, left: scrollInfo.left }, 'local').line + 1;


        if (cursor.line - topLine < bottomLine - cursor.line){
            this.setState({onBottom: true});
        }
        else {
            this.setState({onBottom: false});
        }

        console.log()
    }
    render(){
        if (!this.props.showDoctor || !this.state.singleCursor){
            return <div/>;
        }

        let positionStyle = this.state.onBottom?docuOnBottomStyle:docuOnTopStyle;

        return <div style={csx.extend(csx.newLayer,docuStyle,positionStyle)}>
            DocuDocuDocuDocuDocuDocuDocuDocuDocuDocuDocuDocuDocuDocuDocuDocuDocuDocuDocuDocuDocuDocuDocuDocuDocu DocuDocuDocuDocuDocu <br/>
            DocuDocuDocuDocuDocuDocuDocuDocuDocuDocuDocuDocuDocuDocuDocuDocuDocuDocuDocuDocuDocuDocuDocuDocuDocu DocuDocuDocuDocuDocu <br/>
            DocuDocuDocuDocuDocuDocuDocuDocuDocuDocuDocuDocuDocuDocuDocuDocuDocuDocuDocuDocuDocuDocuDocuDocuDocu DocuDocuDocuDocuDocu <br/>
            DocuDocuDocuDocuDocuDocuDocuDocuDocuDocuDocuDocuDocuDocuDocuDocuDocuDocuDocuDocuDocuDocuDocuDocuDocu DocuDocuDocuDocuDocu <br/>
        </div>;
    }
}
