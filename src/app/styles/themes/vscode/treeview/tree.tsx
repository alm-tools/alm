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
    color: '#666',
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
    background: 'transparent',
    border: '0px solid #464646',
    borderRadius: '3px',
    userSelect: 'none',
    outline: '0px',

    '&:active': {
        background: '#464646',
    }
});

export let clippy = {
    width: '12px',
    height: '12px'
}

export let clipboardPathStyle = {
    paddingTop: '5px',
    paddingLeft: '5px',
    paddingBottom: '5px'
}
