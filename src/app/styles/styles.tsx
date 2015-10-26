import csx = require('csx');

export let errorColor = '#f92672';
export let successColor = '#73c990';

export var tabHeaderContainer = {
    background: 'grey'
}

export var tabHeader = {
    base: {
        fontFamily: 'Roboto, sans-serif',
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
    },
};

export var tabHeaderActive = {
    color: "#6edeef",
    borderLeft: '6px solid #6edeef',
};

export var tabHeaderUnsaved = {
    background: "#777",
};

export var userTip = {
    fontSize: '.9em'
}

export var keyStroke = csx.extend(userTip, {
    background: 'grey',
    color: 'white',
    padding: '2px',
    borderRadius: '5px'
});


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
export let paddedTopBottom1 = {
    paddingTop: padded1.padding,
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
        color: '#73c990'
    }
    export let main = {
        color: '#999',
        fontFamily: codeFont.fontFamily,
        padding: '6px',
        borderTop: '2px solid grey',
        height: '150px',
        overflow: 'auto'
    }

    export let filePath = {
        fontSize: '1rem',
        fontWeight: 'bold',
        padding: '3px',
        cursor: hand.cursor,
    }

    export let perFileList = {
        paddingLeft: '6px',
        borderLeft: '6px solid #f92672'
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
    }
}
