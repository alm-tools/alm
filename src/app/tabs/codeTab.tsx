import * as ui from "../ui";
import * as React from "react";
import * as tab from "./tab";
import {server} from "../../socket/socketClient";
import * as commands from "../commands/commands";

import {Acer} from "../ace/acer";
require('brace');
require('brace/mode/typescript')
require('brace/theme/github')

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
            console.log('got contents!', res.contents);
            
            commands.onDidOpenFile.emit({ filePath: props.url });
        });
    }

    render() {
        
        return (
            <Acer
                mode="typescriptlang"
                theme="github"
                onChange={this.onChange}
                name="UNIQUE_ID_OF_DIV"
                editorProps={{$blockScrolling: true}}
              />    
        );
        
        return <div>
            Code to go here : {this.props.url}
        </div>;
    }
    
    
    onChange = (newValue) => {
      console.log('change',newValue)
    }
}


export class CodeTab implements tab.TabInstance {
    constructor(public url: string) {
    }
    getElement = ()=> <Code key={`tabBody:${this.url}`} url={this.url}/>;
    getTitle = () => `${this.url}`;
}