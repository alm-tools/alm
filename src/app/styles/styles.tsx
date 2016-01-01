import csx = require('csx');

export let errorColor = '#f92672';
export let successColor = '#00c990';

export var tabHeaderContainer = {
    background: 'grey'
}

export var tabHeader = {
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
    color: "#6edeef",
    borderLeft: '6px solid #6edeef',
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

export let codeFont = {
    fontFamily: 'monospace'
}

export namespace errorsPanel {
    export let success = {
        color: successColor
    }
    export let main = {
        color: '#999',
        fontFamily: codeFont.fontFamily,
        padding: '6px',
        overflow: 'auto',
    }

    export let filePath = {
        fontSize: '1rem',
        fontWeight: 'bold',
        padding: '8px 8px 8px 0px',
        cursor: hand.cursor,
    }

    export let perFileList = {
        paddingLeft: '6px',
        borderLeft: '6px solid ' + errorColor
    }

    export let errorDetailsContainer = {
        padding: '3px',
    }
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
    export let inputStyle = {
        backgroundColor: 'rgb(42,42,42)',
        color: 'white',
        outline: 'none',
        padding: '2px',
        fontSize: '1.5rem',
        lineHeight: '2rem',
        fontFamily: 'monospace',

        border: '3px solid #3C3C3C',
        transition: 'border .2s',
        ':focus':{
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
    export let inputBlackStyle = {
        backgroundColor: '#333',
        color: 'white',
        outline: 'none',
        padding: '2px',
        border: '2px solid #3C3C3C',
        transition: 'border .2s',
        ':focus':{
            border: '2px solid #0090E0',
            boxShadow: '0px 0px 1px 1px #0090E0'
        }
    }
}

/**
 * Some views have tips at the bottom. This for that
 */
export namespace Tip {
    export const root = csx.extend({
        color: 'grey',
        lineHeight: '1.5rem'
    }, padded1);

    export const keyboardShortCutStyle = {
        border: '2px solid',
        borderRadius: '6px',
        padding: '2px',
        fontSize: '.7rem',
        backgroundColor: 'black',
    }
}

/**
 * For when you don't want anything on focus
 */
export const noFocusOutline = {
    ":focus":{
        outline: 'none'
    }
}
