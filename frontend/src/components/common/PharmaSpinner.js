/**
 * PharmaSpinner - Pharmacy-Themed Loading Spinner Component
 * 
 * Enhanced loading spinners with pharmacy-specific theming and animations.
 * Provides visual loading indicators that match the pharmacy aesthetic
 * with pill/capsule/tablet themed spinning animations.
 * 
 * Features:
 * - Multiple pharmacy-themed spinner types
 * - Various sizes and colors
 * - Accessibility compliant loading states
 * - Custom animations for pharmacy operations
 * - Integration with existing loading patterns
 * 
 * @component
 * @author PharmaTraK Development Team
 * @version 1.0.0
 */

import React from 'react';
import { Spinner } from 'react-bootstrap';
import '../../css/pharma-components.css';

const PharmaSpinner = ({
  // Spinner appearance
  animation = 'border', // 'border', 'grow', 'pill', 'capsule', 'tablet', 'prescription'
  variant = 'primary',
  size = 'md', // 'sm', 'md', 'lg', 'xl'
  
  // Content and labels
  children,
  label = 'Loading...',
  showLabel = false,
  
  // Layout
  centered = false,
  overlay = false,
  
  // Styling
  className = '',
  style = {},
  
  // Accessibility
  'aria-label': ariaLabel,
  role = 'status',
  
  ...otherProps
}) => {
  
  // Build CSS classes
  const spinnerClasses = [
    'pharma-spinner',
    animation !== 'border' && animation !== 'grow' ? `pharma-spinner-${animation}` : '',
    size !== 'md' ? `pharma-spinner-${size}` : '',
    centered ? 'pharma-spinner-centered' : '',
    overlay ? 'pharma-spinner-overlay' : '',
    className
  ].filter(Boolean).join(' ');
  
  // Render custom pharmacy-themed spinners
  const renderPharmacySpinner = () => {
    switch (animation) {
      case 'pill':
        return (
          <div className={spinnerClasses} style={style} role={role} aria-label={ariaLabel || label}>
            <div className="pharma-spinner-pill">
              <div className="pharma-spinner-pill-half pharma-spinner-pill-left"></div>
              <div className="pharma-spinner-pill-half pharma-spinner-pill-right"></div>
            </div>
            {showLabel && <span className="pharma-spinner-label">{children || label}</span>}
          </div>
        );
      
      case 'capsule':
        return (
          <div className={spinnerClasses} style={style} role={role} aria-label={ariaLabel || label}>
            <div className="pharma-spinner-capsule">
              <div className="pharma-spinner-capsule-top"></div>
              <div className="pharma-spinner-capsule-bottom"></div>
            </div>
            {showLabel && <span className="pharma-spinner-label">{children || label}</span>}
          </div>
        );
      
      case 'tablet':
        return (
          <div className={spinnerClasses} style={style} role={role} aria-label={ariaLabel || label}>
            <div className="pharma-spinner-tablet">
              <div className="pharma-spinner-tablet-score"></div>
            </div>
            {showLabel && <span className="pharma-spinner-label">{children || label}</span>}
          </div>
        );
      
      case 'prescription':
        return (
          <div className={spinnerClasses} style={style} role={role} aria-label={ariaLabel || label}>
            <div className="pharma-spinner-prescription">
              <div className="pharma-spinner-rx">℞</div>
              <div className="pharma-spinner-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
            {showLabel && <span className="pharma-spinner-label">{children || label}</span>}
          </div>
        );
      
      default:
        return null;
    }
  };
  
  // Render Bootstrap spinner with pharmacy styling
  if (animation === 'border' || animation === 'grow') {
    return (
      <div className={spinnerClasses} style={style}>
        <Spinner
          animation={animation}
          variant={variant}
          size={size === 'md' ? undefined : size}
          role={role}
          aria-label={ariaLabel || label}
          {...otherProps}
        />
        {showLabel && <span className="pharma-spinner-label ms-2">{children || label}</span>}
      </div>
    );
  }
  
  // Render custom pharmacy spinner
  return renderPharmacySpinner();
};

// Specialized pharmacy spinner components
export const PillSpinner = ({ ...props }) => (
  <PharmaSpinner animation="pill" {...props} />
);

export const CapsuleSpinner = ({ ...props }) => (
  <PharmaSpinner animation="capsule" {...props} />
);

export const TabletSpinner = ({ ...props }) => (
  <PharmaSpinner animation="tablet" {...props} />
);

export const PrescriptionSpinner = ({ ...props }) => (
  <PharmaSpinner animation="prescription" label="Processing prescription..." {...props} />
);

// Loading overlay component
export const PharmaLoadingOverlay = ({ 
  show = true, 
  message = 'Loading...', 
  spinnerType = 'prescription',
  backdrop = true,
  ...props 
}) => {
  if (!show) return null;
  
  return (
    <div className={`pharma-loading-overlay ${backdrop ? 'pharma-loading-backdrop' : ''}`}>
      <div className="pharma-loading-content">
        <PharmaSpinner
          animation={spinnerType}
          size="lg"
          showLabel={true}
          centered={true}
          {...props}
        >
          {message}
        </PharmaSpinner>
      </div>
    </div>
  );
};

// Context-specific loading components
export const InventoryLoadingSpinner = (props) => (
  <TabletSpinner label="Loading inventory..." {...props} />
);

export const PrescriptionLoadingSpinner = (props) => (
  <PrescriptionSpinner label="Processing prescription..." {...props} />
);

export const DrugSearchSpinner = (props) => (
  <PillSpinner label="Searching drugs..." {...props} />
);

export const AuditLoadingSpinner = (props) => (
  <PharmaSpinner animation="grow" variant="info" label="Loading audit data..." {...props} />
);

export default PharmaSpinner;