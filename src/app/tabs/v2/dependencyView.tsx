import * as ui from "../../ui";
import * as csx from "../../base/csx";
import * as React from "react";
import * as tab from "./tab";
import {server,cast} from "../../../socket/socketClient";
import * as commands from "../../commands/commands";
import * as utils from "../../../common/utils";
import * as d3 from "d3";
import {Types} from "../../../socket/socketContract";
import * as $ from "jquery";
import * as styles from "../../styles/themes/current/base";
import * as onresize from "onresize";
import {Clipboard} from "../../components/clipboard";
import * as typestyle from "typestyle";

type FileDependency = Types.FileDependency;
let EOL = '\n';

/**
 * The styles
 */
require('./dependencyView.less');

export interface Props extends tab.TabProps {
}
export interface State {
    cycles:string[][];
}

let controlRootStyle = {
    pointerEvents:'none',
}
let controlRightStyle = {
    width:'200px',
    padding: '10px',

    overflow: 'auto',
    wordBreak: 'break-all',

    pointerEvents: 'all',
}
let controlItemClassName = typestyle.style({
    pointerEvents:'auto',

    padding:'.4rem',
    transition:'background .2s',
    background: 'rgba(200,200,200,.05)',
    '&:hover':{
        background: 'rgba(200,200,200,.25)',
    }
})
let cycleHeadingStyle = {
    fontSize:'1.2rem',
}

export class DependencyView extends ui.BaseComponent<Props, State> {

    private graphRenderer: GraphRenderer;
    constructor(props: Props) {
        super(props);
        this.filePath = utils.getFilePathFromUrl(props.url);
        this.state = {
            cycles:[]
        };
    }

    refs: {
        [string: string]: any;
        root: HTMLDivElement;
        graphRoot: HTMLDivElement;
        controlRoot: HTMLDivElement;
    }

    filePath: string;
    componentDidMount() {
        this.loadData();

        this.disposible.add(
            cast.activeProjectConfigDetailsUpdated.on(()=>{
                this.loadData();
            })
        );

        const focused = () => {
            this.props.onFocused();
        }
        this.refs.root.addEventListener('focus', focused);
        this.disposible.add({
            dispose: () => {
                this.refs.root.removeEventListener('focus', focused);
            }
        })

        // Listen to tab events
        const api = this.props.api;
        this.disposible.add(api.resize.on(this.resize));
        this.disposible.add(api.focus.on(this.focus));
        this.disposible.add(api.save.on(this.save));
        this.disposible.add(api.close.on(this.close));
        this.disposible.add(api.gotoPosition.on(this.gotoPosition));
        // Listen to search tab events
        this.disposible.add(api.search.doSearch.on(this.search.doSearch));
        this.disposible.add(api.search.hideSearch.on(this.search.hideSearch));
        this.disposible.add(api.search.findNext.on(this.search.findNext));
        this.disposible.add(api.search.findPrevious.on(this.search.findPrevious));
        this.disposible.add(api.search.replaceNext.on(this.search.replaceNext));
        this.disposible.add(api.search.replacePrevious.on(this.search.replacePrevious));
        this.disposible.add(api.search.replaceAll.on(this.search.replaceAll));
    }

    render() {
        let hasCycles = !!this.state.cycles.length;

        let cyclesMessages = hasCycles
            ? this.state.cycles.map((cycle,i)=>{
                let cycleText = cycle.join(' ⬅️ ');
                return (
                    <div key={i} className={controlItemClassName}>
                        <div style={cycleHeadingStyle}> {i+1}) Cycle <Clipboard text={cycleText} /></div>
                        <div>
                            {cycleText}
                       </div>
                    </div>
                );
            })
            : <div key={-1} className={controlItemClassName}>No cycles 🌹</div>;

        return (
            <div
                ref="root" tabIndex={0}
                className="dependency-view"
                style={csx.extend(csx.vertical,csx.flex, csx.newLayerParent, styles.someChildWillScroll)}
                onKeyPress={this.handleKey}>
                <div ref="graphRoot" style={csx.extend(csx.vertical,csx.flex)}>
                    {/* Graph goes here */}
                </div>

                <div ref="controlRoot" className="graph-controls"
                    style={csx.extend(csx.newLayer, csx.horizontal, csx.endJustified, controlRootStyle)}>
                    <div style={csx.extend(csx.vertical, controlRightStyle)}>
                        <div className={`control-zoom ${controlItemClassName}`}>
                            <a className="control-zoom-in" href="#" title="Zoom in" onClick={this.zoomIn}/>
                            <a className="control-zoom-out" href="#" title="Zoom out" onClick={this.zoomOut}/>
                            <a className="control-fit" href="#" title="Fit" onClick={this.zoomFit}/>
                        </div>
                        {cyclesMessages}
                    </div>
               </div>

               <div data-comment="Tip" style={csx.extend(styles.Tip.root,csx.content)}>
                    Tap <span style={styles.Tip.keyboardShortCutStyle}>R</span> to refresh
               </div>

            </div>
        );
    }

    handleKey = (e:any)=>{
        let unicode = e.charCode;
        if (String.fromCharCode(unicode).toLowerCase() === "r"){
            this.loadData();
        }
    }

    loadData = () => {
        this.refs.graphRoot.innerHTML = '';
        return server.getDependencies({}).then((res) => {
            // Create the graph renderer
            this.graphRenderer = new GraphRenderer({
                dependencies: res.links,
                measureSizeRoot: $(this.refs.root),
                graphRoot:$(this.refs.graphRoot),
                display:(node) => {
                }
            });

            // get the cycles
            let cycles = this.graphRenderer.d3Graph.cycles();
            this.setState({cycles});
        });
    }

    zoomIn = (e:React.SyntheticEvent) => {
        e.preventDefault();
        if (!this.graphRenderer) return;

        this.graphRenderer.zoomIn();
    }
    zoomOut = (e:React.SyntheticEvent) => {
        e.preventDefault();
        if (!this.graphRenderer) return;

        this.graphRenderer.zoomOut();
    }
    zoomFit = (e:React.SyntheticEvent) => {
        e.preventDefault();
        if (!this.graphRenderer) return;

        this.graphRenderer.zoomFit();
    }

    /**
     * TAB implementation
     */
    resize = () => {
        this.graphRenderer && this.graphRenderer.resize();
    }

    focus = () => {
        this.refs.root.focus();
        // if its not there its because an XHR is lagging and it will show up when that xhr completes anyways
        this.graphRenderer && this.graphRenderer.resize();
    }

    save = () => {
    }

    close = () => {
    }

    gotoPosition = (position: EditorPosition) => {
    }

    search = {
        doSearch: (options: FindOptions) => {
            this.graphRenderer && this.graphRenderer.applyFilter(options.query);
        },

        hideSearch: () => {
            this.graphRenderer && this.graphRenderer.clearFilter();
        },

        findNext: (options: FindOptions) => {
        },

        findPrevious: (options: FindOptions) => {
        },

        replaceNext: ({newText}: { newText: string }) => {
        },

        replacePrevious: ({newText}: { newText: string }) => {
        },

        replaceAll: ({newText}: { newText: string }) => {
        }
    }
}


interface D3LinkNode extends d3.layout.force.Node {
    name: string
}
interface D3Link {
    source: D3LinkNode;
    target: D3LinkNode;
}

var prefixes = {
    circle: 'circle'
}

class GraphRenderer {
    graph: d3.Selection<any>;
    links:d3.Selection<d3.layout.force.Link<d3.layout.force.Node>>;
    nodes:d3.Selection<d3.layout.force.Node>;
    text:d3.Selection<d3.layout.force.Node>;

    zoom: d3.behavior.Zoom<{}>;
    layout: d3.layout.Force<d3.layout.force.Link<d3.layout.force.Node>,d3.layout.force.Node>;

    graphWidth = 0;
    graphHeight = 0;

    d3Graph: D3Graph;
    svgRoot: d3.Selection<any>;

    constructor(public config:{
        dependencies: FileDependency[],
        measureSizeRoot: JQuery,
        graphRoot: JQuery,
        display: (content: FileDependency) => any
    }){
        var d3Root = d3.select(config.graphRoot[0]);
        let self = this;

        // Compute the distinct nodes from the links.
        var d3NodeLookup: { [name: string]: D3LinkNode } = {};
        var d3links: D3Link[] = config.dependencies.map(function(link) {
            var source = d3NodeLookup[link.sourcePath] || (d3NodeLookup[link.sourcePath] = { name: link.sourcePath });
            var target = d3NodeLookup[link.targetPath] || (d3NodeLookup[link.targetPath] = { name: link.targetPath });
            return { source, target };
        });

        // Calculate all the good stuff
        this.d3Graph = new D3Graph(d3links);

        // setup weights based on degrees
        Object.keys(d3NodeLookup).forEach(name=> {
            var node = d3NodeLookup[name];
            node.weight = self.d3Graph.avgDeg(node);
        })

        // Setup zoom
        this.zoom = d3.behavior.zoom()
            .scale(0.4)
            .scaleExtent([.1,6])
            .on("zoom", onZoomChanged);

        this.svgRoot = d3Root.append("svg")
            .call(this.zoom);

        this.graph = this.svgRoot
            .append('svg:g');

        this.layout = d3.layout.force()
            .nodes(d3.values(d3NodeLookup))
            .links(d3links)
            .gravity(.05)
            .linkDistance(function(link: D3Link) { return (self.d3Graph.difference(link)) * 200; })
            .charge(-900)
            .on("tick", this.tick)
            .start();

        var drag = this.layout.drag()
            .on("dragstart", dragstart);

        /** resize initially and setup for resize */
        this.resize();
        this.centerGraph();

        function onZoomChanged() {
            self.graph.attr("transform", "translate(" + (d3.event as any).translate + ")" + " scale(" + (d3.event as any).scale + ")");
        }

        // Per-type markers, as they don't inherit styles.
        self.graph.append("defs").selectAll("marker")
            .data(["regular"])
            .enter().append("marker")
            .attr("id", function(d) { return d; })
            .attr("viewBox", "0 -5 10 10")
            .attr("refX", 15)
            .attr("refY", -1.5)
            .attr("markerWidth", 6)
            .attr("markerHeight", 6)
            .attr("orient", "auto")
            .append("path")
            .attr("d", "M0,-5L10,0L0,5");

        this.links = self.graph.append("g").selectAll("path")
            .data(this.layout.links())
            .enter().append("path")
            .attr("class", function(d: D3Link) { return "link"; })
            .attr("data-target", function(o: D3Link) { return self.htmlName(o.target) })
            .attr("data-source", function(o: D3Link) { return self.htmlName(o.source) })
            .attr("marker-end", function(d: D3Link) { return "url(#regular)"; });

        this.nodes = self.graph.append("g").selectAll("circle")
            .data(this.layout.nodes())
            .enter().append("circle")
            .attr("class", function(d: D3LinkNode) { return formatClassName(prefixes.circle, d) }) // Store class name for easier later lookup
            .attr("data-name", function(o: D3LinkNode) { return self.htmlName(o) }) // Store for easier later lookup
            .attr("r", function(d: D3LinkNode) { return Math.max(d.weight, 3); })
            .classed("inonly", function(d: D3LinkNode) { return self.d3Graph.inOnly(d); })
            .classed("outonly", function(d: D3LinkNode) { return self.d3Graph.outOnly(d); })
            .classed("circular", function(d: D3LinkNode) { return self.d3Graph.isCircular(d); })
            .call(drag)
            .on("dblclick", dblclick) // Unstick
            .on("mouseover", function(d: D3LinkNode) { onNodeMouseOver(d) })
            .on("mouseout", function(d: D3LinkNode) { onNodeMouseOut(d) })

        this.text = self.graph.append("g").selectAll("text")
            .data(this.layout.nodes())
            .enter().append("text")
            .attr("x", 8)
            .attr("y", ".31em")
            .attr("data-name", function(o: D3LinkNode) { return self.htmlName(o) })
            .text(function(d: D3LinkNode) { return d.name; });


        function onNodeMouseOver(d: D3LinkNode) {

            // Highlight circle
            var elm = findElementByNode(prefixes.circle, d);
            elm.classed("hovering", true);

            updateNodeTransparencies(d, true);
        }
        function onNodeMouseOut(d: D3LinkNode) {
            // Highlight circle
            var elm = findElementByNode(prefixes.circle, d);
            elm.classed("hovering", false);

            updateNodeTransparencies(d, false);
        }

        let findElementByNode = (prefix, node) => {
            var selector = '.' + formatClassName(prefix, node);
            return self.graph.select(selector);
        }

        function updateNodeTransparencies(d: D3LinkNode, fade = true) {

            // clean
            self.nodes.classed('not-hovering', false);
            self.nodes.classed('dimmed', false);

            if (fade) {
                self.nodes.each(function(o: D3LinkNode) {
                    if (!self.d3Graph.isConnected(d, o)) {
                        this.classList.add('not-hovering');
                        this.classList.add('dimmed');
                    }
                });
            }

            // Clean
            self.graph.selectAll('path.link').attr('data-show', '')
                .classed('outgoing', false)
                .attr('marker-end', fade ? '' : 'url(#regular)')
                .classed('incomming', false)
                .classed('dimmed', fade);

            self.links.each(function(o: D3Link) {
                if (o.source.name === d.name) {
                    this.classList.remove('dimmed');

                    // Highlight target of the link
                    var elmNodes = self.graph.selectAll('.' + formatClassName(prefixes.circle, o.target));
                    elmNodes.attr('fill-opacity', 1);
                    elmNodes.attr('stroke-opacity', 1);
                    elmNodes.classed('dimmed', false);

                    // Highlight arrows
                    let outgoingLink = self.graph.selectAll('path.link[data-source="' + self.htmlName(o.source) + '"]');
                    outgoingLink.attr('data-show', 'true');
                    outgoingLink.attr('marker-end', 'url(#regular)');
                    outgoingLink.classed('outgoing', true);

                }
                else if (o.target.name === d.name) {
                    this.classList.remove('dimmed');

                    // Highlight arrows
                    let incommingLink = self.graph.selectAll('path.link[data-target="' + self.htmlName(o.target) + '"]');
                    incommingLink.attr('data-show', 'true');
                    incommingLink.attr('marker-end', 'url(#regular)');
                    incommingLink.classed('incomming', true);

                }
            });

            self.text.classed("dimmed", function(o: D3LinkNode) {
                if (!fade) return false;

                if (self.d3Graph.isConnected(d, o)) return false;

                return true;
            });

        }

        // Helpers
        function formatClassName(prefix, object: D3LinkNode) {
            return prefix + '-' + self.htmlName(object);
        }

        function dragstart(d) {
            d.fixed = true; // http://bl.ocks.org/mbostock/3750558
            (d3.event as any).sourceEvent.stopPropagation(); // http://bl.ocks.org/mbostock/6123708
            d3.select(this).classed("fixed", true);
        }

        function dblclick(d) {
            d3.select(this).classed("fixed", d.fixed = false);
        }
    }

    // Use elliptical arc path segments to doubly-encode directionality.
    tick = () => {
        function transform(d: D3LinkNode) {
            return "translate(" + d.x + "," + d.y + ")";
        }
        this.links.attr("d", linkArc);
        this.nodes.attr("transform", transform);
        this.text.attr("transform", transform);
    }

    applyFilter = utils.debounce((val: string) => {
        if (!val) {
            this.clearFilter();
            return;
        }
        else {
            this.nodes.classed('filtered-out', true);
            this.links.classed('filtered-out', true);
            this.text.classed('filtered-out', true);
            let filteredNodes = this.graph.selectAll(`circle[data-name*="${this.htmlName({ name: val }) }"]`);
            filteredNodes.classed('filtered-out', false);
            var filteredLinks = this.graph.selectAll(`[data-source*="${this.htmlName({ name: val }) }"][data-target*="${this.htmlName({ name: val }) }"]`);
            filteredLinks.classed('filtered-out', false);
            let filteredText = this.graph.selectAll(`text[data-name*="${this.htmlName({ name: val }) }"]`);
            filteredText.classed('filtered-out', false);
        }
    },250);

    clearFilter = () => {
        this.nodes.classed('filtered-out', false);
        this.links.classed('filtered-out', false);
        this.text.classed('filtered-out', false);
    }

    /**
     * Layout
     */
    resize = () => {
        this.graphWidth = this.config.measureSizeRoot.width();
        this.graphHeight = this.config.measureSizeRoot.height();
        this.svgRoot.attr("width", this.graphWidth)
            .attr("height", this.graphHeight);
        this.layout.size([this.graphWidth, this.graphHeight])
            .resume();
    }

    centerGraph = () => {
        var centerTranslate:[number,number] = [
            (this.graphWidth / 4),
            (this.graphHeight / 4),
        ];
        this.zoom.translate(centerTranslate);
        // Render transition
        this.transitionScale();
    }

    zoomIn = () => {
        this.zoomCenter(1);
    }
    zoomOut = () => {
        this.zoomCenter(-1);
    }
    zoomFit = () => {
        this.zoom.scale(0.4);
        this.centerGraph();
    }

    /** Modifed from http://bl.ocks.org/linssen/7352810 */
    private zoomCenter(direction: number) {
        var factor = 0.3,
            target_zoom = 1,
            center = [this.graphWidth / 2, this.graphHeight / 2],
            extent = this.zoom.scaleExtent(),
            translate = this.zoom.translate(),
            translate0 = [],
            l = [],
            view = { x: translate[0], y: translate[1], k: this.zoom.scale() };

        target_zoom = this.zoom.scale() * (1 + factor * direction);

        if (target_zoom < extent[0] || target_zoom > extent[1]) { return false; }

        translate0 = [(center[0] - view.x) / view.k, (center[1] - view.y) / view.k];
        view.k = target_zoom;
        l = [translate0[0] * view.k + view.x, translate0[1] * view.k + view.y];

        view.x += center[0] - l[0];
        view.y += center[1] - l[1];

        this.zoom.scale(view.k);
        this.zoom.translate([view.x, view.y]);
        this.transitionScale();
    }

    /**
     * Helpers
     */
    private htmlName(object: D3LinkNode) {
        return object.name.replace(/(\.|\/)/gi, '-');
    }

    private transitionScale(){
        this.graph.transition()
            .duration(500)
            .attr("transform", "translate(" + this.zoom.translate() + ")" + " scale(" + this.zoom.scale() + ")");
    }
}

interface TargetBySourceName
{ [source: string]: D3LinkNode[] }

/**
 * A class to do analysis on D3 links array
 * Degree : The number of connections
 * Bit of a lie about degrees : 0 is changed to 1 intentionally
 */
class D3Graph {
    private inDegLookup = {};
    private outDegLookup = {};
    private linkedByName = {};
    private targetsBySourceName: TargetBySourceName = {};
    private circularPaths: string[][] = [];
    constructor(private links: D3Link[]) {
        links.forEach(l=> {
            if (!this.inDegLookup[l.target.name]) this.inDegLookup[l.target.name] = 2;
            else this.inDegLookup[l.target.name]++;

            if (!this.outDegLookup[l.source.name]) this.outDegLookup[l.source.name] = 2;
            else this.outDegLookup[l.source.name]++;

            // Build linked lookup for quick connection checks
            this.linkedByName[l.source.name + "," + l.target.name] = 1;

            // Build an adjacency list
            if (!this.targetsBySourceName[l.source.name]) this.targetsBySourceName[l.source.name] = [];
            this.targetsBySourceName[l.source.name].push(l.target);
        });

        // Taken from madge
        this.findCircular();
    }
    public inDeg(node: D3LinkNode) {
        return this.inDegLookup[node.name] ? this.inDegLookup[node.name] : 1;
    }
    public outDeg(node: D3LinkNode) {
        return this.outDegLookup[node.name] ? this.outDegLookup[node.name] : 1;
    }
    public avgDeg(node: D3LinkNode) {
        return (this.inDeg(node) + this.outDeg(node)) / 2;
    }
    public isConnected(a: D3LinkNode, b: D3LinkNode) {
        return this.linkedByName[a.name + "," + b.name] || this.linkedByName[b.name + "," + a.name] || a.name == b.name;
    }
    /** how different are the two nodes in the link */
    public difference(link: D3Link) {
        // take file path into account:
        return utils.relative(link.source.name, link.target.name).split('/').length;
    }
    public inOnly(node: D3LinkNode) {
        return !this.outDegLookup[node.name] && this.inDegLookup[node.name];
    }
    public outOnly(node: D3LinkNode) {
        return !this.inDegLookup[node.name] && this.outDegLookup[node.name];
    }

    /**
    * Get path to the circular dependency.
    */
    private getPath(parent: D3LinkNode, unresolved: { [source: string]: boolean }): string[] {
        var parentVisited = false;

        return Object.keys(unresolved).filter((module) => {
            if (module === parent.name) {
                parentVisited = true;
            }
            return parentVisited && unresolved[module];
        });
    }

    /**
     * A circular dependency is occurring when we see a software package
     * more than once, unless that software package has all its dependencies resolved.
     */
    private resolver(sourceName: string, resolved: { [source: string]: boolean }, unresolved: { [source: string]: boolean }) {
        unresolved[sourceName] = true;

        if (this.targetsBySourceName[sourceName]) {
            this.targetsBySourceName[sourceName].forEach((dependency) => {
                if (!resolved[dependency.name]) {
                    if (unresolved[dependency.name]) {
                        this.circularPaths.push(this.getPath(dependency, unresolved));
                        return;
                    }
                    this.resolver(dependency.name, resolved, unresolved);
                }
            });
        }

        resolved[sourceName] = true;
        unresolved[sourceName] = false;
    }

    /**
     * Finds all circular dependencies for the given modules.
     */
    private findCircular() {
        var resolved: any = {},
            unresolved: any = {};

        Object.keys(this.targetsBySourceName).forEach((sourceName) => {
            this.resolver(sourceName, resolved, unresolved);
        });
    };

    /** Check if the given module is part of a circular dependency */
    public isCircular(node: D3LinkNode) {
        var cyclic = false;
        this.circularPaths.some((path) => {
            if (path.indexOf(node.name) >= 0) {
                cyclic = true;
                return true;
            }
            return false;
        });
        return cyclic;
    }

    public cycles(): string[][] {
        return this.circularPaths;
    }
}


/** modified version of http://stackoverflow.com/a/26616564/390330 Takes weight into account */
function linkArc(d: D3Link) {
    var targetX = d.target.x;
    var targetY = d.target.y;

    var sourceX = d.source.x;
    var sourceY = d.source.y;

    var theta = Math.atan((targetX - sourceX) / (targetY - sourceY));
    var phi = Math.atan((targetY - sourceY) / (targetX - sourceX));

    var sinTheta = d.source.weight / 2 * Math.sin(theta);
    var cosTheta = d.source.weight / 2 * Math.cos(theta);
    var sinPhi = (d.target.weight - 6) * Math.sin(phi);
    var cosPhi = (d.target.weight - 6) * Math.cos(phi);

    // Set the position of the link's end point at the source node
    // such that it is on the edge closest to the target node
    if (d.target.y > d.source.y) {
        sourceX = sourceX + sinTheta;
        sourceY = sourceY + cosTheta;
    }
    else {
        sourceX = sourceX - sinTheta;
        sourceY = sourceY - cosTheta;
    }

    // Set the position of the link's end point at the target node
    // such that it is on the edge closest to the source node
    if (d.source.x > d.target.x) {
        targetX = targetX + cosPhi;
        targetY = targetY + sinPhi;
    }
    else {
        targetX = targetX - cosPhi;
        targetY = targetY - sinPhi;
    }

    // Draw an arc between the two calculated points
    var dx = targetX - sourceX,
        dy = targetY - sourceY,
        dr = Math.sqrt(dx * dx + dy * dy);
    return "M" + sourceX + "," + sourceY + "A" + dr + "," + dr + " 0 0,1 " + targetX + "," + targetY;

}
