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

// Sample addon usage
console.log(CodeMirror.findModeByFileName('asdf/foo.js'))

import React = require('react');
import onresize = require('onresize');
import * as styles from "../styles/styles";

interface Props extends React.Props<any> {
    onChange: (newValue: string) => any;
	onFocusChange?: (focused: boolean) => any;
	path: string;
}

export class CodeEditor extends React.Component<Props,any>{
	
	constructor(props){
		super(props);
		
		this.state = {
			isFocused: false
		};
	}
	
	codeMirror: CodeMirror.EditorFromTextArea;
	refs: { [string: string]: any; textarea: any; }	
	
	resizehandler: {dispose:()=>any};
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
        
        // autocomplete
        autocomplete.setupOptions(options);

        // fold
        (options as any).foldGutter = true;
        options.gutters.push("CodeMirror-foldgutter");
        
        // lint
        linter.setupOptions(options);
        
		var textareaNode = React.findDOMNode(this.refs.textarea);
		this.codeMirror = CodeMirror.fromTextArea(textareaNode as any, options);
		this.codeMirror.on('change', this.codemirrorValueChanged);
		this.codeMirror.on('focus', this.focusChanged.bind(this, true));
		this.codeMirror.on('blur', this.focusChanged.bind(this, false));
		
        this.resizehandler = onresize.on(() => this.reloadParentHeight());
        setTimeout(() => this.reloadParentHeight(),500);
	}
	
	componentWillUnmount () {
		// todo: is there a lighter-weight way to remove the cm instance?
		if (this.codeMirror) {
			this.codeMirror.toTextArea();
		}
		this.resizehandler.dispose();
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

	/** Set height from parent. Using CSS for automatically doing this results in very poor performance */ 
    private reloadParentHeight() {
        let parent: any = React.findDOMNode(this).parentNode;
        let [height, width] = [parent.offsetHeight, parent.offsetWidth];
        this.codeMirror.setSize(width, height);
    }
	
	focus = () => {
		if (this.codeMirror) {
			this.codeMirror.focus();
			this.reloadParentHeight();
			// TODO: restore cursor / scroll position
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
		// var newValue = doc.getValue();
		// this._currentCodemirrorValue = newValue;
		// this.props.onChange && this.props.onChange(newValue);
	}
    
    _setCodemirrorValue: string;    
    setValue(value: string, clearHistory = false){
        this.codeMirror.getDoc().setValue(value);
        this._setCodemirrorValue = value;
        
        if (clearHistory) {
            this.codeMirror.getDoc().clearHistory();
        }
    }
	
	render () {
		var className = 'ReactCodeMirror';
		if (this.state.isFocused) {
			className += ' ReactCodeMirror--focused';
		}
		return (
			<div className={className}>
				<textarea ref="textarea" name={this.props.path} autoComplete={false} />
			</div>
		);
	}

}
