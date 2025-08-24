/**
 * PharmaToast - Pharmacy-Themed Toast Notification Component
 * 
 * Enhanced Bootstrap Toast with pharmacy-specific styling and features.
 * Perfect for prescription notifications, inventory alerts, drug warnings,
 * and other contextual feedback with pharmacy theming.
 * 
 * Features:
 * - Pharmacy-themed visual styles with pill/capsule/tablet icons
 * - Prescription workflow notifications
 * - Drug safety alerts and warnings
 * - Inventory level notifications
 * - Auto-dismiss with customizable timing
 * - Toast container with position management
 * 
 * @component
 * @author PharmaTraK Development Team
 * @version 1.0.0
 */

import React, { useState, useEffect, createContext, useContext } from 'react';
import { Toast, ToastContainer } from 'react-bootstrap';
import { PharmaBadge, PharmaSpinner } from './PharmaComponents';
import '../../css/pharma-components.css';

// Toast Context for managing global toasts
const PharmaToastContext = createContext();

export const usePharmaToast = () => {
  const context = useContext(PharmaToastContext);
  if (!context) {
    throw new Error('usePharmaToast must be used within a PharmaToastProvider');
  }
  return context;
};

// Toast Provider Component
export const PharmaToastProvider = ({ children, position = 'top-end' }) => {
  const [toasts, setToasts] = useState([]);
  
  const addToast = (toast) => {
    const id = Date.now() + Math.random();
    const newToast = { ...toast, id, timestamp: new Date() };
    setToasts(prev => [...prev, newToast]);
    
    // Auto-dismiss if specified
    if (toast.autohide !== false) {
      const delay = toast.delay || 5000;
      setTimeout(() => {
        removeToast(id);
      }, delay);
    }
    
    return id;
  };
  
  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };
  
  const clearToasts = () => {
    setToasts([]);
  };
  
  // Convenience methods for different toast types
  const showSuccess = (message, options = {}) => {
    return addToast({
      variant: 'success',
      pharmaType: 'pill',
      title: 'Success',
      message,
      icon: 'fas fa-check-circle',
      ...options
    });
  };
  
  const showError = (message, options = {}) => {
    return addToast({
      variant: 'danger',
      pharmaType: 'capsule',
      title: 'Error',
      message,
      icon: 'fas fa-exclamation-circle',
      autohide: false,
      ...options
    });
  };
  
  const showWarning = (message, options = {}) => {
    return addToast({
      variant: 'warning',
      pharmaType: 'tablet',
      title: 'Warning',
      message,
      icon: 'fas fa-exclamation-triangle',
      ...options
    });
  };
  
  const showInfo = (message, options = {}) => {
    return addToast({
      variant: 'info',
      pharmaType: 'pill',
      title: 'Information',
      message,
      icon: 'fas fa-info-circle',
      ...options
    });
  };
  
  const showPrescriptionAlert = (message, prescriptionData = {}, options = {}) => {
    return addToast({
      variant: 'primary',
      pharmaType: 'capsule',
      title: 'Prescription Alert',
      message,
      icon: 'fas fa-prescription',
      data: prescriptionData,
      ...options
    });
  };
  
  const showInventoryAlert = (message, inventoryData = {}, options = {}) => {
    return addToast({
      variant: 'warning',
      pharmaType: 'tablet',
      title: 'Inventory Alert',
      message,
      icon: 'fas fa-boxes',
      data: inventoryData,
      ...options
    });
  };
  
  const showDrugSafetyAlert = (message, drugData = {}, options = {}) => {
    return addToast({
      variant: 'danger',
      pharmaType: 'pill',
      title: 'Drug Safety Alert',
      message,
      icon: 'fas fa-shield-alt',
      data: drugData,
      autohide: false,
      priority: 'high',
      ...options
    });
  };
  
  const contextValue = {
    toasts,
    addToast,
    removeToast,
    clearToasts,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showPrescriptionAlert,
    showInventoryAlert,
    showDrugSafetyAlert
  };
  
  return (
    <PharmaToastContext.Provider value={contextValue}>
      {children}
      <PharmaToastContainer position={position} toasts={toasts} onClose={removeToast} />
    </PharmaToastContext.Provider>
  );
};

// Individual Toast Component
const PharmaToast = ({
  // Content
  title = '',
  message = '',
  children,
  
  // Visual theming
  variant = 'primary', // 'primary', 'success', 'warning', 'danger', 'info', 'secondary'
  pharmaType = 'pill', // 'pill', 'capsule', 'tablet'
  icon = null,
  
  // Behavior
  show = true,
  autohide = true,
  delay = 5000,
  
  // Events
  onClose = null,
  onShow = null,
  onHide = null,
  onClick = null,
  
  // Data
  data = {},
  timestamp = null,
  priority = 'normal', // 'low', 'normal', 'high'
  
  // Styling
  className = '',
  headerClassName = '',
  bodyClassName = '',
  
  // Actions
  actions = [],
  
  ...otherProps
}) => {
  
  const [visible, setVisible] = useState(show);
  
  useEffect(() => {
    setVisible(show);
  }, [show]);
  
  // Build CSS classes
  const toastClasses = [
    'pharma-toast',
    `pharma-toast-${pharmaType}`,
    `pharma-toast-${variant}`,
    priority !== 'normal' ? `pharma-toast-priority-${priority}` : '',
    onClick ? 'pharma-toast-clickable' : '',
    className
  ].filter(Boolean).join(' ');
  
  const headerClasses = [
    'pharma-toast-header',
    headerClassName
  ].filter(Boolean).join(' ');
  
  const bodyClasses = [
    'pharma-toast-body',
    bodyClassName
  ].filter(Boolean).join(' ');
  
  // Handle toast close
  const handleClose = () => {
    setVisible(false);
    if (onClose) {
      onClose();
    }
    if (onHide) {
      onHide();
    }
  };
  
  // Handle toast click
  const handleClick = () => {
    if (onClick) {
      onClick(data);
    }
  };
  
  // Render toast header
  const renderHeader = () => (
    <Toast.Header className={headerClasses} closeButton={true}>
      <div className="pharma-toast-header-content d-flex align-items-center">
        {icon && (
          <div className={`pharma-toast-icon pharma-toast-icon-${pharmaType} me-2`}>
            <i className={icon}></i>
          </div>
        )}
        <strong className="pharma-toast-title me-auto">{title}</strong>
        {priority === 'high' && (
          <PharmaBadge variant="danger" pharmaType={pharmaType} size="sm" className="me-2">
            High Priority
          </PharmaBadge>
        )}
        {timestamp && (
          <small className="text-muted">
            {new Date(timestamp).toLocaleTimeString()}
          </small>
        )}
      </div>
    </Toast.Header>
  );
  
  // Render toast body
  const renderBody = () => (
    <Toast.Body className={bodyClasses}>
      <div className="pharma-toast-message">{message || children}</div>
      
      {/* Data display for specialized toasts */}
      {Object.keys(data).length > 0 && (
        <div className="pharma-toast-data mt-2">
          {data.drugName && (
            <small className="d-block"><strong>Drug:</strong> {data.drugName}</small>
          )}
          {data.patientName && (
            <small className="d-block"><strong>Patient:</strong> {data.patientName}</small>
          )}
          {data.quantity !== undefined && (
            <small className="d-block"><strong>Quantity:</strong> {data.quantity}</small>
          )}
          {data.location && (
            <small className="d-block"><strong>Location:</strong> {data.location}</small>
          )}
        </div>
      )}
      
      {/* Action buttons */}
      {actions.length > 0 && (
        <div className="pharma-toast-actions mt-3 d-flex gap-2">
          {actions.map((action, index) => (
            <button
              key={index}
              className={`btn btn-sm btn-${action.variant || 'outline-primary'}`}
              onClick={action.onClick}
            >
              {action.icon && <i className={`${action.icon} me-1`}></i>}
              {action.text}
            </button>
          ))}
        </div>
      )}
    </Toast.Body>
  );
  
  // Handle onShow callback manually since Toast doesn't support it
  useEffect(() => {
    if (visible && onShow) {
      onShow();
    }
  }, [visible, onShow]);

  return (
    <Toast
      show={visible}
      onClose={handleClose}
      autohide={autohide}
      delay={delay}
      className={toastClasses}
      onClick={onClick ? handleClick : undefined}
      {...otherProps}
    >
      {renderHeader()}
      {renderBody()}
    </Toast>
  );
};

// Toast Container Component
const PharmaToastContainer = ({ 
  toasts = [], 
  onClose = null, 
  position = 'top-end',
  className = '',
  ...props 
}) => {
  
  const containerClasses = [
    'pharma-toast-container',
    className
  ].filter(Boolean).join(' ');
  
  return (
    <ToastContainer 
      position={position}
      className={containerClasses}
      {...props}
    >
      {toasts.map(toast => (
        <PharmaToast
          key={toast.id}
          onClose={() => onClose && onClose(toast.id)}
          {...toast}
        />
      ))}
    </ToastContainer>
  );
};

// Specialized Toast Components
export const PrescriptionToast = ({ prescription, ...props }) => (
  <PharmaToast
    variant="primary"
    pharmaType="capsule"
    icon="fas fa-prescription"
    data={{
      drugName: prescription.drug_name,
      patientName: prescription.patient_name,
      quantity: prescription.quantity
    }}
    actions={[
      {
        text: 'View Details',
        variant: 'outline-primary',
        icon: 'fas fa-eye',
        onClick: () => console.log('View prescription details')
      }
    ]}
    {...props}
  />
);

export const DrugSafetyToast = ({ drug, warning, ...props }) => (
  <PharmaToast
    variant="danger"
    pharmaType="pill"
    icon="fas fa-shield-alt"
    title="Drug Safety Alert"
    message={warning}
    data={{
      drugName: drug.generic_name || drug.name,
      ndc: drug.ndc
    }}
    autohide={false}
    priority="high"
    actions={[
      {
        text: 'View Details',
        variant: 'outline-danger',
        icon: 'fas fa-exclamation-triangle',
        onClick: () => console.log('View drug safety details')
      },
      {
        text: 'Acknowledge',
        variant: 'danger',
        onClick: () => console.log('Acknowledge safety alert')
      }
    ]}
    {...props}
  />
);

export const InventoryToast = ({ item, alertType = 'low-stock', ...props }) => {
  const getAlertConfig = () => {
    switch (alertType) {
      case 'low-stock':
        return {
          variant: 'warning',
          icon: 'fas fa-exclamation-triangle',
          title: 'Low Stock Alert'
        };
      case 'out-of-stock':
        return {
          variant: 'danger',
          icon: 'fas fa-times-circle',
          title: 'Out of Stock'
        };
      case 'expired':
        return {
          variant: 'danger',
          icon: 'fas fa-calendar-times',
          title: 'Expired Medication'
        };
      case 'expiring-soon':
        return {
          variant: 'warning',
          icon: 'fas fa-clock',
          title: 'Expiring Soon'
        };
      default:
        return {
          variant: 'info',
          icon: 'fas fa-info-circle',
          title: 'Inventory Update'
        };
    }
  };
  
  const config = getAlertConfig();
  
  return (
    <PharmaToast
      variant={config.variant}
      pharmaType="tablet"
      icon={config.icon}
      title={config.title}
      data={{
        drugName: item.drug_name || item.name,
        quantity: item.quantity_on_hand,
        location: item.location
      }}
      actions={[
        {
          text: 'View Inventory',
          variant: 'outline-primary',
          icon: 'fas fa-boxes',
          onClick: () => console.log('View inventory item')
        }
      ]}
      {...props}
    />
  );
};

export default PharmaToast;