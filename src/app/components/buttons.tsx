import * as csx from "../base/csx";
import {textColor} from "../styles/themes/current/base";
import * as React from "react";
import * as ui from "../ui";
import * as typestyle from "typestyle";

const activeStyle =  {
    backgroundImage: 'linear-gradient(#353434, #7B7B7B)',
    color: 'white',
}
const disabledStyle =  {
    opacity: '.5',
}
const buttonBlackClassName = typestyle.style(
    csx.flexRoot,
    {
        fontFamily:'sans-serif',
        fontWeight:'bold',
        fontSize:'.6rem',

        transition: '.2s color, .2s opacity',

        color: textColor,
        padding: '2px 3px',
        display: 'inline-flex',
        cursor: 'pointer',
        backgroundImage: 'linear-gradient(#7B7B7B, #353434)',
        border: '1px solid #464646',
        userSelect: 'none',
        outline: '0px',
    },
    {
        '&:active': activeStyle
    }
);

export const ButtonBlack = (props: { text: string, onClick: () => any, isActive?:boolean, disabled?: boolean }) => {
    const style = csx.extend(props.isActive ? activeStyle : {}, props.disabled ? disabledStyle : {});
    return <button className={buttonBlackClassName} onClick={props.onClick} style={style} disabled={props.disabled}>{props.text}</button>;
};
