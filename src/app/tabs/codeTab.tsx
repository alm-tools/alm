import * as ui from "../ui";
import * as React from "react";
import * as tab from "./tab";
import {server} from "../../socket/socketClient";
import * as commands from "../commands/commands";

import {CodeEditor} from "../codemirror/codeEditor"; 

export interface Props extends tab.ComponentProps {
}
export interface State {
}

export class Code extends React.Component<Props, State> implements tab.TabComponent {
    constructor(props: Props) {
        super(props);
        this.state = {
            content: ''
        };
    }
    
    refs: { [string: string]: any; editor: CodeEditor; }
    
    componentDidMount() {
        server.getFileContents({ filePath: this.props.url }).then((res) => {
            this.refs.editor.setValue(res.contents, true);
            commands.onDidOpenFile.emit({ filePath: this.props.url });
        });
    }

    render() {
        
        var options = {
			lineNumbers: true,
            mode: 'javascript',
            keyMap: 'sublime',
            foldGutter: true,
            gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
            theme:'monokai',
            
            /** Overcomes horizontal scrolling for now */
            lineWrapping: true,
		};
        
        return (
            <CodeEditor
                ref='editor'
                path={this.props.url}
                onChange={this.onChange}
                options={options}
              />    
        );
        
        return <div>
            Code to go here : {this.props.url}
        </div>;
    }
    
    
    onChange = (newValue) => {
      // console.log('change',newValue)
    }
    
    focus = () => {
        this.refs.editor.focus();
    }
}


export class CodeTab implements tab.TabInstance {
    constructor(public url: string) {
    }
    getElement = (index: number) => <Code ref={tab.getRef(this.url, index)} key={tab.getRef(this.url, index)} url={this.url}/>;
    getTitle = () => `${this.url}`;
}