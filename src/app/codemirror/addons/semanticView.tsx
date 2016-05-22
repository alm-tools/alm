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
import * as fstyle from "../../base/fstyle";
import * as styles from "../../styles/styles";

type Editor = CodeMirror.EditorFromTextArea;


namespace SemanticViewStyles {
    export const root = {
        padding: '5px',
        background: '#343333',

        // Font
        color: '#BBB',
        fontSize: '.5rem',
        fontWeight: 'bold',

        // Overflow
        overflow: 'auto',

        // Limit width
        maxWidth: '200px',

        opacity: '0.7', // Light as this is not the user's focus
        transition: 'opacity .2s',
        ':hover': {
            opacity: '1'
        }
    } as any;

    export const nodeClass = fstyle.style({
        cursor: 'pointer',
        '-webkit-user-select': 'none',
        '&:hover': {
            color: 'white'
        }
    });

    export const selectedNodeClass = fstyle.style({
        color: 'white',
        backgroundColor: styles.blackHighlightColor,
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
    constructor(props) {
        super(props);
        this.state = {
            tree: []
        }
    }
    componentWillUnmount() {
        super.componentWillUnmount();
        this.props.cm.off('cursorActivity', this.handleCursorActivity);
    }
    componentWillReceiveProps(props: Props) {
        if (props.showSemanticView && !this.props.showSemanticView) {
            this.handleCursorActivity();
        }
        if (!this.props.cm && props.cm) {
            /** Initial data load */
            this.reloadData();

            this.handleCursorActivity(props.cm);
            props.cm.on('cursorActivity', this.handleCursorActivity);
        }
    }

    handleCursorActivity = utils.debounce((cm = this.props.cm) => {
        if (!cm) return; // Still loading or maybe unloaded
        if (!state.inActiveProjectFilePath(this.props.filePath)) return;
        if (this.isUnmounted) return;
        if (!this.props.showSemanticView) return;


        let doc = cm.getDoc();
        const cursor = doc.getCursor();
        this.setState({cursor});
    }, 1000);

    render() {
        if (!this.props.showSemanticView || !this.state.cursor) {
            return <div />;
        }

        if (!state.inActiveProjectFilePath(this.props.filePath)) {
            return <div/>;
        }

        return <div style={SemanticViewStyles.root}>
            {this.state.tree.map(node => this.renderNode(node, 0)) }
        </div>;
    }

    renderNode(node: Types.SemanticTreeNode, indent: number) {
        return [<div
            key={node.text}
            className={SemanticViewStyles.nodeClass}
            onClick={ (event) => { this.gotoNode(node); event.stopPropagation(); } }
            data-start={node.start.line} data-end={node.end.line}>
            {ui.indent(indent) }
            <span className={this.getIconForKind(node.kind) + ' ' + this.isSelected(node) }>{node.text}</span>
        </div>].concat(node.subNodes.map(sn => this.renderNode(sn, indent + 1)));
    }

    gotoNode = (node: Types.SemanticTreeNode) => {
        // TODO:
    }

    getIconForKind = (kind: string) => {
        // TODO:
        return `icon icon-${kind}`;
    }

    isSelected = (node: Types.SemanticTreeNode) => {
        if (!this.state.cursor) return '';
        const cursor = this.state.cursor;
        if (node.start.line <= cursor.line && node.end.line >= cursor.line) {
            return SemanticViewStyles.selectedNodeClass;
        }
        return '';
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