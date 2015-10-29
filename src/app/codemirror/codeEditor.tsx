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

// modes
require('codemirror/mode/javascript/javascript')

// keymaps
require('codemirror/keymap/sublime')

// Our Addons
require('./addons/text-hover');
require('./addons/text-hover.css');
import autocomplete = require('./addons/autocomplete');
import linter = require('./addons/linter');
import search = require("./addons/search");

// Sample addon usage
console.log(CodeMirror.findModeByFileName('asdf/foo.js'))

import React = require('react');
var ReactDOM = require('react-dom');
import onresize = require('onresize');
import * as styles from "../styles/styles";
import * as csx from "csx";
import * as ui from "../ui";
import {cast} from "../../socket/socketClient";
import {createId,getFilePathFromUrl} from "../../common/utils";

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
            lineNumbers: true,
            mode: 'javascript',
            keyMap: 'sublime',
            theme: 'monokai',

            extraKeys: {
                "Ctrl-Space": "autocomplete",
                "Cmd-Space": "autocomplete"
            },

            gutters: ["CodeMirror-linenumbers"],

            // Active line addon
            styleActiveLine: true,

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
        this.disposible.add(cast.errorsUpdated.on(()=>this.codeMirror.performLint()));

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
        // console.log(pos);
        // let div = document.createElement('div');
        // div.innerHTML = `<strong>Awesome, ${pos.line},${pos.ch}</strong>`;
        // let def = Promise.defer();
        // setTimeout(()=>{def.resolve(div)},1000);
        // return def.promise;
        return;
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
        this._setCodemirrorValue = value;
        this.codeMirror.getDoc().setValue(value);

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

    search = (options: FindOptions) => {
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
        search.commands.search(this.codeMirror, query);
    }

    clearSearch = () => {
        search.commands.clearSearch(this.codeMirror);
    }

    findNext = () => {
        search.commands.findNext(this.codeMirror);
    }

    findPrevious = () => {
        search.commands.findPrevious(this.codeMirror);
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
