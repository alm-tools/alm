const waitForMonaco = () => {
    if (typeof monaco === 'undefined') {
        requestAnimationFrame(waitForMonaco);
    }
    else {
        require('./trueMain');
    }
}

document.addEventListener('DOMContentLoaded', waitForMonaco);
