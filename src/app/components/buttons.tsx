import * as csx from "csx";
import {textColor} from "../styles/styles";
import * as React from "react";
import * as ui from "../ui";

const activeStyle =  {
    backgroundImage: 'linear-gradient(#353434, #7B7B7B)',
    color: 'white',
}
const buttonBlackStyle = csx.extend(
    csx.flexRoot,
    {
        fontFamily:'sans-serif',
        fontWeight:'bold',
        fontSize:'.6rem',

        transition: '.2s color',

        color: textColor,
        padding: '2px 3px',
        display: 'inline-flex',
        cursor: 'pointer',
        backgroundImage: 'linear-gradient(#7B7B7B, #353434)',
        border: '1px solid #464646',
        userSelect: 'none',
        outline: '0px',
        ':active': activeStyle
    }
);

export const ButtonBlack = ui.Radium((props: { text: string, onClick: () => any, isActive?:boolean }) => {
    const style = csx.extend(buttonBlackStyle, props.isActive ? activeStyle : {});
    return <button onClick={props.onClick} style={style}>{props.text}</button>;
});
