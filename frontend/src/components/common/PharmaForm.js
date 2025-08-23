/**
 * PharmaForm - Comprehensive Form Management Component
 * 
 * A complete form wrapper that handles validation, submission, loading states,
 * and pharmacy-specific functionality. Integrates seamlessly with PharmaFormGroup
 * and provides advanced features like auto-save, multi-step forms, and field dependencies.
 * 
 * Features:
 * - Automatic validation with pharmacy-specific rules
 * - Loading states and submission handling
 * - Multi-step form support with progress tracking
 * - Auto-save functionality with debouncing
 * - Field dependencies and conditional rendering
 * - Integration with PharmaFormGroup components
 * - Error handling and success feedback
 * - Keyboard shortcuts and accessibility
 * 
 * @component
 * @author PharmaTraK Development Team
 * @version 1.0.0
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Form, Row, Col } from 'react-bootstrap';
import { PharmaButton, PharmaAlert, PharmaCard, PharmaProgressBar } from './PharmaComponents';
import PharmaFormGroup from './PharmaFormGroup';
import '../../css/pharma-components.css';

const PharmaForm = ({
  // Core form props
  children,
  onSubmit,
  onValidate = null,
  initialValues = {},
  
  // Form layout and behavior
  layout = 'vertical', // 'vertical', 'horizontal', 'inline'
  columns = 1, // Number of columns for field layout
  spacing = 'normal', // 'compact', 'normal', 'relaxed'
  
  // Validation
  validationRules = {},
  validateOnChange = true,
  validateOnBlur = true,
  showValidationSummary = true,
  
  // Multi-step functionality
  steps = null, // Array of step configurations
  currentStep = 0,
  onStepChange = null,
  showProgress = false,
  
  // Auto-save
  autoSave = false,
  autoSaveDelay = 2000,
  onAutoSave = null,
  
  // Loading and submission
  loading = false,
  disabled = false,
  submitText = 'Submit',
  cancelText = 'Cancel',
  
  // Actions and buttons
  showSubmitButton = true,
  showCancelButton = false,
  showResetButton = false,
  onCancel = null,
  onReset = null,
  additionalActions = [],
  
  // Card wrapper
  wrapped = true,
  title = null,
  subtitle = null,
  
  // Error handling
  errors = {},
  globalError = null,
  successMessage = null,
  
  // Styling
  className = '',
  formClassName = '',
  
  // Accessibility
  'aria-label': ariaLabel = 'Form',
  id = `pharma-form-${Math.random().toString(36).substr(2, 9)}`,
  
  ...otherProps
}) => {
  
  const [formData, setFormData] = useState(initialValues);
  const [formErrors, setFormErrors] = useState(errors);
  const [isDirty, setIsDirty] = useState(false);
  const [touchedFields, setTouchedFields] = useState(new Set());
  const autoSaveTimeoutRef = useRef(null);
  const formRef = useRef(null);
  
  // Merge external errors with internal errors
  const allErrors = { ...formErrors, ...errors };
  
  // Validation function
  const validateField = useCallback((fieldName, value, allValues = formData) => {
    const rules = validationRules[fieldName];
    if (!rules) return null;
    
    // Built-in validation rules
    const validators = {
      required: (val) => !val || val.toString().trim() === '' ? 'This field is required' : null,
      email: (val) => val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) ? 'Invalid email address' : null,
      phone: (val) => val && !/^[\+]?[(]?[0-9\s\-\(\)]{10,}$/.test(val) ? 'Invalid phone number' : null,
      ndc: (val) => val && !/^\d{4,5}-\d{3,4}-\d{1,2}$/.test(val) ? 'Invalid NDC format (XXXXX-XXXX-XX)' : null,
      dea: (val) => val && !/^[A-Z]{2}\d{7}$/.test(val) ? 'Invalid DEA number format' : null,
      zip: (val) => val && !/^\d{5}(-\d{4})?$/.test(val) ? 'Invalid ZIP code' : null,
      min: (val, min) => val && parseFloat(val) < min ? `Minimum value is ${min}` : null,
      max: (val, max) => val && parseFloat(val) > max ? `Maximum value is ${max}` : null,
      minLength: (val, len) => val && val.length < len ? `Minimum length is ${len} characters` : null,
      maxLength: (val, len) => val && val.length > len ? `Maximum length is ${len} characters` : null,
      pattern: (val, regex) => val && !new RegExp(regex).test(val) ? 'Invalid format' : null,
      custom: (val, validator) => validator(val, allValues)
    };
    
    // Run validation rules
    for (const [ruleName, ruleValue] of Object.entries(rules)) {
      if (validators[ruleName]) {
        const error = validators[ruleName](value, ruleValue);
        if (error) return error;
      }
    }
    
    return null;
  }, [validationRules, formData]);
  
  // Validate entire form
  const validateForm = useCallback(() => {
    const errors = {};
    let isValid = true;
    
    // Validate each field
    Object.keys(validationRules).forEach(fieldName => {
      const error = validateField(fieldName, formData[fieldName]);
      if (error) {
        errors[fieldName] = error;
        isValid = false;
      }
    });
    
    // Custom form-level validation
    if (onValidate) {
      const customErrors = onValidate(formData);
      if (customErrors && Object.keys(customErrors).length > 0) {
        Object.assign(errors, customErrors);
        isValid = false;
      }
    }
    
    setFormErrors(errors);
    return isValid;
  }, [formData, validationRules, validateField, onValidate]);
  
  // Handle field changes
  const handleFieldChange = useCallback((fieldName, value) => {
    const newFormData = { ...formData, [fieldName]: value };
    setFormData(newFormData);
    setIsDirty(true);
    
    // Validate on change if enabled
    if (validateOnChange) {
      const error = validateField(fieldName, value, newFormData);
      setFormErrors(prev => ({
        ...prev,
        [fieldName]: error
      }));
    }
    
    // Auto-save functionality
    if (autoSave && onAutoSave) {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      autoSaveTimeoutRef.current = setTimeout(() => {
        onAutoSave(newFormData);
      }, autoSaveDelay);
    }
  }, [formData, validateOnChange, validateField, autoSave, onAutoSave, autoSaveDelay]);
  
  // Handle field blur
  const handleFieldBlur = useCallback((fieldName) => {
    setTouchedFields(prev => new Set(prev).add(fieldName));
    
    if (validateOnBlur) {
      const error = validateField(fieldName, formData[fieldName]);
      setFormErrors(prev => ({
        ...prev,
        [fieldName]: error
      }));
    }
  }, [validateOnBlur, validateField, formData]);
  
  // Handle form submission
  const handleSubmit = useCallback((event) => {
    event.preventDefault();
    
    if (!onSubmit) return;
    
    const isValid = validateForm();
    if (isValid) {
      onSubmit(formData, { reset: () => setFormData(initialValues) });
    }
  }, [onSubmit, formData, validateForm, initialValues]);
  
  // Handle form reset
  const handleReset = useCallback(() => {
    setFormData(initialValues);
    setFormErrors({});
    setTouchedFields(new Set());
    setIsDirty(false);
    if (onReset) onReset();
  }, [initialValues, onReset]);
  
  // Multi-step functionality
  const handleStepChange = useCallback((newStep) => {
    if (onStepChange) {
      onStepChange(newStep, formData);
    }
  }, [onStepChange, formData]);
  
  // Render validation summary
  const renderValidationSummary = () => {
    if (!showValidationSummary) return null;
    
    const errorMessages = Object.values(allErrors).filter(Boolean);
    if (errorMessages.length === 0) return null;
    
    return (
      <PharmaAlert
        variant="danger"
        title="Please correct the following errors:"
        className="mb-3"
      >
        <ul className="mb-0 ps-3">
          {errorMessages.map((error, index) => (
            <li key={index}>{error}</li>
          ))}
        </ul>
      </PharmaAlert>
    );
  };
  
  // Render progress bar for multi-step forms
  const renderProgress = () => {
    if (!showProgress || !steps) return null;
    
    const progress = ((currentStep + 1) / steps.length) * 100;
    
    return (
      <div className="pharma-form-progress mb-4">
        <div className="d-flex justify-content-between mb-2">
          <span className="text-muted">Step {currentStep + 1} of {steps.length}</span>
          <span className="text-muted">{Math.round(progress)}% Complete</span>
        </div>
        <PharmaProgressBar 
          value={progress}
          variant="primary"
          height="6px"
        />
        {steps[currentStep] && (
          <div className="text-center mt-2">
            <strong>{steps[currentStep].title}</strong>
            {steps[currentStep].description && (
              <div className="text-muted small">{steps[currentStep].description}</div>
            )}
          </div>
        )}
      </div>
    );
  };
  
  // Render form actions
  const renderActions = () => {
    return (
      <div className="pharma-form-actions mt-4">
        <Row>
          <Col>
            {showResetButton && (
              <PharmaButton
                variant="outline-secondary"
                onClick={handleReset}
                disabled={loading || disabled || !isDirty}
                className="me-2"
              >
                Reset
              </PharmaButton>
            )}
            
            {showCancelButton && (
              <PharmaButton
                variant="secondary"
                onClick={onCancel}
                disabled={loading}
                className="me-2"
              >
                {cancelText}
              </PharmaButton>
            )}
            
            {additionalActions.map((action, index) => (
              <PharmaButton
                key={index}
                variant={action.variant || 'outline-primary'}
                onClick={action.onClick}
                disabled={loading || disabled}
                className={`me-2 ${action.className || ''}`}
                {...action.props}
              >
                {action.label}
              </PharmaButton>
            ))}
          </Col>
          
          <Col xs="auto">
            {/* Multi-step navigation */}
            {steps && (
              <>
                {currentStep > 0 && (
                  <PharmaButton
                    variant="outline-primary"
                    onClick={() => handleStepChange(currentStep - 1)}
                    disabled={loading}
                    className="me-2"
                  >
                    Previous
                  </PharmaButton>
                )}
                
                {currentStep < steps.length - 1 ? (
                  <PharmaButton
                    variant="primary"
                    onClick={() => handleStepChange(currentStep + 1)}
                    disabled={loading || Object.keys(allErrors).length > 0}
                    className="me-2"
                  >
                    Next
                  </PharmaButton>
                ) : (
                  showSubmitButton && (
                    <PharmaButton
                      type="submit"
                      variant="success"
                      loading={loading}
                      disabled={disabled || Object.keys(allErrors).length > 0}
                    >
                      {submitText}
                    </PharmaButton>
                  )
                )}
              </>
            )}
            
            {/* Single-step submit */}
            {!steps && showSubmitButton && (
              <PharmaButton
                type="submit"
                variant="primary"
                loading={loading}
                disabled={disabled || Object.keys(allErrors).length > 0}
              >
                {submitText}
              </PharmaButton>
            )}
          </Col>
        </Row>
      </div>
    );
  };
  
  // Build column classes
  const getColumnClass = () => {
    if (columns === 1) return '';
    return `col-md-${12 / Math.min(columns, 4)}`;
  };
  
  // Provide form context to children
  const formContext = {
    formData,
    errors: allErrors,
    touchedFields,
    handleFieldChange,
    handleFieldBlur,
    disabled: disabled || loading,
    layout,
    spacing
  };
  
  // Render form content
  const renderFormContent = () => {
    return (
      <>
        {globalError && (
          <PharmaAlert variant="danger" className="mb-3">
            {globalError}
          </PharmaAlert>
        )}
        
        {successMessage && (
          <PharmaAlert variant="success" className="mb-3" autoClose>
            {successMessage}
          </PharmaAlert>
        )}
        
        {renderProgress()}
        {renderValidationSummary()}
        
        <Form
          ref={formRef}
          onSubmit={handleSubmit}
          className={`pharma-form pharma-form-${layout} pharma-form-${spacing} ${formClassName}`}
          aria-label={ariaLabel}
          id={id}
          {...otherProps}
        >
          <div className={columns > 1 ? 'row' : ''}>
            {React.Children.map(children, (child, index) => {
              if (React.isValidElement(child)) {
                const columnClass = getColumnClass();
                const wrappedChild = React.cloneElement(child, {
                  ...formContext,
                  key: child.key || index
                });
                
                return columnClass ? (
                  <div key={index} className={columnClass}>
                    {wrappedChild}
                  </div>
                ) : wrappedChild;
              }
              return child;
            })}
          </div>
          
          {renderActions()}
        </Form>
      </>
    );
  };
  
  // Render wrapped in card or standalone
  if (wrapped) {
    return (
      <PharmaCard
        title={title}
        subtitle={subtitle}
        className={`pharma-form-wrapper ${className}`}
      >
        {renderFormContent()}
      </PharmaCard>
    );
  }
  
  return (
    <div className={`pharma-form-wrapper ${className}`}>
      {renderFormContent()}
    </div>
  );
};

// Pre-configured form variants for common use cases
export const LoginForm = (props) => (
  <PharmaForm
    layout="vertical"
    spacing="normal"
    showCancelButton={false}
    submitText="Sign In"
    validationRules={{
      email: { required: true, email: true },
      password: { required: true, minLength: 6 }
    }}
    {...props}
  />
);

export const UserForm = (props) => (
  <PharmaForm
    layout="vertical"
    columns={2}
    spacing="normal"
    validationRules={{
      name: { required: true, minLength: 2, maxLength: 100 },
      email: { required: true, email: true },
      phone: { phone: true },
      role: { required: true }
    }}
    {...props}
  />
);

export const DrugForm = (props) => (
  <PharmaForm
    layout="vertical"
    columns={2}
    spacing="normal"
    validationRules={{
      ndc: { required: true, ndc: true },
      generic_name: { required: true, minLength: 2, maxLength: 200 },
      strength: { required: true },
      dosage_form: { required: true }
    }}
    {...props}
  />
);

export const InventoryForm = (props) => (
  <PharmaForm
    layout="vertical"
    columns={2}
    spacing="normal"
    validationRules={{
      drug_id: { required: true },
      quantity_on_hand: { required: true, min: 0 },
      reorder_level: { required: true, min: 1 },
      unit_cost: { min: 0 }
    }}
    {...props}
  />
);

export const MultiStepForm = (props) => (
  <PharmaForm
    showProgress={true}
    layout="vertical"
    spacing="normal"
    {...props}
  />
);

export default PharmaForm;