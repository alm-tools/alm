// Code
import CodeMirror = require('codemirror');

// CSS
require('codemirror/lib/codemirror.css')
require('codemirror/theme/monokai.css')

/**
 *  addons
 */
// comments (single / multiline)
require('codemirror/addon/comment/comment');
// code folding
require('codemirror/addon/fold/foldcode');
require('codemirror/addon/fold/foldgutter');
require('codemirror/addon/fold/brace-fold');
require('codemirror/addon/fold/xml-fold');
require('codemirror/addon/fold/markdown-fold');
require('codemirror/addon/fold/comment-fold');
require('codemirror/addon/fold/foldgutter.css');
// Highlight active line
require('codemirror/addon/selection/active-line');
// Highlight matching brackets
require('codemirror/addon/edit/matchbrackets');
// Auto close brackets and strings
require('codemirror/addon/edit/closebrackets');
// Auto match tags (great for TSX!)
require('codemirror/addon/edit/matchtags');
// Auto highlight same words selected
require('codemirror/addon/search/match-highlighter');

// Our Addons
require('./addons/text-hover');
require('./addons/text-hover.css');
require('./addons/jumpy');
import blaster = require('./addons/blaster');

// Css overrides
require('./codeEditor.css')

import autocomplete = require('./addons/autocomplete/autocomplete');
import linter = require('./addons/linter');
import search = require("./addons/search");
import typescriptMode = require("./mode/typescriptMode");
typescriptMode.register();
import * as docCache from "./mode/docCache";

import React = require('react');
import ReactDOM = require('react-dom');
import onresize = require('onresize');
import * as styles from "../styles/styles";
import * as csx from "csx";
import * as ui from "../ui";
import {cast,server} from "../../socket/socketClient";
import {createId,getFilePathFromUrl} from "../../common/utils";
import escape = require("escape-html");
import * as doctor from "./addons/doctor";
import * as state from "../state/state";
import { Provider } from 'react-redux';
import * as utils from "../../common/utils";
import * as cursorLocation from "../cursorHistory";
import * as events from "../../common/events";
import * as cmUtils from "./cmUtils";

interface Props {
	onFocusChange?: (focused: boolean) => any;
	readOnly?: boolean | "nocursor";
	preview?: ts.TextSpan;
	filePath: string;
}

export class CodeEditor extends ui.BaseComponent<Props,{isFocused?:boolean, loading?: boolean}>{
	constructor(props){
		super(props);

		this.state = {
			isFocused: false,
			loading: true,
		};
	}

	codeMirror: CodeMirror.EditorFromTextArea;
	refs: {
		[string: string]: any;
		textarea: any;
	}

	/** Ready after the doc is loaded */
	ready = false;
	afterReadyQueue:{():void}[] = [];
	/** If already ready it execs ... otherwise waits */
	afterReady = (cb:()=>void) => {
		if (this.ready) cb();
		else {
			this.afterReadyQueue.push(cb);
		}
	}

	componentDidMount () {

        var options: CodeMirror.EditorConfiguration = {
            // our extension
            filePath: this.props.filePath,
            readOnly: this.props.readOnly,

            keyMap: 'sublime',
            theme: 'monokai',
            indentUnit: 4,
			indentWithTabs: false,

			// Soft tabs (tabs to spaces):
			// https://github.com/codemirror/CodeMirror/issues/988#issuecomment-37692827
            extraKeys: {
                Tab: function(cm) {
                    if (cm.doc.somethingSelected()) {
                        return CodeMirror.Pass;
                    }
					if (cm.getOption("indentWithTabs")) {
						return CodeMirror.Pass;
					}
                    var spacesPerTab = cm.getOption("indentUnit");
                    var spacesToInsert = spacesPerTab - (cm.doc.getCursor("start").ch % spacesPerTab);
                    var spaces = Array(spacesToInsert + 1).join(" ");
                    cm.replaceSelection(spaces, "end", "+input");
                }
            },

			lineNumbers: true,
			foldGutter: true,
            gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],

            // Active line addon
            styleActiveLine: true,

            // Match bracket addon
            matchBrackets: true,

			// match-highlighter
			highlightSelectionMatches: {showToken: /\w/},

            // Auto close brackets and strings
            autoCloseBrackets: true,

            // Match tags (great for tsx!)
            // Doesn't work right now.
            // It needs `tag` token to work (see code in `xml-fold.js` i.e. `/\btag\b/``)
            matchTags: {bothTags: true},

            // Text hover
            textHover: {
				delay: 50,
				getTextHover: (cm, data, e: MouseEvent) => {
	                if (data && data.pos) {
	                    return this.getQuickInfo(data.pos);
	                }
	            },
			},

			// Blaster
			// blastCode: { effect: 2 }, // `effect` can be 1 or 2

            /** Overcomes horizontal scrolling for now */
            lineWrapping: true,
        } as any;

        // setup hint / autocomplete options
        autocomplete.setupOptions(options, this.props.filePath);

        // fold
        (options as any).foldGutter = true;
        options.gutters.push("CodeMirror-foldgutter");

        // lint
        linter.setupOptions(options,this.props.filePath);
        // also lint on errors changing
        this.disposible.add(cast.errorsUpdated.on(()=> this.codeMirror && this.codeMirror.performLint()));
		// and initially
		setTimeout(()=> this.codeMirror && this.codeMirror.performLint(),1000);

		var textareaNode = ReactDOM.findDOMNode(this.refs.textarea);
		this.codeMirror = CodeMirror.fromTextArea(textareaNode as any, options);
		this.codeMirror.filePath = this.props.filePath;
		this.codeMirror.on('focus', this.focusChanged.bind(this, true));
		this.codeMirror.on('blur', this.focusChanged.bind(this, false));

        // Make hint / autocomplete more aggresive
        autocomplete.setupCodeMirror(this.codeMirror);

        this.disposible.add(onresize.on(() => this.refresh()));

        // cursor history
        if (!this.props.readOnly) {
            this.codeMirror.on('cursorActivity', this.handleCursorActivity);
            this.disposible.add({ dispose: () => this.codeMirror.off('cursorActivity', this.handleCursorActivity) });
        }

		// Load the document
        docCache.getLinkedDoc(this.props.filePath).then(({doc, editorOptions})=>{
            this.codeMirror.swapDoc(doc);

			// Set editor options
			this.codeMirror.setOption('indentUnit', editorOptions.indentSize);
			this.codeMirror.setOption('tabSize', editorOptions.tabSize);
			this.codeMirror.setOption('indentWithTabs', !editorOptions.convertTabsToSpaces);

            if (this.props.preview) {
                let preview = this.props.preview;
                let from = doc.posFromIndex(preview.start);
                let to = doc.posFromIndex(preview.start + preview.length);
				doc.setCursor(from);
				this.codeMirror.scrollIntoView(from);
            }

			this.afterReadyQueue.forEach(cb=>cb());
			this.ready = true;
			this.setState({loading:false});
        });
	}

	componentWillUnmount () {
		super.componentWillUnmount();
		// todo: is there a lighter-weight way to remove the cm instance?
		if (this.codeMirror) {
			this.codeMirror.toTextArea();
			/**
			 * Very hacky way to unlink docs from CM
			 * If we don't do this then the doc stays in memory and so does cm :-/
			 */
			(this.codeMirror.getDoc() as any).cm = null;
		}
	}

    getQuickInfo = (pos:CodeMirror.Position): Promise<string | HTMLElement> => {
        if (state.inActiveProjectFilePath(this.props.filePath)) {
            return server.quickInfo({ filePath: this.props.filePath, position: this.codeMirror.getDoc().indexFromPos(pos) }).then(resp=> {
                if (!resp.valid) return;

				var message = '';
				if (resp.errors.length){
					message = message + `🐛 <i>${resp.errors.map(e=>escape(e.message)).join('<br/>')}</i><br/>`
				}

				if (resp.info){
					message = message + `<b>${escape(resp.info.name)}</b>`;
					if (resp.info.comment) {
						message = message + `<br/><i>${escape(resp.info.comment).replace(/(?:\r\n|\r|\n)/g, '<br />')}</i>`;
					}
				}

                let div = document.createElement('div');
                div.innerHTML = message;
                return div;
            });
        }
    };

	getCodeMirror () {
		return this.codeMirror;
	}

	focus = () => {
		if (this.codeMirror) {
			this.codeMirror.focus();
			this.handleCursorActivity();
            this.refresh();
            setTimeout(()=> !this.isUnmounted && this.refresh(),500);
		}
	}

    gotoPosition = (position: EditorPosition) => {
        this.afterReady(()=>{
            cmUtils.jumpToLine({ line: position.line, ch: position.ch, editor: this.codeMirror });
            this.codeMirror.focus();
		});
    }

    private refresh = () => {
        if (this.codeMirror) {
            this.codeMirror.refresh(); // Needed to resize gutters correctly
        }
    }

	focusChanged = (focused) => {
		this.setState({
			isFocused: focused
		});
		this.props.onFocusChange && this.props.onFocusChange(focused);
	}

    getValue(){
        return this.codeMirror.getDoc().getValue();
    }

    search = (options: FindOptions) => {
        search.commands.search(this.codeMirror, utils.findOptionsToQueryRegex(options));
    }

    hideSearch = () => {
        search.commands.hideSearch(this.codeMirror);
    }

    findNext = (options: FindOptions) => {
        search.commands.findNext(this.codeMirror, utils.findOptionsToQueryRegex(options));
    }

    findPrevious = (options: FindOptions) => {
        search.commands.findPrevious(this.codeMirror, utils.findOptionsToQueryRegex(options));
    }

    replaceNext = (newText: string) => {
        search.commands.replaceNext(this.codeMirror, newText);
    }

	replacePrevious = (newText: string) => {
		search.commands.replacePrevious(this.codeMirror, newText);
	}

    replaceAll = (newText: string) => {
        search.commands.replaceAll(this.codeMirror, newText);
    }

    handleCursorActivity = () => {
        let cursor = this.codeMirror.getDoc().getCursor();
        cursorLocation.addEntry(cursor);
    };

	render () {
		var className = 'ReactCodeMirror';
		if (this.state.isFocused) {
			className += ' ReactCodeMirror--focused';
        }
        const loadingStyle = {
            position: 'absolute', top: '45%', left: '45%', zIndex: 1,
			color: '#999',
			border: '5px solid #999',
			borderRadius: '5px',
			fontSize:'2rem',
			padding: '5px',
			transition: '.2s opacity',
			opacity: this.state.loading ? 1: 0
        };
		return (
			<div className={className} style={csx.extend(csx.vertical,csx.flex,{position:'relative', maxWidth:'100%'})}>
				{!this.props.readOnly && <doctor.Doctor cm={this.codeMirror} filePath={this.props.filePath}/>}
				{!this.props.readOnly && <blaster.Blaster cm={this.codeMirror}/>}
				<div style={loadingStyle}>LOADING</div>
				<textarea ref="textarea" name={this.props.filePath} autoComplete="false" />
			</div>
		);
	}

}

// marker demo : https://codemirror.net/demo/marker.html
`
<style type="text/css">
      .breakpoints {width: .8em;}
      .breakpoint { color: #822; }
      .CodeMirror {border: 1px solid #aaa;}
    </style>
`;
`
var editor = CodeMirror.fromTextArea(document.getElementById("code"), {
  lineNumbers: true,
  gutters: ["CodeMirror-linenumbers", "breakpoints"]
});
editor.on("gutterClick", function(cm, n) {
  var info = cm.lineInfo(n);
  cm.setGutterMarker(n, "breakpoints", info.gutterMarkers ? null : makeMarker());
});
function makeMarker() {
  var marker = document.createElement("div");
  marker.style.color = "#822";
  marker.innerHTML = "●";
  return marker;
}
`;
