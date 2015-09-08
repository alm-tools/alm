// Code
import CM = require('codemirror');

// CSS
require('codemirror/lib/codemirror.css')
require('codemirror/theme/monokai.css')

// addons
require('codemirror/mode/meta');
require('codemirror/addon/comment/comment');
require('codemirror/addon/fold/foldcode');
require('codemirror/addon/fold/foldgutter');
require('codemirror/addon/fold/brace-fold');
require('codemirror/addon/fold/xml-fold');
require('codemirror/addon/fold/markdown-fold');
require('codemirror/addon/fold/comment-fold');
require('codemirror/addon/fold/foldgutter.css');

// modes 
require('codemirror/mode/javascript/javascript')

// keymaps
require('codemirror/keymap/sublime')

console.log(CM.findModeByFileName('asdf/foo.js'))

import React = require('react');
import onresize = require('onresize');
import * as styles from "../styles/styles";

interface Props extends React.Props<any> {
    onChange: (newValue: string) => any;
	onFocusChange?: (focused: boolean) => any;
	options: CodeMirror.EditorConfiguration;
	path?: string;
	value: string;
}

export class CodeEditor extends React.Component<Props,any>{
	
	constructor(props){
		super(props);
		
		this.state = {
			isFocused: false
		};
	}
	
	codeMirror: CM.EditorFromTextArea;
	_currentCodemirrorValue: string;
	refs: { [string: string]: any; textarea: any; }	
	
	resizehandler: {dispose:()=>any};
	componentDidMount () {
		var textareaNode = React.findDOMNode(this.refs.textarea);
		this.codeMirror = CM.fromTextArea(textareaNode as any, this.props.options);
		this.codeMirror.on('change', this.codemirrorValueChanged);
		this.codeMirror.on('focus', this.focusChanged.bind(this, true));
		this.codeMirror.on('blur', this.focusChanged.bind(this, false));
		this._currentCodemirrorValue = this.props.value;
		
		
        this.resizehandler = onresize.on(() => this.reloadParentHeight());
        setTimeout(() => this.reloadParentHeight());
	}
	
	componentWillUnmount () {
		// todo: is there a lighter-weight way to remove the cm instance?
		if (this.codeMirror) {
			this.codeMirror.toTextArea();
		}
		this.resizehandler.dispose();
	}

	componentWillReceiveProps (nextProps) {
		if (this.codeMirror && this._currentCodemirrorValue !== nextProps.value) {
			this.codeMirror.getDoc().setValue(nextProps.value);
		}
		if (nextProps.mode){
		}
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
	
	codemirrorValueChanged = (doc, change) => {
		// var newValue = doc.getValue();
		// this._currentCodemirrorValue = newValue;
		// this.props.onChange && this.props.onChange(newValue);
	}
	
	render () {
		var className = 'ReactCodeMirror';
		if (this.state.isFocused) {
			className += ' ReactCodeMirror--focused';
		}
		return (
			<div className={className}>
				<textarea ref="textarea" name={this.props.path} defaultValue={this.props.value} autoComplete={false} />
			</div>
		);
	}

}
