/**
 * PharmaButton - Standardized Button Component
 * 
 * A comprehensive button component that standardizes all button interactions
 * throughout the PharmaTraK application. Provides consistent styling, loading
 * states, icons, and accessibility features.
 * 
 * Features:
 * - Multiple variants (primary, secondary, success, danger, warning, info)
 * - Size variants (xs, sm, md, lg)
 * - Built-in loading states with spinners
 * - Icon support with proper positioning
 * - Accessibility enhancements
 * - Consistent spacing and animations
 * 
 * @component
 * @author PharmaTraK Development Team
 * @version 1.0.0
 */

import React from 'react';
import { Button, Spinner } from 'react-bootstrap';
import '../../css/pharma-components.css';

const PharmaButton = ({
  // Core props
  children,
  variant = 'primary',
  size = 'md',
  
  // State props
  loading = false,
  disabled = false,
  
  // Icon props
  icon = null,
  iconPosition = 'left', // 'left', 'right', 'only'
  
  // Style props
  outline = false,
  block = false,
  rounded = false,
  
  // Theme props
  theme = 'default', // 'default', 'pill', 'capsule', 'tablet'
  imprint = null, // Custom imprint text for tablet theme (defaults to 'PT')
  
  // Effect props
  hoverEffect = true, // Enable/disable hover animations
  clickEffect = true, // Enable/disable click animations
  effectIntensity = 'medium', // 'subtle', 'medium', 'strong'
  
  // Event props
  onClick,
  
  // Accessibility props
  'aria-label': ariaLabel,
  title,
  
  // Advanced props
  loadingText = null,
  confirmAction = false, // Future: double-click confirmation
  
  // Bootstrap pass-through props
  className = '',
  type = 'button',
  ...otherProps
}) => {
  
  // Determine the effective variant
  const effectiveVariant = outline ? `outline-${variant}` : variant;
  
  // Handle loading state
  const isDisabled = disabled || loading;
  
  // Determine button content based on loading state
  const getButtonContent = () => {
    if (loading) {
      return (
        <>
          <Spinner
            as="span"
            animation="border"
            size="sm"
            role="status"
            aria-hidden="true"
            className={iconPosition === 'only' ? '' : 'me-2'}
          />
          {iconPosition !== 'only' && (loadingText || children)}
        </>
      );
    }
    
    if (iconPosition === 'only') {
      return icon;
    }
    
    if (iconPosition === 'right') {
      return (
        <>
          {children}
          {icon && <span className="ms-2">{icon}</span>}
        </>
      );
    }
    
    // Default: left position or no icon
    return (
      <>
        {icon && <span className="me-2">{icon}</span>}
        {children}
      </>
    );
  };
  
  // Build CSS classes
  const buttonClasses = [
    'pharma-btn',
    `pharma-btn-${size}`,
    `pharma-btn-theme-${theme}`,
    block && 'pharma-btn-block',
    rounded && 'pharma-btn-rounded',
    loading && 'pharma-btn-loading',
    hoverEffect && 'pharma-btn-hover-enabled',
    clickEffect && 'pharma-btn-click-enabled',
    `pharma-btn-effect-${effectIntensity}`,
    className
  ].filter(Boolean).join(' ');
  
  return (
    <Button
      variant={effectiveVariant}
      size={size === 'xs' ? 'sm' : size} // Bootstrap doesn't have xs, map to sm
      disabled={isDisabled}
      onClick={onClick}
      className={buttonClasses}
      type={type}
      aria-label={ariaLabel || (typeof children === 'string' ? children : undefined)}
      title={title}
      data-imprint={theme === 'tablet' && imprint ? imprint : undefined}
      {...otherProps}
    >
      {getButtonContent()}
    </Button>
  );
};

// Pre-configured button variants for common use cases
export const PrimaryButton = (props) => <PharmaButton variant="primary" {...props} />;
export const SecondaryButton = (props) => <PharmaButton variant="secondary" {...props} />;
export const SuccessButton = (props) => <PharmaButton variant="success" {...props} />;
export const DangerButton = (props) => <PharmaButton variant="danger" {...props} />;
export const WarningButton = (props) => <PharmaButton variant="warning" {...props} />;
export const InfoButton = (props) => <PharmaButton variant="info" {...props} />;

// Common action buttons
export const SaveButton = (props) => (
  <PharmaButton 
    variant="success" 
    {...props}
    loadingText="Saving..."
  />
);

export const CancelButton = (props) => (
  <PharmaButton 
    variant="secondary" 
    outline 
    {...props} 
  />
);

export const DeleteButton = (props) => (
  <PharmaButton 
    variant="danger" 
    outline 
    {...props}
    loadingText="Deleting..."
  />
);

export const EditButton = (props) => (
  <PharmaButton 
    variant="primary" 
    outline 
    size="sm"
    {...props} 
  />
);

export const ViewButton = (props) => (
  <PharmaButton 
    variant="info" 
    outline 
    size="sm"
    {...props} 
  />
);

export default PharmaButton;