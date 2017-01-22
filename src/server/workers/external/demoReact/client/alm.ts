/**
 * This code is included in the client for react demos
 */
import * as React from 'react';
import * as ReactDOM from 'react-dom';

export function render(content: React.DOMElement<any>) {
    ReactDOM.render(content, document.getElementById('root'));
}
