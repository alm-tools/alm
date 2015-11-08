// Code
import CodeMirror = require('codemirror');

// CSS
require('codemirror/lib/codemirror.css')
require('codemirror/theme/monokai.css')

/**
 *  addons
 */
// meta
require('codemirror/mode/meta');
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

// modes
require('codemirror/mode/javascript/javascript')
require('codemirror/mode/xml/xml')

// keymaps
require('codemirror/keymap/sublime')

// Our Addons
require('./addons/text-hover');
require('./addons/text-hover.css');

// Css overrides
require('./override.css')

import autocomplete = require('./addons/autocomplete');
import linter = require('./addons/linter');
import search = require("./addons/search");
import typescriptMode = require("./mode/typescript");
typescriptMode.register();

// Sample addon usage
// console.log(CodeMirror.findModeByFileName('asdf/foo.js'))

import React = require('react');
var ReactDOM = require('react-dom');
import onresize = require('onresize');
import * as styles from "../styles/styles";
import * as csx from "csx";
import * as ui from "../ui";
import {cast,server} from "../../socket/socketClient";
import {createId,getFilePathFromUrl} from "../../common/utils";
import escape = require("escape-html");

import * as state from "../state/state";


interface Props extends React.Props<any> {
    onEdit: (edit: CodeEdit) => any;
	onFocusChange?: (focused: boolean) => any;
	path: string;
}

export class CodeEditor extends ui.BaseComponent<Props,any>{

    public filePath: string;

	constructor(props){
		super(props);

        this.filePath = getFilePathFromUrl(this.props.path);

		this.state = {
			isFocused: false
		};
	}

	codeMirror: CodeMirror.EditorFromTextArea;
	refs: { [string: string]: any; textarea: any; }

	componentDidMount () {

        var options: CodeMirror.EditorConfiguration = {
            // our extension
            filePath: this.filePath,

            lineNumbers: true,
            mode: 'typescript', // | text/html
            keyMap: 'sublime',
            theme: 'monokai',
            indentUnit: 4,

            extraKeys: {
                "Ctrl-Space": "autocomplete",
                "Cmd-Space": "autocomplete",
            },

            gutters: ["CodeMirror-linenumbers"],

            // Active line addon
            styleActiveLine: true,

            // Match bracket addon
            matchBrackets: true,

            // Auto close brackets and strings
            autoCloseBrackets: true,

            // Match tags (great for tsx!)
            // Doesn't work right now.
            // It needs `tag` token to work (see code in `xml-fold.js` i.e. `/\btag\b/``)
            matchTags: {bothTags: true},

            // Text hover
            textHover: (cm, data, e: MouseEvent) => {
                if (data && data.pos) {
                    return this.getQuickInfo(data.pos);
                }
            },

            /** Overcomes horizontal scrolling for now */
            lineWrapping: true,
        } as any;

        // setup hint / autocomplete options
        autocomplete.setupOptions(options, this.filePath);

        // fold
        (options as any).foldGutter = true;
        options.gutters.push("CodeMirror-foldgutter");

        // lint
        linter.setupOptions(options,this.filePath);
        // also lint on errors changing
        this.disposible.add(cast.errorsUpdated.on(()=> this.codeMirror && this.codeMirror.performLint()));

		var textareaNode = ReactDOM.findDOMNode(this.refs.textarea);
		this.codeMirror = CodeMirror.fromTextArea(textareaNode as any, options);
		this.codeMirror.on('change', this.codemirrorValueChanged);
		this.codeMirror.on('focus', this.focusChanged.bind(this, true));
		this.codeMirror.on('blur', this.focusChanged.bind(this, false));

        // Make hint / autocomplete more aggresive
        autocomplete.setupCodeMirror(this.codeMirror);

        this.disposible.add(onresize.on(() => this.refresh()));
	}

	componentWillUnmount () {
		// todo: is there a lighter-weight way to remove the cm instance?
		if (this.codeMirror) {
			this.codeMirror.toTextArea();
		}
		this.disposible.dispose();
	}

    getQuickInfo(pos:CodeMirror.Position): Promise<string | HTMLElement> {
        if (state.inActiveProject()) {
            return server.quickInfo({ filePath: this.filePath, position: this.codeMirror.getDoc().indexFromPos(pos) }).then(resp=> {
                if (!resp.valid) return;

                var message = `<b>${escape(resp.name)}</b>`;
                if (resp.comment) {
                    message = message + `<br/><i>${escape(resp.comment).replace(/(?:\r\n|\r|\n)/g, '<br />')}</i>`;
                }

                let div = document.createElement('div');
                div.innerHTML = message;
                return div;
            });
        }
    }

	getCodeMirror () {
		return this.codeMirror;
	}

	focus = () => {
		if (this.codeMirror) {
			this.codeMirror.focus();
            this.refresh();
            setTimeout(this.refresh,500);
		}
	}

    gotoPosition = (position: EditorPosition) => {
        if (this.codeMirror) {
			this.codeMirror.getDoc().setCursor(position);
            this.codeMirror.focus();
		}
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

    codemirrorValueChanged = (cm: CodeMirror.EditorFromTextArea, change: CodeMirror.EditorChange) => {
        // console.log(JSON.stringify({val:cm.getDoc().getValue()}));
        // console.log(change);

        // This is just code mirror passing us back changes that we applied ourselves
        if (change.origin == this.sourceId) {
            return;
        }

        let codeEdit: CodeEdit = {
            from: { line: change.from.line, ch: change.from.ch },
            to: { line: change.to.line, ch: change.to.ch },
            newText: change.text.join('\n'),
            sourceId: this.sourceId
        };

        // This is just code mirror telling us what we already know
        if (codeEdit.newText == this._setCodemirrorValue) {
            return;
        }

        // Send the edit
        this.props.onEdit(codeEdit);

		// var newValue = doc.getValue();
		// this._currentCodemirrorValue = newValue;
		// this.props.onChange && this.props.onChange(newValue);
	}

    private _setCodemirrorValue: string;
    setValue(value: string, clearHistory = false){
        let cursor = this.codeMirror.getDoc().getCursor();
        this._setCodemirrorValue = value;
        this.codeMirror.getDoc().setValue(value);
        this.codeMirror.getDoc().setCursor(cursor);

        if (clearHistory) {
            this.codeMirror.getDoc().clearHistory();
        }
    }

    getValue(){
        return this.codeMirror.getDoc().getValue();
    }

    /** Used to track code edits originating from this tab */
    sourceId = `+${createId()}`;
    applyCodeEdit(codeEdit: CodeEdit) {
        if (codeEdit.sourceId !== this.sourceId){
            // Note that we use *our source id* as this is now a change *we are making to code mirror* :)
            this.codeMirror.getDoc().replaceRange(codeEdit.newText, codeEdit.from, codeEdit.to, this.sourceId);
        }
    }

    findOptionsToQueryRegex(options:FindOptions): RegExp{
        // Note that Code mirror only takes `query` string *tries* to detect case senstivity, regex on its own
        // So simpler if we just convert options into regex, and then code mirror will happy use the regex as is
        let str = options.query;
        var query: RegExp;

        /** This came from search.js in code mirror */
        let defaultQuery = /x^/;

        if (!options.isRegex){
            // from CMs search.js
            str = str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
        }
        if (options.isFullWord){
            str = `\\b${str}\\b`;
        }
        try {
            query = new RegExp(str, options.isCaseSensitive ? "g" : "gi");
        }
        catch (e) {
            query = defaultQuery;
        }
        if (query.test("")){
            query = defaultQuery;
        }
        return query;
    }

    search = (options: FindOptions) => {
        search.commands.search(this.codeMirror, this.findOptionsToQueryRegex(options));
    }

    hideSearch = () => {
        search.commands.hideSearch(this.codeMirror);
    }

    findNext = (options: FindOptions) => {
        search.commands.findNext(this.codeMirror, this.findOptionsToQueryRegex(options));
    }

    findPrevious = (options: FindOptions) => {
        search.commands.findPrevious(this.codeMirror, this.findOptionsToQueryRegex(options));
    }

    replaceNext = (newText: string) => {
        search.commands.replaceNext(this.codeMirror, newText);
    }

    replaceAll = (newText: string) => {
        search.commands.replaceAll(this.codeMirror, newText);
    }

	render () {
		var className = 'ReactCodeMirror';
		if (this.state.isFocused) {
			className += ' ReactCodeMirror--focused';
		}
		return (
			<div className={className} style={csx.extend(csx.vertical,csx.flex)}>
				<textarea ref="textarea" name={this.props.path} autoComplete={false} />
			</div>
		);
	}

}
