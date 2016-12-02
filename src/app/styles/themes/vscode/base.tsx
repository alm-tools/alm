import * as csx from '../../../base/csx';
import {cssRule} from 'typestyle';

export const textColor = '#BBB';
export let errorColor = '#f92672';
export let warningColor = '#f6d675'; // Color from CodeMirror `lint.css` warning squiggly color
export let successColor = '#00c990';
export let highlightColor = "#6edeef";
export let selectedBackgroundColor = '#3f3f46';
export const monokaiBackgroundColor = '#1e1e1e';
export const monokaiTextColor = "#e6db74"; // The color of strings

/**
 * FA Icon names used in the application
 */
export const icons = {
    tested: 'futbol-o',
    testedSuite: 'pagelines', // http://fontawesome.io/icon/pagelines/
    testedTest: 'leaf',// http://fontawesome.io/icon/leaf/
}

/**
 * A background color that looks nice over the "editor" background black
 */
export const blackHighlightColor = "#1C1D18"

/**
 * If you expect a child to scroll you need to tell it that I will not give you a scroll bar
 */
export var someChildWillScroll: NestedCSSProperties = {
    overflow: 'hidden'
}

export var tabHeaderContainer = {
    background: 'grey'
}

export var tabHeader = {
    fontSize: '.8em',
    fontFamily: 'Roboto, sans-serif',
    fontWeight: 'bold',
    paddingLeft: '10px',
    paddingRight: '10px',
    paddingTop: '5px',
    paddingBottom: '5px',
    background: "rgb(66, 66, 66)",
    color: "rgb(150,150,150)",
    borderLeft: '6px solid rgb(88, 88, 88)',
    cursor: 'pointer',
    userSelect: 'none',
    transition: "color .5s, border-left .5s, background .5s"
};

export var tabHeaderActive = {
    color: highlightColor,
    borderLeft: `6px solid ${highlightColor}`,
};

export var tabHeaderUnsaved = {
    background: "#777",
};

export let fullWindow = {
    position: 'absolute',
    left: '10px',
    right: '10px',
    top: '10px',
    bottom: '10px',
};

export let padded1 = {
    padding: '.25rem'
};
export let padded1TopBottom = {
    paddingTop: padded1.padding,
    paddingBottom: padded1.padding
};
export let padded1LeftRightBottom = {
    paddingLeft: padded1.padding,
    paddingRight: padded1.padding,
    paddingBottom: padded1.padding
};
export let padded2 = {
    padding: '.5rem'
};

export let fullSize = {
    width: '100%',
    height: '100%',
}

const statusBarHeight = 25;
export let statusBar = {
    height: `${statusBarHeight}px`,
    color: '#999',
    paddingLeft: '3px',
    paddingRight: '3px',
    fontSize: '12px',
    border: '1px solid #999',
}
export let statusBarSection = {
    paddingLeft: '3px',
    paddingRight: '3px',
}
export let statusBarError = {
    color: errorColor
}
export let statusBarSuccess = {
    color: successColor
}

export var noSelect = {
    userSelect: 'none',
    cursor: 'default'
}

export let hand = {
    cursor: 'pointer',
}

export let noWrap = {
    whiteSpace: 'nowrap',
}

export let codeFont = {
    fontFamily: 'monospace'
}

export namespace errorsPanel {
    export let success = {
        color: successColor
    }
    export let main = {
        color: textColor,
        fontFamily: codeFont.fontFamily,
        padding: '6px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
    }

    export const headerSection = {
        flexShrink: 0,
        marginBottom: '5px',
    }

    export const tooMany = {
        fontSize: '1.2rem',
        fontWeight: 'bolder',
    }

    export let filePath = {
        fontSize: '1rem',
        fontWeight: 'bold',
        padding: '8px 8px 8px 0px',
        cursor: hand.cursor,
    }

    export let perFileList = {
    }

    const itemDetailsContainer = csx.extend(
        hand, {
            padding: '3px'
        }
    );
    export let errorDetailsContainer = csx.extend(
        itemDetailsContainer,
        {
            borderLeft: '6px solid ' + errorColor

        }
    );
    export let warningDetailsContainer = csx.extend(
        itemDetailsContainer,
        {
            borderLeft: '6px solid ' + warningColor
        }
    );

    export let errorDetailsContent = {
        padding: '3px',
    }
    export let errorMessage = {
        paddingBottom: '3px',
        cursor: 'pointer',
        userSelect: 'none',
    }

    export let errorPreview = {
        padding: '3px',
        background: 'black',
        border: '2px solid #999',
        cursor: 'pointer',
    }
}

/**
 * Used by all our modals
 */
export namespace modal {
    /** Keyboard shortcuts */
    export var keyStrokeStyle = {
        fontSize: '0.9rem',
        background: '#111',
        paddingTop: '1px',
        paddingBottom: '1px',
        paddingLeft: '4px',
        paddingRight: '4px',
        borderRadius: '5px',
        border: '2px solid'
    };

    /** Big input */
    export let inputStyleBase = {
        backgroundColor: 'rgb(42,42,42)',
        color: 'white',
        outline: 'none',
        padding: '2px',
        fontSize: '1.5rem',
        lineHeight: '2rem',
        fontFamily: 'monospace',

        border: '3px solid #3C3C3C',
        transition: 'border .2s',
        '&:focus':{
            boxShadow: '0px 0px 1px 1px #3C3C3C'
        }
    }

    /** The container around code samples */
    export let previewContainerStyle = {
        background: tabHeader.background,
        padding: '5px',
    }
}

/** Sometimes we need a keyboard input to handle our keyboard events but not be visible in any way */
export let hiddenInput = {
    height: '0px',
    width: '0px',
    color: 'transparent',
    background: 'transparent',
    position: 'absolute',
    top: '0px'
}

export namespace Input {
    export let inputBlackStyleBase = {
        backgroundColor: '#333',
        color: 'white',
        outline: 'none',
        padding: '2px',
        border: '2px solid #3C3C3C',
        transition: 'border .2s',
        '&:focus':{
            border: '2px solid #0099E0',
            boxShadow: '0px 0px 1px 1px #0099E0'
        }
    }
}

/**
 * Some views have tips at the bottom. This for that
 */
export namespace Tip {
    export const root = csx.extend({
        color: 'grey',
        lineHeight: '1.5rem',
        fontSize: '.8rem',
    }, padded1);

    export const keyboardShortCutStyle = {
        border: '2px solid',
        borderRadius: '6px',
        padding: '2px',
        backgroundColor: 'black',
    }
}

/**
 * For when you don't want anything on focus
 */
export const noFocusOutlineBase = {
    "&:focus":{
        outline: 'none'
    }
}

/**
 * When you want text ellipsis
 * Note: whitespace no wrap is significant
 * Note: you probably want a limited width on the parent
 */
export const ellipsis = {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
}


/**
 * body bg
 */

cssRule('body',{ backgroundColor: '#252526 !important'})

/**
 * Scroll bar for chrome
 */

cssRule('::-webkit-scrollbar',{ width: '8px', height: '8px' })
cssRule('::-webkit-scrollbar-track',{ backgroundColor: 'transparent' })
cssRule('::-webkit-scrollbar-thumb',{ background: 'rgba(121, 121, 121, .2)',
        border: '0px none #ffffff',
        borderRadius: '0px',
         })
cssRule('::-webkit-scrollbar-thumb:hover',{background: 'rgba(121, 121, 121, .5)'})
cssRule('::-webkit-scrollbar-corner',{ background: 'transparent' })
