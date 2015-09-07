import * as ui from "../ui";
import * as React from "react";
import * as tab from "./tab";
import {server} from "../../socket/socketClient";
import * as commands from "../commands/commands";

import {CodeEditor} from "../codemirror/codeEditor"; 

export interface Props extends tab.ComponentProps {
}
export interface State {
    content?:string;
}

export class Code extends React.Component<Props, State>  {
    constructor(props: Props) {
        super(props);
        this.state = {
            content: ''
        };
        
        server.getFileContents({ filePath: props.url }).then((res) => {
            // console.log('got contents!', res.contents);
            this.setState({content:res.contents});
            
            commands.onDidOpenFile.emit({ filePath: props.url });
        });
    }
    
    refs: { [string: string]: any; editor: any; }

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
                value={this.state.content}
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