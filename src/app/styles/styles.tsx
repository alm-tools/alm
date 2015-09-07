import csx = require('csx');

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
        transition: "color .5s, border-left .5s"
    },
};

export var tabHeaderActive = {
    color: "#6edeef",
    borderLeft: '6px solid #6edeef',
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