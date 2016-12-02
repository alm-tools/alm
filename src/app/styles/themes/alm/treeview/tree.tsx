"use strict";
import * as typestyle from 'typestyle';
import * as csx from '../../../../base/csx';
import * as baseStyles from "../base";

export let resizerWidth = 5;
export let resizerStyle = {
    background: '#333',
    width: resizerWidth+'px',
    cursor:'ew-resize',
    color: '#666',
}

export let treeListStyle = {
    color: '#eee',
    fontSize:'.9rem',
    padding:'0px',
    fontFamily: 'Open Sans, Segoe UI, sans-serif'
}

export let treeScrollClassName = typestyle.style({
    borderBottom: '1px solid #333',
    '&:focus': {
        outline: 'none',
        border: '1px solid ' + baseStyles.highlightColor
    }
})

export let treeItemClassName = typestyle.style({
    whiteSpace: 'nowrap',
    cursor:'pointer',
    padding: '3px',
    userSelect: 'none',
    fontSize: '.9em',
    opacity: .8,
    '&:focus': {
        outline: 'none',
    }
})

export let treeItemSelectedStyle = {
    backgroundColor:baseStyles.selectedBackgroundColor,
}

export let treeItemInProjectStyle = {
    color: 'rgb(0, 255, 183)',
    opacity: 1,
}

export let treeItemIsGeneratedStyle = {
    fontSize: '.6em'
}

export let currentSelectedItemCopyStyle = {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'pre', // Prevents wrapping

    cursor: 'pointer',
    marginLeft: '2px',
    fontSize: '.6rem',
    fontWeight: 'bold',
    color: '#CCC',
    textShadow: '0 0 3px rgba(255, 255, 255, 0.5)',
}

export let helpRowStyle = {
    margin: '5px',
    lineHeight: '18px'
}

export let clipboardButtonClassName = typestyle.style({
    height: '18px',
    padding: '2px 3px',
    display: 'inline-flex',
    cursor: 'pointer',
    backgroundImage: 'linear-gradient(#7B7B7B, #353434)',
    border: '1px solid #464646',
    borderRadius: '3px',
    userSelect: 'none',
    outline: '0px',

    '&:active': {
        backgroundImage: 'linear-gradient(#353434, #7B7B7B)',
    }
});

export let clippy = {
    width: '12px',
    height: '12px'
}

export let clipboardPathStyle = csx.extend(
    csx.centerJustified,
    {paddingTop: '5px',
    paddingBottom: '5px'}
)
