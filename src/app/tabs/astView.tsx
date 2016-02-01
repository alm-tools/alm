import * as ui from "../ui";
import * as csx from "csx";
import * as React from "react";
import * as tab from "./tab";
import {server,cast} from "../../socket/socketClient";
import * as commands from "../commands/commands";
import * as utils from "../../common/utils";
import * as d3 from "d3";
import * as $ from "jquery";
import * as styles from "../styles/styles";
import * as onresize from "onresize";
import {Clipboard} from "../clipboard";

import {Types} from "../../socket/socketContract";

type NodeDisplay = Types.NodeDisplay;
let EOL = '\n';

let {inputBlackStyle} = styles.Input;

/**
 * The styles
 */
require('./astView.less');

import {CodeEditor} from "../codemirror/codeEditor";

export interface Props extends tab.ComponentProps {
}
export interface State {
    selectedNode?: Types.NodeDisplay;
    text?:string;
}

@ui.Radium
export class ASTView extends ui.BaseComponent<Props, State> implements tab.Component {

    constructor(props: Props) {
        super(props);
        let {protocol,filePath} = utils.getFilePathAndProtocolFromUrl(props.url);
        this.mode = protocol === 'ast' ? Types.ASTMode.visitor : Types.ASTMode.children;
        this.filePath = filePath;

        this.state = {
        };
    }

    refs: {
        [string: string]: any;
        root: HTMLDivElement;
        graphRoot: HTMLDivElement;
    }

    filePath: string;
    mode: Types.ASTMode;
    astViewRenderer : ASTViewRenderer;
    componentDidMount() {
        server.openFile({filePath:this.filePath}).then(res=>{
            this.setState({text: res.contents});
        });

        server.getAST({mode:this.mode,filePath:this.filePath})
            .then((res)=>{
                this.astViewRenderer = new ASTViewRenderer({
                    rootNode: res.root,
                    _mainContent: $(this.refs.graphRoot),
                    display: this.display
                })
            });
    }

    render() {

        let node = this.state.selectedNode;
        var display = node
        ? `
${node.kind}
-------------------- AST --------------------
${node.rawJson}
-------------------- TEXT -------------------
${this.state.text.substring(node.pos, node.end)}
                `.trim()
                : "The selected AST node details will go here";

        return (
            <div
                ref="root" tabIndex={0}
                style={csx.extend(csx.horizontal,csx.flex,styles.noFocusOutline, styles.someChildWillScroll)}>
                <div style={csx.extend(csx.flex,csx.scroll)} ref="graphRoot" className="ast-view">
                    {
                        // The ast tree view goes here
                    }
                </div>
                <div style={csx.extend(csx.flex,csx.flexRoot,csx.scroll,styles.padded1,{background:'white'})}>
                    <pre style={csx.extend(csx.flex,{margin:'0px'})}>
                        {display}
                    </pre>
                </div>
            </div>
        );
    }

    display = (node: Types.NodeDisplay)=>{
        this.setState({selectedNode:node})
    }

    /**
     * TAB implementation
     */
    focus = () => {
        this.refs.root.focus();
        this.astViewRenderer && this.astViewRenderer.update();
    }

    save = () => {
    }

    close = () => {
    }

    gotoPosition = (position: EditorPosition) => {
    }

    search = {
        doSearch: (options: FindOptions) => {
            // TODO
        },

        hideSearch: () => {
            // TODO
        },

        findNext: (options: FindOptions) => {
        },

        findPrevious: (options: FindOptions) => {
        },

        replaceNext: (newText: string) => {
        },

        replacePrevious: (newText: string) => {
        },

        replaceAll: (newText: string) => {
        }
    }
}

class ASTViewRenderer {
    root: {
        dom: HTMLElement;
        jq: JQuery;
    };

    // General D3 utlis
    tree = d3.layout.tree().nodeSize([0, 20]);
    diagonal = d3.svg.diagonal()
        .projection(function(d) { return [d.y, d.x]; });

    // setup in Ctor
    rootNode: Types.NodeDisplay;
    graphRoot: d3.Selection<any>;
    graph: d3.Selection<any>;

    // vodoo
    i: number = 0;

    // layout constants
    margin = { top: 30, right: 20, bottom: 30, left: 20 };
    barHeight = 30;
    duration = 400;

    constructor(public config:{rootNode: NodeDisplay, _mainContent: JQuery, display: (content: NodeDisplay) => void}) {
        this.root ={
            dom: config._mainContent[0],
            jq: config._mainContent
        };

        this.rootNode = config.rootNode;

        this.graphRoot = d3.select(this.root.dom).append("svg")
        this.graph = this.graphRoot.append("g")
            .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

        // Kick off by selecting the root node
        this.select(this.rootNode);

        d3.select(this.root.dom).on("resize", this.update);
        this.update();
    }

    selected: NodeDisplay;
    /** display details on click */
    select = (node: NodeDisplay) => {
        this.config.display(node);
        this.selected = node;
        this.update();
    }

    getWidth = () => this.root.jq.width() - this.margin.left - this.margin.right;

    update = () => {
        this.graphRoot.attr("width", this.getWidth());

        var width = this.getWidth();
        const barWidth = width * .8;

        // Compute the flattened node list. TODO use d3.layout.hierarchy.
        var nodes:d3.layout.tree.Node[] = this.tree.nodes(this.rootNode);

        var height = Math.max(500, nodes.length * this.barHeight + this.margin.top + this.margin.bottom);

        d3.select("svg").transition()
            .duration(this.duration)
            .attr("height", height);

        d3.select(self.frameElement).transition()
            .duration(this.duration)
            .style("height", height + "px");

        // Compute the "layout".
        nodes.forEach((n, i) => {
            n.x = i * this.barHeight;
        });

        // Update the nodes…
        var node = this.graph.selectAll("g.node")
            .data(nodes, (d) => { return (d as any).id || ((d as any).id = ++this.i); });

        var nodeEnter = node.enter().append("g")
            .attr("class", "node")
            .attr("transform", (d) => { return "translate(" + this.rootNode.depth + "," + this.rootNode.nodeIndex + ")"; })
            .style("opacity", 1e-6);

        // Enter any new nodes at the parent's previous position.
        nodeEnter.append("rect")
            .attr("y", -this.barHeight / 2)
            .attr("height", this.barHeight)
            .attr("width", barWidth)
            .style("fill", this.color)
            .on("click", this.select);

        nodeEnter.append("text")
            .attr("dy", 3.5)
            .attr("dx", 5.5)
            .text(function(d: NodeDisplay) {
            return d.kind;
        });

        // Transition nodes to their new position.
        nodeEnter.transition()
            .duration(this.duration)
            .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; })
            .style("opacity", 1);

        node.transition()
            .duration(this.duration)
            .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; })
            .style("opacity", 1)
            .select("rect")
            .style("fill", this.color);

        // Transition exiting nodes to the parent's new position.
        node.exit().transition()
            .duration(this.duration)
            .attr("transform", function(d) { return "translate(" + this.rootNode.nodeIndex + "," + this.rootNode.depth + ")"; })
            .style("opacity", 1e-6)
            .remove();

        // Update the links…
        var link = this.graph.selectAll("path.link")
            .data(this.tree.links(nodes), function(d) { return (d.target as any).id; });

        // Enter any new links at the parent's previous position.
        link.enter().insert("path", "g")
            .attr("class", "link")
            .attr("d", (d) => {
                var o = { x: this.rootNode.depth, y: this.rootNode.nodeIndex };
                return (this.diagonal as any)({ source: o, target: o });
            })
            .transition()
            .duration(this.duration)
            .attr("d", this.diagonal);

        // Transition links to their new position.
        link.transition()
            .duration(this.duration)
            .attr("d", this.diagonal);

        // Transition exiting nodes to the parent's new position.
        link.exit().transition()
            .duration(this.duration)
            .attr("d", (d) => {
            var o = { x: this.rootNode.depth, y: this.rootNode.nodeIndex };
            return (this.diagonal as any)({ source: o, target: o });
        }).remove();
    }

    color = (d: NodeDisplay) => {
        if (this.selected == d) {
            return "rgb(140, 0, 0)";
        }
        return d.children ? "#000000" : "rgb(29, 166, 0)";
    }
}
