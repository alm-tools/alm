/**
 * This code is included in the client for react demos
 */
import * as React from 'react';
import * as ReactDOM from 'react-dom';
namespace alm {
    export function render(content: any) {
        ReactDOM.render(content, document.getElementById('root'));
    }
}
