/**
 * We thought a lot out how to expose *inline* information.
 * There was no sane way of having that without keyboard shortcut or dialog overload
 * We we have `docu`, the single point of useful inforation but only at the cursor location
 */
import * as ui from "../../ui";
import * as csx from '../../base/csx';
import * as React from "react";
import * as ReactDOM from "react-dom";
import * as state from "../../state/state";
import {connect} from "react-redux";
import * as clipboard from "../../components/clipboard";
import * as utils from "../../../common/utils";
import {server} from "../../../socket/socketClient";
import {Types} from "../../../socket/socketContract";
import * as commands from "../../commands/commands";
import * as monacoUtils from "../monacoUtils";
import {errorsCache} from "../../globalErrorCacheClient";
import * as typestyle from "typestyle";

type Editor = monaco.editor.ICodeEditor;

let docuClassName = typestyle.style(
    csx.newLayer,
    {
        zIndex: 1, // To come over the editor
        color: '#DDD',
        padding: '5px',
        background: '#343333',
        fontSize: '.8rem',

        // Place to the right
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

        opacity: 0.7, // Light as this is not the user's focus
        transition: 'opacity .2s',
        '&:hover': {
            opacity: 1
        }
    }
);

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
    whiteSpace: 'pre',
    flexShrink: '0'
}, csx.flexRoot, csx.center, csx.wrap)

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
    };
})
export class Doctor extends ui.BaseComponent<Props,State> {
    constructor(props) {
        super(props);
        this.state = {};
    }
    componentWillUnmount() {
        super.componentWillUnmount();
    }
    componentWillReceiveProps(props:Props){
        if (props.showDoctor && !this.props.showDoctor){
            this.handleCursorActivity();
        }
        if (!this.props.cm && props.cm){
            this.disposible.add(props.cm.onDidChangeCursorPosition(this.handleCursorActivity));
        }
    }

    handleCursorActivity = () => {
        let cm = this.props.cm;
        if (!cm) return; // Still loading

        let selections = cm.getSelections();
        if (selections.length !== 1) {
            if (this.state.singleCursor) {
                this.setState({ singleCursor: false });
            }
            return;
        }
        else if (!this.state.singleCursor) {
            this.setState({ singleCursor: true });
        }

        let sel = cm.getSelection();
        const cursor = {line: sel.startLineNumber - 1, ch: sel.startColumn - 1};
        const isCursorInTopHalf = monacoUtils.isCursorInTopHalf(cm);
        if (isCursorInTopHalf) {
            this.setState({ onBottom: true, cursor, doctorInfo: null, searching: true });
        }
        else {
            this.setState({ onBottom: false, cursor, doctorInfo: null, searching: true });
        }
        this.updateLazyInformation();
    }

    updateLazyInformation = utils.debounce(() => {
        if (this.isUnmounted) return;
        if (!this.props.showDoctor || !this.state.singleCursor) return;
        if (!state.inActiveProjectFilePath(this.props.filePath)) return;

        let cm = this.props.cm;
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

        let rawErrors = errorsCache.getErrorsForFilePath(this.props.filePath);
        let errors = rawErrors.filter(re=> re.from.line == this.state.cursor.line).filter(re=> re.from.ch <= this.state.cursor.ch && this.state.cursor.ch <= re.to.ch);

        let positionStyle = this.state.onBottom?docuOnBottomStyle:docuOnTopStyle;

        let doctorInfo = this.state.doctorInfo;
        let typeInfo: JSX.Element;
        let comment: JSX.Element;
        let references: JSX.Element;
        let definitions: JSX.Element;
        if (doctorInfo && doctorInfo.quickInfo){
             typeInfo = <div style={doctorRow}>
                    <strong>SIG</strong>&nbsp;
                    <strong style={{fontFamily:'monospace'}}>{doctorInfo.quickInfo.name}</strong>
                </div>;
             comment = doctorInfo.quickInfo.comment &&
                <div style={doctorRow}>
                    <div style={{background:'#1e1e1e', padding: '3px', fontFamily:'monospace'} as any}>{doctorInfo.quickInfo.comment}</div>
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
        if (doctorInfo && doctorInfo.langHelp){
            definitions = <div style={doctorRow}>
                <strong>{doctorInfo.langHelp.displayName}</strong>{' '}
                <span
                    style={fileLinkStyle}
                    onClick={()=>window.open(doctorInfo.langHelp.help,'_blank')}>
                    More
                </span>
            </div>
        }

        return <div className={docuClassName} style={csx.extend(positionStyle, csx.vertical)}>
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
