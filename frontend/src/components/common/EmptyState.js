/**
 * EmptyState Component
 * 
 * Reusable empty state component for displaying "no data" scenarios with consistent styling.
 * Provides icon, message, and optional action button for better user experience.
 * 
 * @author PharmaTraK Development Team
 * @version 1.0.0
 */

import React from 'react';
import { Button } from 'react-bootstrap';

/**
 * EmptyState - Consistent empty state component for no data scenarios
 * 
 * @param {Object} props - Component props
 * @param {string} props.icon - FontAwesome icon class (default: 'fas fa-folder-open')
 * @param {string} props.title - Main title text
 * @param {string} props.message - Descriptive message (optional)
 * @param {string} props.actionText - Text for action button (optional)
 * @param {Function} props.onAction - Callback when action button is clicked
 * @param {string} props.actionVariant - Bootstrap button variant for action
 * @param {boolean} props.centered - Whether to center the content
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.size - Component size: 'sm', 'md' (default), 'lg'
 * @returns {JSX.Element} EmptyState component
 */
const EmptyState = ({ 
  icon = 'fas fa-folder-open',
  title = 'No Data Found',
  message,
  actionText,
  onAction,
  actionVariant = 'primary',
  centered = true,
  className = '',
  size = 'md',
  ...props 
}) => {
  
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          container: 'py-3',
          icon: 'fa-2x mb-2',
          title: 'h6 mb-1',
          message: 'small',
          button: 'btn-sm'
        };
      case 'lg':
        return {
          container: 'py-5',
          icon: 'fa-4x mb-4',
          title: 'h3 mb-3',
          message: 'fs-5',
          button: 'btn-lg'
        };
      default: // md
        return {
          container: 'py-4',
          icon: 'fa-3x mb-3',
          title: 'h5 mb-2',
          message: '',
          button: ''
        };
    }
  };

  const sizeClasses = getSizeClasses();
  const containerClasses = [
    centered ? 'text-center' : '',
    sizeClasses.container,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClasses} {...props}>
      {/* Icon */}
      <div className="text-muted mb-3">
        <i className={`${icon} ${sizeClasses.icon}`}></i>
      </div>
      
      {/* Title */}
      <h5 className={`text-muted ${sizeClasses.title}`}>
        {title}
      </h5>
      
      {/* Optional message */}
      {message && (
        <p className={`text-muted ${sizeClasses.message}`}>
          {message}
        </p>
      )}
      
      {/* Optional action button */}
      {actionText && onAction && (
        <div className="mt-3">
          <Button
            variant={actionVariant}
            onClick={onAction}
            className={sizeClasses.button}
          >
            {actionText}
          </Button>
        </div>
      )}
    </div>
  );
};

export default EmptyState;