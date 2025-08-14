import React from 'react';
import { Form } from 'react-bootstrap';

/**
 * FormField Component
 * 
 * A reusable form field component that handles common form input patterns
 * with labels, validation, help text, and various input types.
 * 
 * @param {Object} props - Component props
 * @param {string} props.label - Field label text
 * @param {string} props.name - Field name attribute
 * @param {string|number} props.value - Field value
 * @param {function} props.onChange - Change handler function
 * @param {string} [props.type='text'] - Input type (text, email, password, number, tel, etc.)
 * @param {boolean} [props.required=false] - Whether field is required
 * @param {string} [props.placeholder] - Placeholder text
 * @param {string} [props.helpText] - Help text to display below field
 * @param {boolean} [props.disabled=false] - Whether field is disabled
 * @param {string} [props.className] - Additional CSS classes
 * @param {string} [props.size] - Bootstrap form size ('sm' or 'lg')
 * @param {number} [props.rows] - Number of rows for textarea
 * @param {Object[]} [props.options] - Options for select dropdown
 * @param {string} [props.options[].value] - Option value
 * @param {string} [props.options[].label] - Option label
 * @param {boolean} [props.options[].disabled] - Whether option is disabled
 * @param {string} [props.variant] - Form control variant (for error states)
 * @param {string} [props.errorMessage] - Error message to display
 * @param {React.ReactNode} [props.prepend] - InputGroup prepend element
 * @param {React.ReactNode} [props.append] - InputGroup append element
 * @param {Object} [props.inputProps] - Additional props to pass to input element
 */
const FormField = ({
  label,
  name,
  value,
  onChange,
  type = 'text',
  required = false,
  placeholder,
  helpText,
  disabled = false,
  className = 'mb-3',
  size,
  rows,
  options = [],
  variant,
  errorMessage,
  prepend,
  append,
  inputProps = {},
  ...otherProps
}) => {
  const hasError = variant === 'danger' || Boolean(errorMessage);
  const inputClassName = hasError ? 'is-invalid' : '';

  // Handle different onChange patterns
  const handleChange = (e) => {
    if (typeof onChange === 'function') {
      // If onChange expects the full event object
      onChange(e);
    }
  };

  const renderInput = () => {
    // Common input props
    const commonProps = {
      name,
      value: value || '',
      onChange: handleChange,
      required,
      placeholder,
      disabled,
      size,
      className: inputClassName,
      ...inputProps,
      ...otherProps
    };

    // Render different input types
    switch (type) {
      case 'textarea':
        return (
          <Form.Control
            as="textarea"
            rows={rows || 3}
            {...commonProps}
          />
        );

      case 'select':
        return (
          <Form.Select {...commonProps}>
            {options.map((option, index) => (
              <option 
                key={option.value || index} 
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </Form.Select>
        );

      default:
        return (
          <Form.Control
            type={type}
            {...commonProps}
          />
        );
    }
  };

  const renderField = () => {
    if (prepend || append) {
      return (
        <div className="input-group">
          {prepend}
          {renderInput()}
          {append}
        </div>
      );
    }
    return renderInput();
  };

  return (
    <Form.Group className={className}>
      {label && (
        <Form.Label>
          {label}
          {required && <span className="text-danger ms-1">*</span>}
        </Form.Label>
      )}
      
      {renderField()}
      
      {errorMessage && (
        <Form.Control.Feedback type="invalid" style={{ display: 'block' }}>
          {errorMessage}
        </Form.Control.Feedback>
      )}
      
      {helpText && !errorMessage && (
        <Form.Text className="text-muted">
          {helpText}
        </Form.Text>
      )}
    </Form.Group>
  );
};

export default FormField;