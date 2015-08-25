'use strict';

import React = require('react');
import * as ui from "../../ui";
import * as csx from "csx";

var styleTabHeaderContainer = {
    background: 'grey'
}

var styleTabHeader = {
    base: {
        fontFamily:'Roboto, sans-serif',
        paddingLeft: '10px',
        paddingRight: '10px',
        paddingTop: '5px',
        paddingBottom: '5px',
        background: "rgb(66, 66, 66)",
        color: "rgb(150,150,150)",
        borderLeft: '6px solid rgb(88, 88, 88)',
        cursor: 'pointer',
        userSelect: 'none',
        transition: "color .5s, border-left .5s"
    },
};

var styleTabHeaderActive = {
    color: "#6edeef",
    borderLeft: '6px solid #6edeef',
};

export interface Prop {
    selectedIndex: number;
    onTabClicked: (index:number)=>any;
    titles: string[];
    children?: any[];
}
export interface State {
}

@ui.Radium
export class Tabs extends React.Component<Prop,State>{
    constructor(prop:Prop){
        super(prop);
    }
    render(){
        
        let selectedIndex = this.props.selectedIndex;
        let titles = this.props.titles.map((t, i) =>
            <span
            key={`tabHeader ${i}`}
            style={[styleTabHeader.base, i == selectedIndex ? styleTabHeaderActive : {}]}
            onClick={()=>this.onTabClicked(i)}>
            {t}
            </span>
        );
        
        let children = React.Children.map(this.props.children,(c,i)=>{
            let style = (selectedIndex == i ? {} : { display: 'none' });
            return <div style={style}>
                {c}
            </div>
        });
        
        return (
            <div style={[csx.vertical]}>
                <span style={[csx.horizontal, styleTabHeaderContainer]}>
                    {titles}
                </span>
                <div style={[csx.flexRoot]}>
                    {children}
                </div>
            </div>
        );
    }

    onTabClicked = (index) => {
        this.props.onTabClicked(index);
    }
}