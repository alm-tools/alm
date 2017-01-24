import * as React from 'react';

export const Indicator = ({ color }: { color: string }) => {
    return (
        <svg height={"10px"} width={"10px"} viewBox="0 0 10 10" style={{
            boxShadow: `0px 0px 28px 0px ${color}`
        }}>
            <circle fill={color} r={5} cx={5} cy={5} />
        </svg>
    );
}
