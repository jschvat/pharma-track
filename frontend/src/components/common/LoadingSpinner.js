/**
 * LoadingSpinner Component
 * 
 * Reusable loading spinner component with various layout options.
 * Provides consistent loading states across the application.
 * 
 * @author PharmaTraK Development Team
 * @version 1.0.0
 */

import React from 'react';
import { Spinner } from 'react-bootstrap';

/**
 * LoadingSpinner - Consistent loading indicator component
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.centered - Center the spinner with padding
 * @param {string} props.message - Message to display with spinner
 * @param {string} props.size - Spinner size: 'sm', 'md' (default)
 * @param {boolean} props.inline - Display spinner inline with text
 * @param {string} props.variant - Spinner color variant
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.animation - Animation type: 'border' (default), 'grow'
 * @returns {JSX.Element} LoadingSpinner component
 */
const LoadingSpinner = ({ 
  centered = false,
  message = 'Loading...',
  size = 'md',
  inline = false,
  variant = 'primary',
  className = '',
  animation = 'border',
  ...props 
}) => {
  
  const getSpinnerSize = () => {
    switch (size) {
      case 'sm':
        return 'sm';
      case 'lg':
        return undefined; // Uses default size (larger)
      default:
        return undefined; // Default Bootstrap size
    }
  };

  const spinnerElement = (
    <Spinner 
      animation={animation}
      variant={variant}
      size={getSpinnerSize()}
      {...props}
    />
  );

  // Inline spinner with text
  if (inline) {
    return (
      <span className={`d-flex align-items-center ${className}`.trim()}>
        {spinnerElement}
        {message && <span className="ms-2">{message}</span>}
      </span>
    );
  }

  // Centered spinner
  if (centered) {
    return (
      <div className={`text-center py-4 ${className}`.trim()}>
        {spinnerElement}
        {message && <div className="mt-2">{message}</div>}
      </div>
    );
  }

  // Default spinner
  return (
    <div className={`d-flex align-items-center ${className}`.trim()}>
      {spinnerElement}
      {message && <span className="ms-2">{message}</span>}
    </div>
  );
};

export default LoadingSpinner;