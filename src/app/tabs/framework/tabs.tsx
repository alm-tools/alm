'use strict';

import React = require('react');
import * as ui from "../../ui";
import * as csx from "csx";
import * as styles from "../../styles/styles";
import {tabHeaderContainer,tabHeader,tabHeaderActive} from "../../styles/styles";

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
            style={[tabHeader.base, i == selectedIndex ? tabHeaderActive : {}]}
            onClick={()=>this.onTabClicked(i)}>
            {t}
            </span>
        );
        
        let children = React.Children.map(this.props.children,(c,i)=>{
            let isSelected = selectedIndex == i;
            let style = ( isSelected ? {} : { display: 'none' });
            return <div style={[style,csx.flex]}>
                {c}
            </div>
        });
        
        return (
            <div style={[csx.vertical,styles.otherThanStatusBar]}>
                <span style={[csx.horizontal, tabHeaderContainer]}>
                    {titles}
                </span>
                {/* overflow visible otherwise display:none makes scroll bars appear a *weird* places */}
                <div style={[csx.vertical, csx.flex, csx.scroll, { overflow: 'visible' }]}>
                    {children}
                </div>
            </div>
        );
    }

    onTabClicked = (index) => {
        this.props.onTabClicked(index);
    }
}