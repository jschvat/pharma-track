/**
 * AlertMessage Component
 * 
 * Reusable alert component for displaying error, success, warning, and info messages.
 * Provides consistent styling and behavior across the application.
 * 
 * @author PharmaTraK Development Team
 * @version 1.0.0
 */

import React, { useEffect } from 'react';
import { Alert } from 'react-bootstrap';

/**
 * AlertMessage - Consistent alert/message component
 * 
 * @param {Object} props - Component props
 * @param {string} props.type - Alert type: 'success', 'danger', 'warning', 'info', 'primary', 'secondary'
 * @param {string} props.message - Message text to display
 * @param {boolean} props.dismissible - Whether alert can be dismissed
 * @param {Function} props.onDismiss - Callback when alert is dismissed
 * @param {string} props.icon - FontAwesome icon class (optional)
 * @param {boolean} props.autoHide - Auto-hide after delay
 * @param {number} props.autoHideDelay - Delay in milliseconds before auto-hide (default: 5000)
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.show - Control visibility (useful for conditional rendering)
 * @returns {JSX.Element|null} AlertMessage component or null if not shown
 */
const AlertMessage = ({ 
  type = 'info',
  message,
  dismissible = false,
  onDismiss,
  icon,
  autoHide = false,
  autoHideDelay = 5000,
  className = '',
  show = true,
  ...props 
}) => {
  
  // Auto-hide functionality
  useEffect(() => {
    if (autoHide && show && onDismiss) {
      const timer = setTimeout(() => {
        onDismiss();
      }, autoHideDelay);
      
      return () => clearTimeout(timer);
    }
  }, [autoHide, autoHideDelay, show, onDismiss]);

  // Don't render if not shown or no message
  if (!show || !message) {
    return null;
  }

  // Get default icon based on alert type
  const getDefaultIcon = () => {
    switch (type) {
      case 'success':
        return 'fas fa-check-circle';
      case 'danger':
        return 'fas fa-exclamation-circle';
      case 'warning':
        return 'fas fa-exclamation-triangle';
      case 'info':
        return 'fas fa-info-circle';
      case 'primary':
        return 'fas fa-info-circle';
      case 'secondary':
        return 'fas fa-info-circle';
      default:
        return 'fas fa-info-circle';
    }
  };

  const displayIcon = icon || getDefaultIcon();

  return (
    <Alert 
      variant={type}
      dismissible={dismissible}
      onClose={onDismiss}
      className={className}
      {...props}
    >
      <div className="d-flex align-items-center">
        {displayIcon && <i className={`${displayIcon} me-2`}></i>}
        <div className="flex-grow-1">
          {message}
        </div>
      </div>
    </Alert>
  );
};

export default AlertMessage;