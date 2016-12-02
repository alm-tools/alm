/**
 * Provides a new overview of the cotents of the file, *semantically*
 */
/** imports */
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
import * as typestyle from "typestyle";
import * as styles from "../../styles/themes/current/base";
import {shouldComponentUpdate} from "../../../common/pure";
import {gotoPosition} from "../../monaco/monacoUtils";

type Editor = monaco.editor.ICommonCodeEditor;

namespace SemanticViewStyles {
    export const root = {
        padding: '5px',
        background: '#343333',

        // Font
        color: '#BBB',
        fontSize: '.6rem',
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

    export const nodeClass = typestyle.style(csx.extend(styles.ellipsis, {
        paddingTop: '2px',
        paddingBottom: '3px',
        paddingLeft: '2px',
        paddingRight: '2px',

        // Border which merges with the top
        marginTop: '-1px',
        border: '1px solid transparent',

        cursor: 'pointer',
        '-webkit-user-select': 'none',

        transition: 'background .2s',
        '&:hover': {
            backgroundColor: '#555'
        }
    }));

    export const selectedNodeClass = typestyle.style({
        border: '1px solid grey',
        backgroundColor: styles.blackHighlightColor,
        '&:hover': {
            backgroundColor: styles.blackHighlightColor
        }
    });
}

interface Props {
    editor?: Editor,
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
export class SemanticView extends ui.BaseComponent<Props, State> {
    shouldComponentUpdate = shouldComponentUpdate;
    constructor(props) {
        super(props);
        this.state = {
            tree: []
        }
    }
    componentWillUnmount() {
        super.componentWillUnmount();
    }
    componentWillReceiveProps(props: Props) {
        if (props.showSemanticView && !this.props.showSemanticView) {
            this.handleCursorActivity();
        }
        if (!this.props.editor && props.editor) {
            /** Initial data load */
            let sel = props.editor.getSelection();
            const cursor = {line: sel.startLineNumber - 1, ch: sel.endLineNumber - 1};
            this.setState({ cursor });
            this.reloadData();

            const reloadDataDebounced = utils.debounce(this.reloadData, 3000);
            this.disposible.add(commands.fileContentsChanged.on(e=>{
                if (e.filePath === props.filePath && this.props.showSemanticView){
                    reloadDataDebounced();
                }
            }));
            this.disposible.add(state.subscribeSub((s => s.showSemanticView), (showSemanticView) => {
                if (showSemanticView) {
                    reloadDataDebounced();
                }
            }));

            this.handleCursorActivity(props.editor);
            this.disposible.add(props.editor.onDidChangeCursorSelection(()=>this.handleCursorActivity()));
        }
        /**
         * If just hidden and we have an editor, then the editor needs resizing
         */
        if (!props.showSemanticView && this.props.showSemanticView && this.props.editor) {
            this.afterComponentDidUpdate(()=>{
                this.relayoutEditor();
            });
        }
    }

    handleCursorActivity = utils.debounce((editor: Editor = this.props.editor) => {
        if (!editor) return; // Still loading or maybe unloaded
        if (!state.inActiveProjectFilePath(this.props.filePath)) return;
        if (this.isUnmounted) return;
        if (!this.props.showSemanticView) return;


        let sel = editor.getSelection();
        const cursor = {line: sel.startLineNumber - 1, ch: sel.startColumn - 1};
        /** If first call OR cursor moved */
        if (!this.state.cursor || (this.state.cursor && this.state.cursor.line !== cursor.line)) {
            this.setState({ cursor });
            this.afterComponentDidUpdate(()=>{
                // Scroll to select node in view if any
                const ref = this.refs[this.selectedRef] as HTMLDivElement;
                if (ref) {
                    ref.scrollIntoViewIfNeeded(true);
                }
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
        const ref = isSelected ? this.selectedRef.toString() : null;
        return [<div
            ref={ref}
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
        const editor = this.props.editor;
        gotoPosition({ editor, position: cursor });
        editor.focus();
        this.setState({ cursor });
    }

    getIconForKind(kind: string) {
        return ui.kindToIcon(kind);
    }

    /** Constantly incrementing so that this points to the last (deepest) selected node :) */
    selectedRef: number = 0;

    isSelected = (node: Types.SemanticTreeNode) => {
        if (!this.state.cursor) return '';
        const cursor = this.state.cursor;
        if (node.start.line <= cursor.line && node.end.line >= cursor.line) {
            this.selectedRef++;
            return SemanticViewStyles.selectedNodeClass;
        }
        return '';
    }

    /** If the tree changes its width we need to relayout the editor */
    lastWidth: number = 0;

    /** Loads the tree data */
    reloadData = () => {
        if (!this.props.filePath) return;
        if (!state.inActiveProjectFilePath(this.props.filePath)) return;

        server.getSemanticTree({ filePath: this.props.filePath }).then(res => {
            this.afterComponentDidUpdate(()=>{
                // also relayout the editor if the last width is not the same as new width
                const newWidth = ReactDOM.findDOMNode(this).clientWidth;
                if (this.lastWidth !== newWidth){
                    this.relayoutEditor();
                    this.lastWidth = newWidth;
                }
            })
            this.setState({tree: res.nodes});
        });
    }

    relayoutEditor() {
        // We store `top` (and restore it) otherwise the editor jumps around a bit after relayout.
        const top = this.props.editor.getScrollTop();
        this.props.editor.layout();
        this.props.editor.setScrollTop(top);
    }
}
