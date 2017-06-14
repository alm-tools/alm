import * as React from "react";
import * as pure from "../../common/pure";
import * as marked from "marked";
import escapeHtml = require("escape-html");

/**
 * Our CSS file
 */
require('./markdown.css');

interface Props { markdown: string }

/**
 * Renders markdown
 */
export class MarkDown extends React.PureComponent<Props, {}> {
    constructor(props: Props) {
        super(props);
    }

    render() {
        const rendered = toHtml(this.props.markdown);

        return (
            <div dangerouslySetInnerHTML={{ __html: rendered }} />
        );
    }
}

/** Converts an html string to markdown */
export function toHtml(markdown: string) {
    return (
        `<div class="alm-markdown-root"> ${
        marked(escapeHtml(markdown))
            // Move hrefs to target blank
            .replace(/a href=/g, "a target='_blank' href=")
            // don't want a trailing newline
            .trim()
            // Make newlines `<br>`s
            .replace(/\n/g, '<br/>')
        }</div>`
    );
}
