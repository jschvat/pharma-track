/**
 * PharmaDatePicker - Advanced Date Picker Component
 * 
 * A comprehensive date picker designed specifically for pharmacy operations,
 * handling expiration dates, prescription dates, audit dates, and other
 * pharmacy-specific date requirements with validation and smart defaults.
 * 
 * Features:
 * - Pharmacy-specific date presets
 * - Expiration date validation and warnings
 * - Prescription date constraints
 * - Audit date ranges
 * - Smart date suggestions
 * - Timezone handling
 * - Accessibility and keyboard navigation
 * - Integration with pharmacy workflows
 * 
 * @component
 * @author PharmaTraK Development Team
 * @version 1.0.0
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Form, InputGroup, Dropdown, OverlayTrigger, Popover, Alert } from 'react-bootstrap';
import { PharmaButton, PharmaAlert } from './PharmaComponents';
import '../../css/pharma-components.css';

const PharmaDatePicker = ({
  // Core date props
  value = null,
  onChange = null,
  name = '',
  
  // Date constraints
  minDate = null,
  maxDate = null,
  disabledDates = [],
  
  // Pharmacy-specific features
  type = 'general', // 'expiration', 'prescription', 'audit', 'shipment', 'general'
  showWarnings = true,
  showPresets = true,
  showQuickActions = true,
  
  // Validation
  required = false,
  validateFuture = false, // Must be future date
  validatePast = false, // Must be past date
  customValidation = null,
  
  // Display options
  format = 'MM/dd/yyyy',
  placeholder = 'Select date...',
  size = 'md',
  disabled = false,
  readOnly = false,
  
  // Preset options
  presets = null, // Custom presets override defaults
  showTimePresets = false,
  
  // Visual feedback
  showDaysUntil = true,
  highlightWeekends = true,
  highlightHolidays = false,
  
  // Events
  onFocus = null,
  onBlur = null,
  onValidation = null,
  
  // Styling
  className = '',
  inputClassName = '',
  
  // Accessibility
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  
  ...otherProps
}) => {
  
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [validationError, setValidationError] = useState('');
  const [hoveredDate, setHoveredDate] = useState(null);
  const inputRef = useRef(null);
  const popoverRef = useRef(null);
  
  // Convert value to Date object
  const currentDate = value ? new Date(value) : null;
  
  // Initialize input value
  useEffect(() => {
    if (currentDate) {
      setInputValue(formatDate(currentDate, format));
    } else {
      setInputValue('');
    }
  }, [currentDate, format]);
  
  // Format date helper
  const formatDate = (date, formatStr) => {
    if (!date || !(date instanceof Date) || isNaN(date)) return '';
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return formatStr
      .replace('yyyy', year)
      .replace('MM', month)
      .replace('dd', day)
      .replace('HH', hours)
      .replace('mm', minutes);
  };
  
  // Parse date helper
  const parseDate = (dateStr) => {
    if (!dateStr) return null;
    
    // Try multiple date formats
    const formats = [
      /^\d{1,2}\/\d{1,2}\/\d{4}$/, // MM/dd/yyyy
      /^\d{4}-\d{2}-\d{2}$/, // yyyy-MM-dd
      /^\d{1,2}-\d{1,2}-\d{4}$/, // MM-dd-yyyy
    ];
    
    for (const format of formats) {
      if (format.test(dateStr)) {
        const parsed = new Date(dateStr);
        if (!isNaN(parsed.getTime())) {
          return parsed;
        }
      }
    }
    
    return null;
  };
  
  // Get pharmacy-specific presets
  const getPharmacyPresets = () => {
    if (presets) return presets;
    
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const weekFromNow = new Date(today);
    weekFromNow.setDate(weekFromNow.getDate() + 7);
    
    const monthFromNow = new Date(today);
    monthFromNow.setMonth(monthFromNow.getMonth() + 1);
    
    const yearFromNow = new Date(today);
    yearFromNow.setFullYear(yearFromNow.getFullYear() + 1);
    
    const sixMonthsFromNow = new Date(today);
    sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
    
    const twoYearsFromNow = new Date(today);
    twoYearsFromNow.setFullYear(twoYearsFromNow.getFullYear() + 2);
    
    const basePresets = {
      general: [
        { label: 'Today', date: today, icon: '📅' },
        { label: 'Tomorrow', date: tomorrow, icon: '➡️' },
        { label: 'Next Week', date: weekFromNow, icon: '📊' },
        { label: 'Next Month', date: monthFromNow, icon: '📆' }
      ],
      expiration: [
        { label: '30 Days', date: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000), icon: '⚠️' },
        { label: '6 Months', date: sixMonthsFromNow, icon: '📅' },
        { label: '1 Year', date: yearFromNow, icon: '📆' },
        { label: '2 Years', date: twoYearsFromNow, icon: '🗓️' }
      ],
      prescription: [
        { label: 'Today', date: today, icon: '💊' },
        { label: 'Yesterday', date: new Date(today.getTime() - 24 * 60 * 60 * 1000), icon: '⏮️' },
        { label: '30 Days Ago', date: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000), icon: '📋' },
        { label: '90 Days Ago', date: new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000), icon: '📊' }
      ],
      audit: [
        { label: 'Start of Month', date: new Date(today.getFullYear(), today.getMonth(), 1), icon: '📊' },
        { label: 'End of Month', date: new Date(today.getFullYear(), today.getMonth() + 1, 0), icon: '📈' },
        { label: 'Last 30 Days', date: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000), icon: '🔍' },
        { label: 'Last 90 Days', date: new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000), icon: '📋' }
      ],
      shipment: [
        { label: 'Today', date: today, icon: '📦' },
        { label: 'Tomorrow', date: tomorrow, icon: '🚛' },
        { label: 'Next Week', date: weekFromNow, icon: '📅' },
        { label: 'Next Month', date: monthFromNow, icon: '🗓️' }
      ]
    };
    
    return basePresets[type] || basePresets.general;
  };
  
  // Validate date
  const validateDate = useCallback((date) => {
    if (!date) {
      return required ? 'Date is required' : '';
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateToCheck = new Date(date);
    dateToCheck.setHours(0, 0, 0, 0);
    
    // Future date validation
    if (validateFuture && dateToCheck <= today) {
      return 'Date must be in the future';
    }
    
    // Past date validation
    if (validatePast && dateToCheck >= today) {
      return 'Date must be in the past';
    }
    
    // Min date validation
    if (minDate && dateToCheck < new Date(minDate)) {
      return `Date must be after ${formatDate(new Date(minDate), format)}`;
    }
    
    // Max date validation
    if (maxDate && dateToCheck > new Date(maxDate)) {
      return `Date must be before ${formatDate(new Date(maxDate), format)}`;
    }
    
    // Disabled dates validation
    if (disabledDates.some(disabledDate => {
      const disabled = new Date(disabledDate);
      disabled.setHours(0, 0, 0, 0);
      return dateToCheck.getTime() === disabled.getTime();
    })) {
      return 'This date is not available';
    }
    
    // Pharmacy-specific validations
    if (type === 'expiration') {
      // Expiration dates should be in the future
      if (dateToCheck <= today) {
        return 'Expiration date must be in the future';
      }
      
      // Warn about short expiration periods
      const daysUntilExpiration = Math.ceil((dateToCheck - today) / (1000 * 60 * 60 * 24));
      if (daysUntilExpiration < 30) {
        return 'Warning: Expiration date is less than 30 days away';
      }
    }
    
    if (type === 'prescription') {
      // Prescription dates shouldn't be too far in the future
      const maxFuture = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
      if (dateToCheck > maxFuture) {
        return 'Prescription date cannot be more than 30 days in the future';
      }
    }
    
    // Custom validation
    if (customValidation) {
      const customError = customValidation(date);
      if (customError) return customError;
    }
    
    return '';
  }, [required, validateFuture, validatePast, minDate, maxDate, disabledDates, type, customValidation, format]);
  
  // Handle date change
  const handleDateChange = useCallback((newDate) => {
    const validationMessage = validateDate(newDate);
    setValidationError(validationMessage);
    
    if (onChange) {
      onChange(newDate, validationMessage);
    }
    
    if (onValidation) {
      onValidation(validationMessage);
    }
    
    setIsOpen(false);
  }, [validateDate, onChange, onValidation]);
  
  // Handle input change
  const handleInputChange = useCallback((e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    if (newValue) {
      const parsedDate = parseDate(newValue);
      if (parsedDate) {
        handleDateChange(parsedDate);
      }
    } else {
      handleDateChange(null);
    }
  }, [handleDateChange]);
  
  // Get date warning/info
  const getDateInfo = (date) => {
    if (!date || !showDaysUntil) return null;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    
    const diffTime = targetDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return { text: 'Today', variant: 'info', icon: '📅' };
    } else if (diffDays === 1) {
      return { text: 'Tomorrow', variant: 'info', icon: '➡️' };
    } else if (diffDays === -1) {
      return { text: 'Yesterday', variant: 'info', icon: '⏮️' };
    } else if (diffDays > 0) {
      const variant = diffDays <= 7 ? 'warning' : diffDays <= 30 ? 'info' : 'success';
      const icon = diffDays <= 7 ? '⚠️' : diffDays <= 30 ? '📅' : '🗓️';
      return { text: `${diffDays} days away`, variant, icon };
    } else {
      return { text: `${Math.abs(diffDays)} days ago`, variant: 'secondary', icon: '⏮️' };
    }
  };
  
  // Render preset buttons
  const renderPresets = () => {
    if (!showPresets) return null;
    
    const presetOptions = getPharmacyPresets();
    
    return (
      <div className="pharma-date-presets mb-2">
        <div className="small text-muted mb-1">Quick Select:</div>
        <div className="d-flex flex-wrap gap-1">
          {presetOptions.map((preset, index) => (
            <PharmaButton
              key={index}
              variant="outline-secondary"
              size="sm"
              onClick={() => handleDateChange(preset.date)}
              className="pharma-date-preset-btn"
            >
              {preset.icon && <span className="me-1">{preset.icon}</span>}
              {preset.label}
            </PharmaButton>
          ))}
        </div>
      </div>
    );
  };
  
  // Render quick actions
  const renderQuickActions = () => {
    if (!showQuickActions || !currentDate) return null;
    
    return (
      <div className="pharma-date-actions mt-2">
        <div className="small text-muted mb-1">Quick Actions:</div>
        <div className="d-flex flex-wrap gap-1">
          <PharmaButton
            variant="outline-primary"
            size="sm"
            onClick={() => {
              const tomorrow = new Date(currentDate);
              tomorrow.setDate(tomorrow.getDate() + 1);
              handleDateChange(tomorrow);
            }}
          >
            +1 Day
          </PharmaButton>
          
          <PharmaButton
            variant="outline-primary"
            size="sm"
            onClick={() => {
              const nextWeek = new Date(currentDate);
              nextWeek.setDate(nextWeek.getDate() + 7);
              handleDateChange(nextWeek);
            }}
          >
            +1 Week
          </PharmaButton>
          
          <PharmaButton
            variant="outline-primary"
            size="sm"
            onClick={() => {
              const nextMonth = new Date(currentDate);
              nextMonth.setMonth(nextMonth.getMonth() + 1);
              handleDateChange(nextMonth);
            }}
          >
            +1 Month
          </PharmaButton>
          
          <PharmaButton
            variant="outline-secondary"
            size="sm"
            onClick={() => handleDateChange(new Date())}
          >
            Today
          </PharmaButton>
        </div>
      </div>
    );
  };
  
  // Build popover content
  const popoverContent = (
    <Popover className="pharma-date-popover" style={{ maxWidth: '400px' }}>
      <Popover.Body>
        {renderPresets()}
        
        <div className="pharma-date-input mb-2">
          <Form.Control
            type="date"
            value={currentDate ? formatDate(currentDate, 'yyyy-MM-dd') : ''}
            onChange={(e) => {
              if (e.target.value) {
                handleDateChange(new Date(e.target.value));
              }
            }}
            min={minDate ? formatDate(new Date(minDate), 'yyyy-MM-dd') : undefined}
            max={maxDate ? formatDate(new Date(maxDate), 'yyyy-MM-dd') : undefined}
          />
        </div>
        
        {currentDate && (
          <div className="pharma-date-info mb-2">
            {(() => {
              const info = getDateInfo(currentDate);
              return info ? (
                <Alert variant={info.variant} className="py-1 px-2 small mb-1">
                  {info.icon && <span className="me-1">{info.icon}</span>}
                  {info.text}
                </Alert>
              ) : null;
            })()}
          </div>
        )}
        
        {renderQuickActions()}
        
        <div className="text-center mt-2">
          <PharmaButton
            variant="outline-secondary"
            size="sm"
            onClick={() => setIsOpen(false)}
          >
            Close
          </PharmaButton>
          
          {currentDate && (
            <PharmaButton
              variant="outline-danger"
              size="sm"
              className="ms-1"
              onClick={() => handleDateChange(null)}
            >
              Clear
            </PharmaButton>
          )}
        </div>
      </Popover.Body>
    </Popover>
  );
  
  const dateInfo = currentDate ? getDateInfo(currentDate) : null;
  const hasError = validationError && !validationError.startsWith('Warning:');
  const hasWarning = validationError && validationError.startsWith('Warning:');
  
  return (
    <div className={`pharma-date-picker ${className}`}>
      <OverlayTrigger
        trigger="click"
        placement="bottom"
        show={isOpen}
        onToggle={setIsOpen}
        overlay={popoverContent}
        rootClose={true}
      >
        <InputGroup 
          size={size}
          className={hasError ? 'is-invalid' : hasWarning ? 'is-warning' : ''}
        >
          <Form.Control
            ref={inputRef}
            type="text"
            name={name}
            value={inputValue}
            onChange={handleInputChange}
            onFocus={(e) => {
              if (onFocus) onFocus(e);
            }}
            onBlur={(e) => {
              if (onBlur) onBlur(e);
            }}
            placeholder={placeholder}
            disabled={disabled}
            readOnly={readOnly}
            className={`pharma-date-input ${inputClassName}`}
            aria-label={ariaLabel || 'Date input'}
            aria-describedby={ariaDescribedBy}
            {...otherProps}
          />
          
          <PharmaButton
            variant="outline-secondary"
            onClick={() => setIsOpen(!isOpen)}
            disabled={disabled}
            className="pharma-date-toggle"
          >
            📅
          </PharmaButton>
          
          {currentDate && (
            <PharmaButton
              variant="outline-secondary"
              onClick={() => handleDateChange(null)}
              disabled={disabled}
              className="pharma-date-clear"
            >
              ×
            </PharmaButton>
          )}
        </InputGroup>
      </OverlayTrigger>
      
      {/* Date info badge */}
      {dateInfo && showDaysUntil && (
        <div className="pharma-date-info-badge mt-1">
          <small className={`text-${dateInfo.variant}`}>
            {dateInfo.icon && <span className="me-1">{dateInfo.icon}</span>}
            {dateInfo.text}
          </small>
        </div>
      )}
      
      {/* Validation message */}
      {validationError && (
        <div className={`pharma-date-validation mt-1 small text-${hasError ? 'danger' : 'warning'}`}>
          {hasError ? '⚠️' : '💡'} {validationError}
        </div>
      )}
      
      {/* Pharmacy-specific warnings */}
      {showWarnings && currentDate && type === 'expiration' && (
        <div className="pharma-date-warnings mt-1">
          {(() => {
            const today = new Date();
            const daysUntil = Math.ceil((currentDate - today) / (1000 * 60 * 60 * 24));
            
            if (daysUntil <= 30 && daysUntil > 0) {
              return (
                <small className="text-warning">
                  💡 Consider ordering replacement stock soon
                </small>
              );
            } else if (daysUntil <= 7 && daysUntil > 0) {
              return (
                <small className="text-danger">
                  ⚠️ This medication expires very soon
                </small>
              );
            } else if (daysUntil <= 0) {
              return (
                <small className="text-danger">
                  🚫 This medication has expired
                </small>
              );
            }
            return null;
          })()}
        </div>
      )}
    </div>
  );
};

// Pre-configured date pickers for pharmacy use cases
export const ExpirationDatePicker = (props) => (
  <PharmaDatePicker
    type="expiration"
    validateFuture={true}
    showWarnings={true}
    showDaysUntil={true}
    placeholder="Select expiration date..."
    {...props}
  />
);

export const PrescriptionDatePicker = (props) => (
  <PharmaDatePicker
    type="prescription"
    maxDate={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)} // 30 days from now
    placeholder="Select prescription date..."
    {...props}
  />
);

export const AuditDatePicker = (props) => (
  <PharmaDatePicker
    type="audit"
    showPresets={true}
    showQuickActions={false}
    placeholder="Select audit date..."
    {...props}
  />
);

export const ShipmentDatePicker = (props) => (
  <PharmaDatePicker
    type="shipment"
    validateFuture={false}
    placeholder="Select shipment date..."
    {...props}
  />
);

export default PharmaDatePicker;