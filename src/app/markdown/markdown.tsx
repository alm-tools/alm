import * as React from "react";
import * as pure from "../../common/pure";
import * as marked from "marked";

/**
 * Our CSS file
 */
require('./markdown.css');

interface Props { markdown: string }

/**
 * Renders markdown
 */
export class MarkDown extends React.Component<Props, {}> {
    constructor(props: Props) {
        super(props);
    }

    shouldComponentUpdate = pure.shouldComponentUpdate;
    render() {
        const rendered = this.toHtml(this.props.markdown);

        return (
            <div className="alm-markdown-root" dangerouslySetInnerHTML={{ __html: rendered }} />
        );
    }

    toHtml(markdown: string) {
        return (
            marked(markdown)
                // Move hrefs to target blank
                .replace(/a href=/g, "a target='_blank' href=")
                // don't want a trailing newline
                .trim()
                // Make newlines `<br>`s
                .replace(/\n/g, '<br/>')
        );
    }
}
