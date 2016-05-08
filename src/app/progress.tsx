import * as React from "react";

interface Props extends React.Props<any> { current: number, total: number }

export class Progress extends React.Component<Props, {}> {
    render() {

        const {current, total} = this.props;
        let percent = total == 0 ? 100 : (current / total * 100);
        if (percent < 0) { percent = 0 };

        var parentStyle = {
            textAlign: 'center',
            fontSize: '.6em',
            fontWeight: 'bold',
            color: 'white',
            border: '1px solid white',
        };
        const childStyle = {
            backgroundColor: '#0BD318',
            width: percent + '%',
            transition: "width 200ms",
            padding: '5px 10px',
        };

        return (
            <div className="progressbar-container" style={parentStyle}>
                <div className="progressbar-progress" style={childStyle}>{this.props.children}</div>
            </div>
        );
    }
}
