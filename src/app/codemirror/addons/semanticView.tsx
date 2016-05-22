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

interface Props {
    cm?: Editor,
    filePath?: string,

    // Connected below
    showSemanticView?: boolean,
}

interface State {
    tree?: Types.SemanticTreeNode[];
    cursor?: EditorPosition;
}

@connect((state: state.StoreState): Props => {
    return {
        showSemanticView: state.showSemanticView,
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
        this.updateLazyInformation();
    }

    updateLazyInformation = utils.debounce(() => {
        if (this.isUnmounted) return;
        if (!this.props.showSemanticView) return;
        if (!state.inActiveProjectFilePath(this.props.filePath)) return;

        let cm = this.props.cm;
        let doc = cm.getDoc();
        const cursor = doc.getCursor();
        this.setState({cursor});
        // server.getDoctorInfo({ filePath: this.props.filePath, editorPosition: cursor }).then(res => {
        //     this.setState({ doctorInfo: res, searching: false });
        // });

    }, 1000);

    render() {
        if (!this.props.showSemanticView || !this.state.cursor) {
            return <div />;
        }

        if (!state.inActiveProjectFilePath(this.props.filePath)) {
            return <div/>;
        }

        return <div style={SemanticViewStyles.root}>

        </div>;
    }

    gotoLocation = (editorPosition: EditorPosition) => {
        // TODO:
    }

    /** Loads the tree data */
    reloadData = () => {
        if (!this.props.filePath) return;

        server.getSemanticTree({ filePath: this.props.filePath }).then(res => {
            this.setState({tree: res.nodes});
            // TODO: render
        });
    }
}
