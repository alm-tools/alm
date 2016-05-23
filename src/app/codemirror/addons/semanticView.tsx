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
        paddingTop: '2px',
        paddingBottom: '3px',
        paddingLeft: '2px',

        // Border which merges with the top
        marginTop: '-1px',
        border: '1px solid transparent',

        cursor: 'pointer',
        '-webkit-user-select': 'none',

        transition: 'background .2s',
        '&:hover': {
            backgroundColor: '#555'
        }
    });

    export const selectedNodeClass = fstyle.style({
        border: '1px solid grey',
        backgroundColor: styles.blackHighlightColor,
        '&:hover': {
            backgroundColor: styles.blackHighlightColor
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

            const reloadDataDebounced = utils.debounce(this.reloadData, 3000);
            this.disposible.add(commands.fileContentsChanged.on(e=>{
                if (e.filePath === props.cm.filePath){
                    reloadDataDebounced();
                }
            }));

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
        /** If first call OR cursor moved */
        if (!this.state.cursor || (this.state.cursor && this.state.cursor.line !== cursor.line)) {
            this.setState({cursor});
            this.afterComponentDidUpdate(()=>{
                // Future idea : scroll to node in view
                // Can't do right now as we show duplicates i.e. show stuff at module level and then at node level etc.
            })
        }
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
        const isSelected = this.isSelected(node);
        const color = ui.kindToColor(node.kind);
        return [<div
            key={node.text}
            className={SemanticViewStyles.nodeClass + ' ' + isSelected}
            style={{color}}
            onClick={ (event) => { this.gotoNode(node); event.stopPropagation(); } }
            data-start={node.start.line} data-end={node.end.line}>
            {ui.indent(indent) }
            <span style={{fontFamily:'FontAwesome'}}>{this.getIconForKind(node.kind)}</span> {node.text}
        </div>].concat(node.subNodes.map(sn => this.renderNode(sn, indent + 1)));
    }

    gotoNode = (node: Types.SemanticTreeNode) => {
        const cursor = { line: node.start.line, ch: node.start.ch }
        const cm = this.props.cm;
        cm.getDoc().setCursor(cursor);
        cm.focus();
        this.setState({cursor});
    }

    getIconForKind(kind: string) {
        return ui.kindToIcon(kind);
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
