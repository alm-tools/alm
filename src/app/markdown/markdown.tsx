import * as React from "react";
import * as pure from "../../common/pure";
import * as marked from "marked";

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
            <div dangerouslySetInnerHTML={{ __html: rendered }} />
        );
    }

    toHtml(markdown: string) {
        return marked(markdown);
    }
}
