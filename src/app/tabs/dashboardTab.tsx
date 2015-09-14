/* 
import * as ui from "../ui";
import * as React from "react";
import * as tab from "./tab";

export interface Props extends tab.ComponentProps {
}
export interface State {
}

export class DashBoard extends React.Component<Props, State> implements tab.TabComponent {
    constructor(props: Props) {
        super(props);
        this.state = {

        };
    }

    render() {
        return <div>
            <div>Dashboard to go here : {this.props.url}</div>
            <div>Dashboard to go here : {this.props.url}</div>
            <div>Dashboard to go here : {this.props.url}</div>
            <div>Dashboard to go here : {this.props.url}</div>
            <div>Dashboard to go here : {this.props.url}</div>
            <div>Dashboard to go here : {this.props.url}</div>
            <div>Dashboard to go here : {this.props.url}</div>
            <div>Dashboard to go here : {this.props.url}</div>
            <div>Dashboard to go here : {this.props.url}</div>
            <div>Dashboard to go here : {this.props.url}</div>
            <div>Dashboard to go here : {this.props.url}</div>
            <div>Dashboard to go here : {this.props.url}</div>
            <div>Dashboard to go here : {this.props.url}</div>
            <div>Dashboard to go here : {this.props.url}</div>
            <div>Dashboard to go here : {this.props.url}</div>
            <div>Dashboard to go here : {this.props.url}</div>
            <div>Dashboard to go here : {this.props.url}</div>
            <div>Dashboard to go here : {this.props.url}</div>
            <div>Dashboard to go here : {this.props.url}</div>
            <div>Dashboard to go here : {this.props.url}</div>
            <div>Dashboard to go here : {this.props.url}</div>
            <div>Dashboard to go here : {this.props.url}</div>
            <div>Dashboard to go here : {this.props.url}</div>
            <div>Dashboard to go here : {this.props.url}</div>
            <div>Dashboard to go here : {this.props.url}</div>
            <div>Dashboard to go here : {this.props.url}</div>
            <div>Dashboard to go here : {this.props.url}</div>
            <div>Dashboard to go here : {this.props.url}</div>
            <div>Dashboard to go here : {this.props.url}</div>
            <div>Dashboard to go here : {this.props.url}</div>
            <div>Dashboard to go here : {this.props.url}</div>
            <div>Dashboard to go here : {this.props.url}</div>
            <div>Dashboard to go here : {this.props.url}</div>
            <div>Dashboard to go here : {this.props.url}</div>
            <div>Dashboard to go here : {this.props.url}</div>
            <div>Dashboard to go here : {this.props.url}</div>
            <div>Dashboard to go here : {this.props.url}</div>
            <div>Dashboard to go here : {this.props.url}</div>
            <div>Dashboard to go here : {this.props.url}</div>
            <div>Dashboard to go here : {this.props.url}</div>
            <div>Dashboard to go here : {this.props.url}</div>
            <div>Dashboard to go here : {this.props.url}</div>
            <div>Dashboard to go here : {this.props.url}</div>
            <div>Dashboard to go here : {this.props.url}</div>
            <div>Dashboard to go here : {this.props.url}</div>
            <div>Dashboard to go here : {this.props.url}</div>
            <div>Dashboard to go here : {this.props.url}</div>
            <div>Dashboard to go here : {this.props.url}</div>
            <div>Dashboard to go here : {this.props.url}</div>
            <div>Dashboard to go here : {this.props.url}</div>
            <div>Dashboard to go here : {this.props.url}</div>
            <div>Dashboard to go here : {this.props.url}</div>
            <div>Dashboard to go here : {this.props.url}</div>
            <div>Dashboard to go here : {this.props.url}</div>
            <div>Dashboard to go here : {this.props.url}</div>
            <div>Dashboard to go here : {this.props.url}</div>
            <div>Dashboard to go here : {this.props.url}</div>
            <div>Dashboard to go here : {this.props.url}</div>
            <div>Dashboard to go here : {this.props.url}</div>
            <div>Dashboard to go here : {this.props.url}</div>
            <div>Dashboard to go here : {this.props.url}</div>
            <div>Dashboard to go here : {this.props.url}</div>
            <div>Dashboard to go here : {this.props.url}</div>
            <div>Dashboard to go here : {this.props.url}</div>
            <div>Dashboard to go here : {this.props.url}</div>
            <div>Dashboard to go here : {this.props.url}</div>
            <div>Dashboard to go here : {this.props.url}</div>
            <div>Dashboard to go here : {this.props.url}</div>
            <div>Dashboard to go here : {this.props.url}</div>
            <div>Dashboard to go here : {this.props.url}</div>
            <div>Dashboard to go here : {this.props.url}</div>
            <div>Dashboard to go here : {this.props.url}</div>
            <div>Dashboard to go here : {this.props.url}</div>
            <div>Dashboard to go here : {this.props.url}</div>
            <div>Dashboard to go here : {this.props.url}</div>
            <div>Dashboard to go here : {this.props.url}</div>
            <div>Dashboard to go here : {this.props.url}</div>
            <div>Dashboard to go here : {this.props.url}</div>
            <div>Dashboard to go here : {this.props.url}</div>
            <div>Dashboard to go here : {this.props.url}</div>
            <div>Dashboard to go here : {this.props.url}</div>
            <div>Dashboard to go here : {this.props.url}</div>
            <div>Dashboard to go here : {this.props.url}</div>
            <div>Dashboard to go here : {this.props.url}</div>
            <div>Dashboard to go here : {this.props.url}</div>
            <div>Dashboard to go here : {this.props.url}</div>
            <div>Dashboard to go here : {this.props.url}</div>
            <div>Dashboard to go here : {this.props.url}</div>
            <div>Dashboard to go here : {this.props.url}</div>
            <div>Dashboard to go here : {this.props.url}</div>
            <div>Dashboard to go here : {this.props.url}</div>
            <div>Dashboard to go here : {this.props.url}</div>
            <div>Dashboard to go here : {this.props.url}</div>
            <div>Dashboard to go here : {this.props.url}</div>
            <div>Dashboard to go here : {this.props.url}</div>
            <div>Dashboard to go here : {this.props.url}</div>
            <div>Dashboard to go here : {this.props.url}</div>
            <div>Dashboard to go here : {this.props.url}</div>
            <div>Dashboard to go here : {this.props.url}</div>
            <div>Dashboard to go here : {this.props.url}</div>
            <div>Dashboard to go here : {this.props.url}</div>
            <div>Dashboard to go here : {this.props.url}</div>
            <div>Dashboard to go here : {this.props.url}</div>
            <div>Dashboard to go here : {this.props.url}</div>
            <div>Dashboard to go here : {this.props.url}</div>
            <div>Dashboard to go here : {this.props.url}</div>
            <div>Dashboard to go here : {this.props.url}</div>
            <div>Dashboard to go here : {this.props.url}</div>
            <div>Dashboard to go here : {this.props.url}</div>
            <div>Dashboard to go here : {this.props.url}</div>
            <div>Dashboard to go here : {this.props.url}</div>
            <div>Dashboard to go here : {this.props.url}</div>
            <div>Dashboard to go here : {this.props.url}</div>
            <div>Dashboard to go here : {this.props.url}</div>
            <div>Dashboard to go here : {this.props.url}</div>
            <div>Dashboard to go here : {this.props.url}</div>
            <div>Dashboard to go here : {this.props.url}</div>
            <div>Dashboard to go here : {this.props.url}</div>
            <div>Dashboard to go here : {this.props.url}</div>
            <div>Dashboard to go here : {this.props.url}</div>
            <div>Dashboard to go here : {this.props.url}</div>
            <div>Dashboard to go here : {this.props.url}</div>
            <div>Dashboard to go here : {this.props.url}</div>
            </div>;
    }
    
    focus(){}
    save(){}
}


export class DashboardTab implements tab.TabInstance {
    constructor(public url: string) {
    }
    getElement = (index: number) => <DashBoard ref={tab.getRef(this.url, index) } key={tab.getRef(this.url, index)} url={this.url}/>;
    getTitle = () => `${this.url}`;
}
*/