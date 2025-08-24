/**
 * PharmaProgressBar - Enhanced Progress Indicator Component
 * 
 * A comprehensive progress bar component that provides visual feedback for
 * loading states, form progress, task completion, and pharmacy workflows.
 * Supports multiple styles, animations, and pharmacy-specific use cases.
 * 
 * Features:
 * - Multiple variants and sizes
 * - Animated progress transitions
 * - Text labels and percentage display
 * - Striped and animated backgrounds
 * - Pharmacy-specific progress types
 * - Accessibility enhancements
 * - Custom color schemes
 * 
 * @component
 * @author PharmaTraK Development Team
 * @version 1.0.0
 */

import React, { useEffect, useState } from 'react';
import '../../css/pharma-components.css';

// Custom progress bar component to eliminate React Bootstrap isChild prop warnings
const CustomProgressBar = ({ 
  now, min = 0, max = 100, variant, striped, animated, 
  ariaLabel, ariaDescribedBy, progressText 
}) => {
  const percentage = Math.min(Math.max(((now - min) / (max - min)) * 100, 0), 100);
  
  // Variant color mapping
  const getVariantColor = () => {
    const variants = {
      primary: '#0d6efd',
      secondary: '#6c757d',
      success: '#198754',
      danger: '#dc3545',
      warning: '#ffc107',
      info: '#0dcaf0',
      light: '#f8f9fa',
      dark: '#212529'
    };
    return variants[variant] || variants.primary;
  };
  
  const progressStyles = {
    width: '100%',
    height: '100%',
    backgroundColor: '#e9ecef',
    borderRadius: '0.375rem',
    overflow: 'hidden',
    position: 'relative'
  };
  
  const barStyles = {
    width: `${percentage}%`,
    height: '100%',
    backgroundColor: getVariantColor(),
    transition: 'width 0.6s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    ...(striped && {
      backgroundImage: 'linear-gradient(45deg, rgba(255,255,255,.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,.15) 50%, rgba(255,255,255,.15) 75%, transparent 75%, transparent)',
      backgroundSize: '1rem 1rem'
    }),
    ...(animated && {
      animation: 'progress-bar-stripes 1s linear infinite'
    })
  };
  
  return (
    <div 
      style={progressStyles}
      role="progressbar"
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={now}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
    >
      <div style={barStyles}>
        {progressText && (
          <span 
            className="pharma-progress-text"
            style={{
              color: 'white',
              fontSize: '0.75rem',
              fontWeight: '600',
              textShadow: '0 0 2px rgba(0,0,0,0.5)',
              whiteSpace: 'nowrap'
            }}
          >
            {progressText}
          </span>
        )}
      </div>
      <style>
        {`
          @keyframes progress-bar-stripes {
            0% { background-position: 1rem 0; }
            100% { background-position: 0 0; }
          }
        `}
      </style>
    </div>
  );
};

const PharmaProgressBar = ({
  // Core progress props
  value = 0,
  min = 0,
  max = 100,
  
  // Display options
  variant = 'primary', // 'primary', 'success', 'warning', 'danger', 'info', 'secondary'
  size = 'md', // 'sm', 'md', 'lg', 'xl'
  height = null, // Custom height override
  
  // Text and labels
  showLabel = false,
  showPercentage = false,
  label = null,
  customText = null,
  
  // Visual styles
  striped = false,
  animated = false,
  gradient = false,
  rounded = true,
  
  // Pharmacy-specific features
  type = null, // 'inventory', 'expiration', 'prescription', 'audit'
  threshold = null, // Show different colors based on thresholds
  thresholds = { // Default threshold colors
    danger: 25,    // Red below 25%
    warning: 50,   // Yellow below 50%
    success: 75    // Green above 75%
  },
  
  // Animation
  smooth = true,
  duration = 500, // Animation duration in ms
  
  // Events
  onComplete = null,
  onThresholdCross = null,
  
  // Styling
  className = '',
  style = {},
  
  // Accessibility
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  
  ...otherProps
}) => {
  
  const [currentValue, setCurrentValue] = useState(smooth ? 0 : value);
  const [hasAnimated, setHasAnimated] = useState(false);
  
  // Calculate percentage
  const percentage = Math.min(Math.max(((value - min) / (max - min)) * 100, 0), 100);
  const displayValue = smooth ? currentValue : value;
  const displayPercentage = Math.min(Math.max(((displayValue - min) / (max - min)) * 100, 0), 100);
  
  // Animate progress value
  useEffect(() => {
    if (!smooth) return;
    
    const startValue = currentValue;
    const endValue = value;
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (easeOutCubic)
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const newValue = startValue + (endValue - startValue) * easedProgress;
      
      setCurrentValue(newValue);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCurrentValue(endValue);
        
        // Trigger completion callback
        if (endValue >= max && onComplete && !hasAnimated) {
          onComplete();
          setHasAnimated(true);
        }
      }
    };
    
    requestAnimationFrame(animate);
  }, [value, smooth, duration, currentValue, max, onComplete, hasAnimated]);
  
  // Determine variant based on thresholds
  const getThresholdVariant = () => {
    if (!threshold && !type) return variant;
    
    // Pharmacy-specific type mappings
    const typeThresholds = {
      inventory: { danger: 10, warning: 25, success: 75 },
      expiration: { danger: 7, warning: 30, success: 90 },
      prescription: { danger: 20, warning: 50, success: 80 },
      audit: { danger: 30, warning: 60, success: 90 }
    };
    
    const activeThresholds = type ? typeThresholds[type] : thresholds;
    
    if (percentage <= activeThresholds.danger) return 'danger';
    if (percentage <= activeThresholds.warning) return 'warning';
    if (percentage >= activeThresholds.success) return 'success';
    
    return 'primary';
  };
  
  const effectiveVariant = getThresholdVariant();
  
  // Handle threshold crossing
  useEffect(() => {
    if (onThresholdCross && threshold !== null) {
      const crossed = percentage >= threshold;
      onThresholdCross(crossed, percentage);
    }
  }, [percentage, threshold, onThresholdCross]);
  
  // Get size-based height
  const getSizeHeight = () => {
    if (height) return height;
    
    const heights = {
      sm: '8px',
      md: '16px',
      lg: '24px',
      xl: '32px'
    };
    
    return heights[size] || heights.md;
  };
  
  // Render progress text
  const renderProgressText = () => {
    if (customText) return customText;
    if (showPercentage) return `${Math.round(displayPercentage)}%`;
    if (showLabel && label) return label;
    return null;
  };
  
  // Get pharmacy-specific icons
  const getTypeIcon = () => {
    const icons = {
      inventory: '📦',
      expiration: '📅',
      prescription: '💊',
      audit: '🔍'
    };
    
    return type ? icons[type] : null;
  };
  
  // Build CSS classes
  const progressClasses = [
    'pharma-progress',
    `pharma-progress-${size}`,
    gradient && 'pharma-progress-gradient',
    rounded && 'pharma-progress-rounded',
    type && `pharma-progress-${type}`,
    className
  ].filter(Boolean).join(' ');
  
  // Custom styles
  const progressStyle = {
    height: getSizeHeight(),
    ...style
  };
  
  const progressText = renderProgressText();
  const typeIcon = getTypeIcon();
  
  // All props are handled directly by PharmaProgressBar - no props passed to ProgressBar
  // This prevents any DOM prop warnings from React Bootstrap ProgressBar
  
  return (
    <div className={progressClasses} style={progressStyle}>
      {/* Progress label */}
      {(showLabel || typeIcon) && (
        <div className="pharma-progress-label mb-1 d-flex justify-content-between align-items-center">
          <span className="pharma-progress-label-text">
            {typeIcon && <span className="me-1">{typeIcon}</span>}
            {label}
          </span>
          {showPercentage && (
            <span className="pharma-progress-percentage">
              {Math.round(displayPercentage)}%
            </span>
          )}
        </div>
      )}
      
      {/* Custom progress bar - completely avoids React Bootstrap */}
      <CustomProgressBar
        now={displayPercentage}
        min={min}
        max={max}
        variant={effectiveVariant}
        striped={striped}
        animated={animated}
        ariaLabel={ariaLabel || `Progress: ${Math.round(displayPercentage)}%`}
        ariaDescribedBy={ariaDescribedBy}
        progressText={progressText}
      />
      
      {/* Custom threshold markers */}
      {type && (
        <div className="pharma-progress-markers">
          {Object.entries(thresholds).map(([level, threshold]) => (
            <div
              key={level}
              className={`pharma-progress-marker pharma-progress-marker-${level}`}
              style={{ left: `${threshold}%` }}
              title={`${level.charAt(0).toUpperCase() + level.slice(1)}: ${threshold}%`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Pre-configured progress bar variants for common use cases
export const InventoryProgress = (props) => (
  <PharmaProgressBar
    type="inventory"
    showLabel={true}
    showPercentage={true}
    gradient={true}
    label="Stock Level"
    {...props}
  />
);

export const ExpirationProgress = (props) => (
  <PharmaProgressBar
    type="expiration"
    showLabel={true}
    showPercentage={true}
    label="Time Until Expiration"
    {...props}
  />
);

export const PrescriptionProgress = (props) => (
  <PharmaProgressBar
    type="prescription"
    showLabel={true}
    showPercentage={true}
    animated={true}
    label="Processing Progress"
    {...props}
  />
);

export const AuditProgress = (props) => (
  <PharmaProgressBar
    type="audit"
    showLabel={true}
    showPercentage={true}
    striped={true}
    label="Audit Completion"
    {...props}
  />
);

export const LoadingProgress = (props) => (
  <PharmaProgressBar
    variant="primary"
    animated={true}
    striped={true}
    showPercentage={true}
    {...props}
  />
);

export const FormProgress = (props) => (
  <PharmaProgressBar
    variant="success"
    showPercentage={true}
    smooth={true}
    rounded={true}
    size="sm"
    {...props}
  />
);

export default PharmaProgressBar;