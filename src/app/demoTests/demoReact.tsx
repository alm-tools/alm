import * as React from 'react';

const SuccessButton
    = (props) => (
        <button
            {...props}
            style={{ color: 'green' }}
        />
    );

/** Quickly render the component to test it */
render(<SuccessButton>Hello world</SuccessButton>);
