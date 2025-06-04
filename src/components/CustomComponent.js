import React from 'react';
import PropTypes from 'prop-types';

// CustomComponent is a react component that renders a custom UI element.
// It receives props and handles internal state using the useState hook.
function CustomComponent({ label, onClick }) {
    const [value, setValue] = React.useState('');

    // handleInputChange is an event handler for the input change event.
    // It updates the component's state with the new input value.
    function handleInputChange(event) {
        setValue(event.target.value);
    }

    return (
        <div>
            <label>{label}</label>
            <input value={value} onChange={handleInputChange} />
            <button onClick={onClick}>Submit</button>
        </div>
    );
}

CustomComponent.propTypes = {
    label: PropTypes.string.isRequired,
    onClick: PropTypes.func.isRequired,
};

export default CustomComponent;
