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
import * as clipboard from "../../clipboard";
import * as utils from "../../../common/utils";
import {server} from "../../../socket/socketClient";
import {Types} from "../../../socket/socketContract";
import * as commands from "../../commands/commands";

type Editor = CodeMirror.EditorFromTextArea;

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

    opacity: '0.7', // Light as this is not the user's focus
    transition: 'opacity .2s',
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

let doctorRow = csx.extend({
    paddingTop: '3px',
    paddingBottom: '3px',
    whiteSpace: 'pre'
}, csx.flexRoot, csx.center)

let fileLinkStyle = {
    textDecoration: 'underline',
    cursor: 'pointer',
    fontFamily: 'monospace',
    margin: '0px 3px',
}

interface Props {
    cm?: Editor,
    filePath?: string,

    // Connected below
    showDoctor?: boolean,
    errorsByFilePath?: ErrorsByFilePath;
}

interface State {
    singleCursor?: boolean;
    onBottom?: boolean; // or on bottom ... depending upon cursor
    cursor?: EditorPosition;
    doctorInfo?: Types.GetDoctorInfoResponse;
    searching?: boolean;
}

@connect((state: state.StoreState): Props => {
    return {
        showDoctor: state.showDoctor,
        errorsByFilePath: state.errorsUpdate.errorsByFilePath,
    };
})
@ui.Radium
export class Doctor extends ui.BaseComponent<Props,State> {
    componentWillUnmount() {
        super.componentWillUnmount();
        this.props.cm.off('cursorActivity', this.handleCursorActivity);
    }
    componentWillReceiveProps(props:Props){
        if (props.showDoctor && !this.props.showDoctor){
            this.handleCursorActivity();
        }
        if (!this.props.cm && props.cm){
            props.cm.on('cursorActivity', this.handleCursorActivity);
        }
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
            this.setState({ onBottom: true, cursor, doctorInfo: null, searching: true });
        }
        else {
            this.setState({onBottom: false,cursor, doctorInfo: null, searching: true});
        }
        this.updateLazyInformation();
    }

    updateLazyInformation = utils.debounce(() => {
        if (this.isUnmounted) return;
        if (!this.props.showDoctor || !this.state.singleCursor) return;
        if (!state.inActiveProjectFilePath(this.props.filePath)) return;

        let cm = this.props.cm;
        let doc = cm.getDoc();
        server.getDoctorInfo({ filePath: this.props.filePath, editorPosition: this.state.cursor }).then(res=>{
            this.setState({ doctorInfo: res, searching: false });
        });

    }, 1000);

    render(){
        if (!this.props.showDoctor || !this.state.singleCursor || !this.state.cursor){
            return <div />;
        }

        if (!state.inActiveProjectFilePath(this.props.filePath)) {
            return <div/>;
        }

        let rawErrors = this.props.errorsByFilePath[this.props.filePath] || [];
        let errors = rawErrors.filter(re=> re.from.line == this.state.cursor.line).filter(re=> re.from.ch <= this.state.cursor.ch && this.state.cursor.ch <= re.to.ch);

        let positionStyle = this.state.onBottom?docuOnBottomStyle:docuOnTopStyle;

        let doctorInfo = this.state.doctorInfo;
        let typeInfo: JSX.Element;
        let comment: JSX.Element;
        let references: JSX.Element;
        let definitions: JSX.Element;
        if (doctorInfo && doctorInfo.quickInfo){
             typeInfo = <div style={doctorRow}>
                    <strong>SIG</strong> <strong style={{fontFamily:'monospace'} as any}>{doctorInfo.quickInfo.name}</strong>
                </div>;
             comment = doctorInfo.quickInfo.comment &&
                <div style={doctorRow}>
                    <div style={{background:'#222', padding: '3px', fontFamily:'monospace'} as any}>{doctorInfo.quickInfo.comment}</div>
                </div>;
        }
        if (doctorInfo && doctorInfo.references && doctorInfo.references.length){
            references = <div style={doctorRow}>
                <strong>REF</strong>{' '}
                {doctorInfo.references.map(item => {
                    return (
                        <span style={fileLinkStyle}
                        key={item.filePath+item.position.line}
                        onClick={()=>this.openLocation(item.filePath,item.position)}
                        >{utils.getFileName(item.filePath) + ":" + (item.position.line + 1)}</span>
                    )
                })}
            </div>
        }
        if (doctorInfo && doctorInfo.definitions && doctorInfo.definitions.length){
            definitions = <div style={doctorRow}>
                <strong>DEF</strong>{' '}
                {doctorInfo.definitions.map(item => {
                    return (
                        <span style={fileLinkStyle}
                        key={item.filePath+item.position.line}
                        onClick={()=>this.openLocation(item.filePath,item.position)}
                        >{utils.getFileName(item.filePath) + ":" + (item.position.line + 1)}</span>
                    )
                })}
            </div>
        }

        return <div style={csx.extend(csx.newLayer,docuStyle,positionStyle,csx.vertical)}>
            <div style={csx.vertical}>
            {
                errors.map(e=>{
                    return <div style={{padding:'5px'} as any} key={e.from.ch}>
                        🐛({e.from.line+1}:{e.from.ch+1}) {e.message}
                        {' '}<clipboard.Clipboard text={`${e.filePath}:${e.from.line+1} ${e.message}`}/>
                    </div>;
                })
            }
            {
                typeInfo
            }
            {
                comment
            }
            {
                references
            }
            {
                definitions
            }
            {
                this.state.searching && <i>Searching...</i>
            }
            {
                this.state.doctorInfo && !this.state.doctorInfo.valid && <i>Nothing worthwhile</i>
            }
            </div>
        </div>;

        { /* For debugging styles
        return <div >
            DocuDocuDocuDocuDocuDocuDocuDocuDocuDocuDocuDocuDocuDocuDocuDocuDocuDocuDocuDocuDocuDocuDocuDocuDocu DocuDocuDocuDocuDocu <br/>
            DocuDocuDocuDocuDocuDocuDocuDocuDocuDocuDocuDocuDocuDocuDocuDocuDocuDocuDocuDocuDocuDocuDocuDocuDocu DocuDocuDocuDocuDocu <br/>
            DocuDocuDocuDocuDocuDocuDocuDocuDocuDocuDocuDocuDocuDocuDocuDocuDocuDocuDocuDocuDocuDocuDocuDocuDocu DocuDocuDocuDocuDocu <br/>
            DocuDocuDocuDocuDocuDocuDocuDocuDocuDocuDocuDocuDocuDocuDocuDocuDocuDocuDocuDocuDocuDocuDocuDocuDocu DocuDocuDocuDocuDocu <br/>
        </div>;
        */}
    }

    openLocation = (filePath: string, editorPosition: EditorPosition) => {
        commands.doOpenOrFocusFile.emit({ filePath: filePath, position: editorPosition });
    }
}
