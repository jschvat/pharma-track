/**
 * PharmaAlert - Standardized Alert/Notification Component
 * 
 * A comprehensive alert component that standardizes all notifications
 * throughout the PharmaTraK application. Provides consistent styling,
 * auto-dismiss functionality, action buttons, and accessibility features.
 * 
 * Features:
 * - Multiple variants (success, error, warning, info)
 * - Auto-dismiss with customizable timeout
 * - Action buttons and links
 * - Progress bars for timed alerts
 * - Icon integration with variant-based defaults
 * - Toast-style positioning for notifications
 * - Consistent animations and transitions
 * - Accessibility enhancements
 * 
 * @component
 * @author PharmaTraK Development Team
 * @version 1.0.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Alert, ProgressBar } from 'react-bootstrap';
import PharmaButton from './PharmaButton';
import '../../css/pharma-components.css';

const PharmaAlert = ({
  // Core content
  children,
  title = null,
  message = null,
  
  // Alert type and styling
  variant = 'info', // 'success', 'danger', 'warning', 'info', 'primary', 'secondary'
  severity = null, // Alternative to variant: 'error', 'warning', 'info', 'success'
  
  // Visibility and dismissal
  show = true,
  dismissible = true,
  autoClose = false,
  autoCloseDelay = 5000, // milliseconds
  showProgress = false, // Show progress bar for auto-close
  
  // Icon configuration
  showIcon = true,
  icon = null, // Custom icon, overrides default
  
  // Actions
  actions = [], // Array of action buttons
  primaryAction = null, // Primary action button config
  secondaryAction = null, // Secondary action button config
  
  // Positioning (for toast-style alerts)
  position = null, // 'top-right', 'top-left', 'bottom-right', 'bottom-left', 'top-center', 'bottom-center'
  fixed = false, // Use fixed positioning
  
  // Event handlers
  onClose = null,
  onAction = null,
  
  // Styling
  className = '',
  
  // Accessibility
  'aria-live': ariaLive = 'polite',
  'aria-atomic': ariaAtomic = true,
  id,
  
  ...otherProps
}) => {
  
  const [isVisible, setIsVisible] = useState(show);
  const [progress, setProgress] = useState(100);
  const timeoutRef = useRef(null);
  const intervalRef = useRef(null);
  
  // Map severity to variant for backwards compatibility
  const effectiveVariant = severity ? 
    (severity === 'error' ? 'danger' : severity) : 
    variant;
  
  // Default icons for each variant
  const defaultIcons = {
    success: '✓',
    danger: '✕',
    warning: '⚠',
    info: 'ℹ',
    primary: 'ℹ',
    secondary: 'ℹ'
  };
  
  // Handle close
  const handleClose = useCallback(() => {
    setIsVisible(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    if (onClose) {
      onClose();
    }
  }, [onClose]);
  
  // Handle auto-close
  useEffect(() => {
    if (show && autoClose && autoCloseDelay > 0) {
      // Set up auto-close timer
      timeoutRef.current = setTimeout(() => {
        handleClose();
      }, autoCloseDelay);
      
      // Set up progress bar animation if enabled
      if (showProgress) {
        setProgress(100);
        const updateInterval = 50; // Update every 50ms
        const steps = autoCloseDelay / updateInterval;
        const stepSize = 100 / steps;
        
        intervalRef.current = setInterval(() => {
          setProgress(prev => {
            const newProgress = prev - stepSize;
            if (newProgress <= 0) {
              clearInterval(intervalRef.current);
              return 0;
            }
            return newProgress;
          });
        }, updateInterval);
      }
      
      // Cleanup function
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [show, autoClose, autoCloseDelay, showProgress, handleClose]);
  
  // Update visibility when show prop changes
  useEffect(() => {
    setIsVisible(show);
    if (show && showProgress) {
      setProgress(100);
    }
  }, [show, showProgress]);
  
  // Pause auto-close on hover
  const handleMouseEnter = useCallback(() => {
    if (autoClose && timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (showProgress && intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  }, [autoClose, showProgress]);
  
  // Resume auto-close on mouse leave
  const handleMouseLeave = useCallback(() => {
    if (autoClose && isVisible) {
      const remainingTime = showProgress ? (progress / 100) * autoCloseDelay : autoCloseDelay;
      
      timeoutRef.current = setTimeout(() => {
        handleClose();
      }, remainingTime);
      
      if (showProgress) {
        const updateInterval = 50;
        const steps = remainingTime / updateInterval;
        const stepSize = progress / steps;
        
        intervalRef.current = setInterval(() => {
          setProgress(prev => {
            const newProgress = prev - stepSize;
            if (newProgress <= 0) {
              clearInterval(intervalRef.current);
              return 0;
            }
            return newProgress;
          });
        }, updateInterval);
      }
    }
  }, [autoClose, isVisible, showProgress, progress, autoCloseDelay, handleClose]);
  
  // Handle action button clicks
  const handleActionClick = useCallback((action, actionIndex) => {
    if (action.onClick) {
      action.onClick();
    }
    if (onAction) {
      onAction(action, actionIndex);
    }
    if (action.closeOnClick !== false) {
      handleClose();
    }
  }, [onAction, handleClose]);
  
  // Render icon
  const renderIcon = () => {
    if (!showIcon) return null;
    
    const iconToShow = icon || defaultIcons[effectiveVariant] || defaultIcons.info;
    
    return (
      <span className="pharma-alert-icon">
        {iconToShow}
      </span>
    );
  };
  
  // Render actions
  const renderActions = () => {
    const allActions = [];
    
    // Add primary and secondary actions to the actions array
    if (primaryAction) {
      allActions.push({ ...primaryAction, isPrimary: true });
    }
    if (secondaryAction) {
      allActions.push({ ...secondaryAction, isSecondary: true });
    }
    allActions.push(...actions);
    
    if (allActions.length === 0) return null;
    
    return (
      <div className="pharma-alert-actions">
        {allActions.map((action, index) => (
          <PharmaButton
            key={index}
            size="sm"
            variant={action.isPrimary ? 'primary' : action.isSecondary ? 'secondary' : action.variant || 'outline-secondary'}
            className={`me-2 ${action.className || ''}`}
            onClick={() => handleActionClick(action, index)}
            {...action.props}
          >
            {action.icon && <span className="me-1">{action.icon}</span>}
            {action.label || action.text}
          </PharmaButton>
        ))}
      </div>
    );
  };
  
  // Render progress bar
  const renderProgressBar = () => {
    if (!showProgress || !autoClose) return null;
    
    return (
      <ProgressBar
        now={progress}
        className="pharma-alert-progress"
        variant={effectiveVariant}
        style={{ height: '2px', marginTop: '8px' }}
      />
    );
  };
  
  // Build CSS classes
  const alertClasses = [
    'pharma-alert',
    `pharma-alert-${effectiveVariant}`,
    position && `pharma-alert-${position}`,
    fixed && 'pharma-alert-fixed',
    autoClose && 'pharma-alert-auto-close',
    className
  ].filter(Boolean).join(' ');
  
  // Don't render if not visible
  if (!isVisible) return null;
  
  return (
    <Alert
      variant={effectiveVariant}
      dismissible={dismissible}
      onClose={handleClose}
      className={alertClasses}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      aria-live={ariaLive}
      aria-atomic={ariaAtomic}
      id={id}
      {...otherProps}
    >
      <div className="pharma-alert-content">
        <div className="pharma-alert-main">
          {renderIcon()}
          
          <div className="pharma-alert-text">
            {title && (
              <Alert.Heading className="pharma-alert-title">
                {title}
              </Alert.Heading>
            )}
            
            <div className="pharma-alert-message">
              {message || children}
            </div>
          </div>
        </div>
        
        {renderActions()}
      </div>
      
      {renderProgressBar()}
    </Alert>
  );
};

// Pre-configured alert variants for common use cases
export const SuccessAlert = (props) => (
  <PharmaAlert 
    variant="success"
    autoClose={true}
    autoCloseDelay={4000}
    {...props} 
  />
);

export const ErrorAlert = (props) => (
  <PharmaAlert 
    variant="danger"
    dismissible={true}
    {...props} 
  />
);

export const WarningAlert = (props) => (
  <PharmaAlert 
    variant="warning"
    dismissible={true}
    {...props} 
  />
);

export const InfoAlert = (props) => (
  <PharmaAlert 
    variant="info"
    autoClose={true}
    autoCloseDelay={6000}
    {...props} 
  />
);

export const ToastAlert = (props) => (
  <PharmaAlert 
    position="top-right"
    fixed={true}
    autoClose={true}
    autoCloseDelay={5000}
    showProgress={true}
    {...props} 
  />
);

export const ActionAlert = (props) => (
  <PharmaAlert 
    dismissible={false}
    autoClose={false}
    {...props} 
  />
);

// Notification system hook (future enhancement)
export const useNotification = () => {
  const notify = useCallback((message, options = {}) => {
    // This would integrate with a global notification system
    // For now, it's a placeholder for future implementation
    console.log('Notification:', message, options);
  }, []);
  
  return {
    success: (message, options) => notify(message, { variant: 'success', ...options }),
    error: (message, options) => notify(message, { variant: 'danger', ...options }),
    warning: (message, options) => notify(message, { variant: 'warning', ...options }),
    info: (message, options) => notify(message, { variant: 'info', ...options }),
    notify
  };
};

export default PharmaAlert;