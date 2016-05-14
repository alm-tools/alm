import * as csx from "csx";
import {textColor} from "../styles/styles";
import * as React from "react";
import * as ui from "../ui";
import * as styles from "../styles/styles";

const inputBlackStyle = csx.extend(styles.modal.inputStyle, {
    fontSize: '.7rem',
    lineHeight: '.7rem',
    fontFamily: 'sans-serif',
    flex: '1',
});

export const InputBlack = ui.Radium((props: {
    value: string,
    onChange: (value: string) => any,
    onKeyDown?: () => any,
    placeholder?: string,
}) => {
    return (
        <input
            style={inputBlackStyle}
            type="text"
            placeholder={props.placeholder}
            value={props.value}
            onChange={(e)=>props.onChange((e.target as HTMLInputElement).value)}
            onKeyDown={props.onKeyDown}
        />
    );
});
