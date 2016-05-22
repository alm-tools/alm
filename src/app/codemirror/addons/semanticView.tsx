/**
 * Provides a new overview of the cotents of the file, *semantically*
 */
/** imports */
import * as ui from "../../ui";
import csx = require("csx");
import * as React from "react";
import * as ReactDOM from "react-dom";
import * as state from "../../state/state";
import {connect} from "react-redux";
import * as clipboard from "../../components/clipboard";
import * as utils from "../../../common/utils";
import {server} from "../../../socket/socketClient";
import {Types} from "../../../socket/socketContract";
import * as commands from "../../commands/commands";
import * as cmUtils from "../cmUtils";

type Editor = CodeMirror.EditorFromTextArea;


namespace SemanticViewStyles {
    export const root = csx.extend(csx.vertical, {
        color: '#DDD',
        padding: '5px',
        background: '#343333',
        fontSize: '.8rem',

        // Overflow
        overflow: 'auto',

        // Limit width
        maxWidth: '200px',

        opacity: '0.7', // Light as this is not the user's focus
        transition: 'opacity .2s',
        ':hover': {
            opacity: '1'
        }
    });
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
    showSemanticView?: boolean,
    errorsByFilePath?: ErrorsByFilePath;
}

interface State {
    singleCursor?: boolean;
    cursor?: EditorPosition;
    doctorInfo?: Types.GetDoctorInfoResponse;
    searching?: boolean;
}

@connect((state: state.StoreState): Props => {
    return {
        showSemanticView: state.showSemanticView,
        errorsByFilePath: state.errorsUpdate.errorsByFilePath,
    };
})
@ui.Radium
export class SemanticView extends ui.BaseComponent<Props, State> {
    componentWillUnmount() {
        super.componentWillUnmount();
        this.props.cm.off('cursorActivity', this.handleCursorActivity);
    }
    componentWillReceiveProps(props: Props) {
        if (props.showSemanticView && !this.props.showSemanticView) {
            this.handleCursorActivity();
        }
        if (!this.props.cm && props.cm) {
            props.cm.on('cursorActivity', this.handleCursorActivity);
        }
    }

    handleCursorActivity = () => {
        let cm = this.props.cm;
        if (!cm) return; // Still loading
        let doc = cm.getDoc();
        let isSingleCursor = cmUtils.isSingleCursor(this.props.cm);
        if (!isSingleCursor) {
            if (this.state.singleCursor) {
                this.setState({ singleCursor: false });
            }
            return;
        }
        else if (!this.state.singleCursor) {
            this.setState({ singleCursor: true });
        }

        this.updateLazyInformation();
    }

    updateLazyInformation = utils.debounce(() => {
        if (this.isUnmounted) return;
        if (!this.props.showSemanticView || !this.state.singleCursor) return;
        if (!state.inActiveProjectFilePath(this.props.filePath)) return;

        let cm = this.props.cm;
        let doc = cm.getDoc();
        const cursor = doc.getCursor();
        server.getDoctorInfo({ filePath: this.props.filePath, editorPosition: this.state.cursor }).then(res => {
            this.setState({ doctorInfo: res, searching: false });
        });

    }, 1000);

    render() {
        if (!this.props.showSemanticView || !this.state.singleCursor || !this.state.cursor) {
            return <div />;
        }

        if (!state.inActiveProjectFilePath(this.props.filePath)) {
            return <div/>;
        }

        let rawErrors = this.props.errorsByFilePath[this.props.filePath] || [];
        let errors = rawErrors.filter(re => re.from.line == this.state.cursor.line).filter(re => re.from.ch <= this.state.cursor.ch && this.state.cursor.ch <= re.to.ch);

        let doctorInfo = this.state.doctorInfo;
        let typeInfo: JSX.Element;
        let comment: JSX.Element;
        let references: JSX.Element;
        let definitions: JSX.Element;
        if (doctorInfo && doctorInfo.quickInfo) {
            typeInfo = <div style={doctorRow}>
                <strong>SIG</strong>&nbsp;
                <strong style={{ fontFamily: 'monospace' } as any}>{doctorInfo.quickInfo.name}</strong>
            </div>;
            comment = doctorInfo.quickInfo.comment &&
                <div style={doctorRow}>
                    <div style={{ background: '#222', padding: '3px', fontFamily: 'monospace' } as any}>{doctorInfo.quickInfo.comment}</div>
                </div>;
        }
        if (doctorInfo && doctorInfo.references && doctorInfo.references.length) {
            references = <div style={doctorRow}>
                <strong>REF</strong>{' '}
                {doctorInfo.references.map(item => {
                    return (
                        <span style={fileLinkStyle}
                            key={item.filePath + item.position.line}
                            onClick={() => this.openLocation(item.filePath, item.position) }
                            >{utils.getFileName(item.filePath) + ":" + (item.position.line + 1) }</span>
                    )
                }) }
            </div>
        }
        if (doctorInfo && doctorInfo.definitions && doctorInfo.definitions.length) {
            definitions = <div style={doctorRow}>
                <strong>DEF</strong>{' '}
                {doctorInfo.definitions.map(item => {
                    return (
                        <span style={fileLinkStyle}
                            key={item.filePath + item.position.line}
                            onClick={() => this.openLocation(item.filePath, item.position) }
                            >{utils.getFileName(item.filePath) + ":" + (item.position.line + 1) }</span>
                    )
                }) }
            </div>
        }
        if (doctorInfo && doctorInfo.langHelp) {
            definitions = <div style={doctorRow}>
                <strong>{doctorInfo.langHelp.displayName}</strong>{' '}
                <span
                    style={fileLinkStyle}
                    onClick={() => window.open(doctorInfo.langHelp.help, '_blank') }>
                    More
                </span>
            </div>
        }

        return <div style={SemanticViewStyles.root}>
            <div style={csx.vertical}>
                {
                    errors.map(e => {
                        return <div style={{ padding: '5px' } as any} key={e.from.ch}>
                            🐛({e.from.line + 1}: {e.from.ch + 1}) {e.message}
                            {' '}<clipboard.Clipboard text={`${e.filePath}:${e.from.line + 1} ${e.message}`}/>
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
