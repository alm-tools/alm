import * as ui from "../ui";
import * as React from "react";
import * as tab from "./tab";

export interface Props extends tab.ComponentProps {
}
export interface State {
}

export class DashBoard extends React.Component<Props, State>  {
    constructor(props: Props) {
        super(props);
        this.state = {

        };
    }

    render() {
        return <div>
            Dashboard to go here : {this.props.url}
            </div>;
    }
}


export class DashboardTab implements tab.TabInstance {
    constructor(public url: string) {
    }
    Component = DashBoard;
    getTitle = () => `${this.url}`;
}