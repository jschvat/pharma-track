/**
 * PharmaFormGroup - Standardized Form Field Component
 * 
 * A comprehensive form field component that standardizes all form inputs
 * throughout the PharmaTraK application. Provides consistent validation,
 * styling, error handling, and accessibility features.
 * 
 * Features:
 * - Multiple input types (text, email, password, select, textarea, etc.)
 * - Automatic validation display and error handling
 * - Required field indicators
 * - Help text and tooltips
 * - Consistent spacing and styling
 * - Accessibility enhancements
 * - Integration with form libraries
 * - Custom input components support
 * 
 * @component
 * @author PharmaTraK Development Team
 * @version 1.0.0
 */

import React, { useState, useCallback } from 'react';
import { Form, InputGroup, OverlayTrigger, Tooltip } from 'react-bootstrap';
import '../../css/pharma-components.css';

const PharmaFormGroup = ({
  // Core props
  label,
  name,
  value,
  onChange,
  
  // Input type and configuration
  type = 'text', // text, email, password, number, tel, url, textarea, select, file
  placeholder,
  options = [], // For select inputs
  
  // Validation
  required = false,
  error = null,
  isValid = null,
  isInvalid = null,
  
  // Help and guidance
  helpText = null,
  tooltip = null,
  
  // Layout and styling
  size = 'md', // sm, md, lg
  className = '',
  labelClassName = '',
  inputClassName = '',
  
  // Input group features
  prepend = null, // InputGroup.Text or custom component
  append = null,  // InputGroup.Text or custom component
  
  // Textarea specific
  rows = 3,
  
  // Select specific
  includeBlankOption = false,
  blankOptionText = 'Select an option...',
  
  // File input specific
  accept = null,
  multiple = false,
  
  // Number input specific
  min = null,
  max = null,
  step = null,
  
  // Advanced props
  readOnly = false,
  disabled = false,
  autoComplete = null,
  autoFocus = false,
  
  // Custom input component
  as = null, // Custom component to render instead of Form.Control
  
  // Event handlers
  onBlur,
  onFocus,
  
  // Accessibility
  'aria-describedby': ariaDescribedBy,
  id,
  
  ...otherProps
}) => {
  
  const [isFocused, setIsFocused] = useState(false);
  
  // Generate unique ID if not provided
  const fieldId = id || `pharma-form-${name}`;
  const helpId = helpText ? `${fieldId}-help` : null;
  const errorId = error ? `${fieldId}-error` : null;
  
  // Determine validation state
  const validationState = isInvalid || error ? false : isValid ? true : null;
  
  // Handle focus events
  const handleFocus = useCallback((event) => {
    setIsFocused(true);
    if (onFocus) onFocus(event);
  }, [onFocus]);
  
  const handleBlur = useCallback((event) => {
    setIsFocused(false);
    if (onBlur) onBlur(event);
  }, [onBlur]);
  
  // Render the input based on type
  const renderInput = () => {
    const commonProps = {
      id: fieldId,
      name,
      value: value || '',
      onChange,
      onFocus: handleFocus,
      onBlur: handleBlur,
      placeholder,
      required,
      readOnly,
      disabled,
      autoComplete,
      autoFocus,
      className: `pharma-form-input ${inputClassName}`,
      isValid: validationState === true,
      isInvalid: validationState === false,
      'aria-describedby': [helpId, errorId, ariaDescribedBy].filter(Boolean).join(' ') || undefined,
      ...otherProps
    };
    
    // Custom component
    if (as) {
      return React.createElement(as, commonProps);
    }
    
    // Textarea
    if (type === 'textarea') {
      return (
        <Form.Control
          as="textarea"
          rows={rows}
          {...commonProps}
        />
      );
    }
    
    // Select dropdown
    if (type === 'select') {
      return (
        <Form.Select {...commonProps}>
          {includeBlankOption && (
            <option value="">{blankOptionText}</option>
          )}
          {options.map((option, index) => (
            <option 
              key={option.value || index} 
              value={option.value}
              disabled={option.disabled}
            >
              {option.label || option.text || option.value}
            </option>
          ))}
        </Form.Select>
      );
    }
    
    // File input
    if (type === 'file') {
      return (
        <Form.Control
          type="file"
          accept={accept}
          multiple={multiple}
          {...commonProps}
        />
      );
    }
    
    // Number input with additional props
    if (type === 'number') {
      return (
        <Form.Control
          type="number"
          min={min}
          max={max}
          step={step}
          {...commonProps}
        />
      );
    }
    
    // Standard input types
    return (
      <Form.Control
        type={type}
        {...commonProps}
      />
    );
  };
  
  // Render label with required indicator
  const renderLabel = () => {
    if (!label) return null;
    
    const labelContent = (
      <>
        {label}
        {required && <span className="pharma-form-required" aria-label="required">*</span>}
        {tooltip && (
          <OverlayTrigger
            placement="top"
            overlay={<Tooltip>{tooltip}</Tooltip>}
          >
            <span className="pharma-form-tooltip ms-1">?</span>
          </OverlayTrigger>
        )}
      </>
    );
    
    return (
      <Form.Label 
        htmlFor={fieldId}
        className={`pharma-form-label ${labelClassName}`}
      >
        {labelContent}
      </Form.Label>
    );
  };
  
  // Render help text
  const renderHelpText = () => {
    if (!helpText) return null;
    
    return (
      <Form.Text 
        id={helpId}
        className="pharma-form-help"
        muted
      >
        {helpText}
      </Form.Text>
    );
  };
  
  // Render error message
  const renderError = () => {
    if (!error) return null;
    
    return (
      <Form.Control.Feedback 
        type="invalid"
        id={errorId}
        className="pharma-form-error"
      >
        {error}
      </Form.Control.Feedback>
    );
  };
  
  // Build CSS classes
  const groupClasses = [
    'pharma-form-group',
    `pharma-form-group-${size}`,
    isFocused && 'pharma-form-group-focused',
    validationState === true && 'pharma-form-group-valid',
    validationState === false && 'pharma-form-group-invalid',
    disabled && 'pharma-form-group-disabled',
    readOnly && 'pharma-form-group-readonly',
    className
  ].filter(Boolean).join(' ');
  
  // Render input with or without InputGroup
  const inputElement = renderInput();
  const needsInputGroup = prepend || append;
  
  const wrappedInput = needsInputGroup ? (
    <InputGroup className="pharma-form-input-group">
      {prepend && <InputGroup.Text>{prepend}</InputGroup.Text>}
      {inputElement}
      {append && <InputGroup.Text>{append}</InputGroup.Text>}
    </InputGroup>
  ) : inputElement;
  
  return (
    <Form.Group className={groupClasses}>
      {renderLabel()}
      {wrappedInput}
      {renderHelpText()}
      {renderError()}
    </Form.Group>
  );
};

// Pre-configured form field variants for common use cases
export const EmailField = (props) => (
  <PharmaFormGroup 
    type="email" 
    autoComplete="email"
    {...props} 
  />
);

export const PasswordField = (props) => (
  <PharmaFormGroup 
    type="password" 
    autoComplete="current-password"
    {...props} 
  />
);

export const PhoneField = (props) => (
  <PharmaFormGroup 
    type="tel" 
    autoComplete="tel"
    {...props} 
  />
);

export const NumberField = (props) => (
  <PharmaFormGroup 
    type="number" 
    {...props} 
  />
);

export const TextAreaField = (props) => (
  <PharmaFormGroup 
    type="textarea" 
    {...props} 
  />
);

export const SelectField = (props) => (
  <PharmaFormGroup 
    type="select" 
    includeBlankOption={true}
    {...props} 
  />
);

export const FileField = (props) => (
  <PharmaFormGroup 
    type="file" 
    {...props} 
  />
);

// Specialized pharmacy fields
export const NDCField = (props) => (
  <PharmaFormGroup 
    label="NDC Number"
    placeholder="12345-678-90"
    pattern="[0-9]{4,5}-[0-9]{3,4}-[0-9]{1,2}"
    helpText="Format: 12345-678-90"
    {...props} 
  />
);

export const DEANumberField = (props) => (
  <PharmaFormGroup 
    label="DEA Number"
    placeholder="AB1234567"
    pattern="[A-Z]{2}[0-9]{7}"
    helpText="Format: AB1234567"
    {...props} 
  />
);

export const PharmacyLicenseField = (props) => (
  <PharmaFormGroup 
    label="Pharmacy License"
    {...props} 
  />
);

export default PharmaFormGroup;