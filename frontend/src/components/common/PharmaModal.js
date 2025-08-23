/**
 * PharmaModal - Standardized Modal Component
 * 
 * A comprehensive modal component that standardizes all modal interactions
 * throughout the PharmaTraK application. Provides consistent structure,
 * loading states, form integration, and accessibility features.
 * 
 * Features:
 * - Pre-configured layouts (simple, form, confirmation)
 * - Standardized footer buttons (Cancel/Save, Close, etc.)
 * - Loading states with overlay
 * - Auto-sizing based on content
 * - Form validation integration
 * - Consistent styling and animations
 * - Accessibility enhancements
 * - Keyboard navigation support
 * 
 * @component
 * @author PharmaTraK Development Team
 * @version 1.0.0
 */

import React, { useEffect, useCallback } from 'react';
import { Modal, Spinner } from 'react-bootstrap';
import PharmaButton, { SaveButton, CancelButton, DeleteButton } from './PharmaButton';
import '../../css/pharma-components.css';

const PharmaModal = ({
  // Core modal props
  show = false,
  onHide,
  title,
  children,
  
  // Size and layout
  size = 'lg', // 'sm', 'md', 'lg', 'xl'
  layout = 'simple', // 'simple', 'form', 'confirmation'
  centered = true,
  fullscreen = false,
  
  // Loading states
  loading = false,
  loadingText = 'Loading...',
  
  // Footer configuration
  showFooter = true,
  footerAlign = 'end', // 'start', 'center', 'end', 'between'
  
  // Standard footer buttons
  showCancel = true,
  showSave = false,
  showClose = false,
  showDelete = false,
  
  // Button props
  cancelText = 'Cancel',
  saveText = 'Save',
  closeText = 'Close',
  deleteText = 'Delete',
  
  // Button states
  saveLoading = false,
  deleteLoading = false,
  saveDisabled = false,
  deleteDisabled = false,
  
  // Event handlers
  onSave,
  onDelete,
  onCancel,
  
  // Form integration
  formId = null,
  
  // Styling
  className = '',
  headerClassName = '',
  bodyClassName = '',
  footerClassName = '',
  
  // Advanced props
  closeOnBackdrop = true,
  closeOnEscape = true,
  preventClose = false, // Prevents closing when loading
  
  // Custom footer content
  customFooter = null,
  additionalActions = [], // Array of custom buttons
  
  // Accessibility
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
  
  ...otherProps
}) => {
  
  // Handle escape key
  const handleKeyDown = useCallback((event) => {
    if (event.key === 'Escape' && closeOnEscape && !preventClose && !loading) {
      onHide();
    }
  }, [closeOnEscape, preventClose, loading, onHide]);
  
  useEffect(() => {
    if (show) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [show, handleKeyDown]);
  
  // Handle backdrop click
  const handleBackdropClick = useCallback(() => {
    if (closeOnBackdrop && !preventClose && !loading) {
      onHide();
    }
  }, [closeOnBackdrop, preventClose, loading, onHide]);
  
  // Handle button actions
  const handleCancel = useCallback(() => {
    if (onCancel) {
      onCancel();
    } else {
      onHide();
    }
  }, [onCancel, onHide]);
  
  const handleSave = useCallback((event) => {
    if (formId) {
      // If form ID is provided, submit the form
      const form = document.getElementById(formId);
      if (form) {
        form.requestSubmit();
      }
    } else if (onSave) {
      onSave(event);
    }
  }, [formId, onSave]);
  
  // Render footer buttons based on layout and props
  const renderFooterButtons = () => {
    if (customFooter) {
      return customFooter;
    }
    
    const buttons = [];
    
    // Add additional custom actions first
    additionalActions.forEach((action, index) => {
      buttons.push(
        <PharmaButton
          key={`action-${index}`}
          {...action}
          className={`me-2 ${action.className || ''}`}
        >
          {action.children}
        </PharmaButton>
      );
    });
    
    // Add standard buttons based on layout
    if (layout === 'confirmation') {
      if (showCancel) {
        buttons.push(
          <CancelButton
            key="cancel"
            onClick={handleCancel}
            disabled={saveLoading || deleteLoading}
            className="me-2"
          >
            {cancelText}
          </CancelButton>
        );
      }
      
      if (showDelete) {
        buttons.push(
          <DeleteButton
            key="delete"
            onClick={onDelete}
            loading={deleteLoading}
            disabled={deleteDisabled || saveLoading}
          >
            {deleteText}
          </DeleteButton>
        );
      }
    } else {
      // Standard form or simple layout
      if (showCancel) {
        buttons.push(
          <CancelButton
            key="cancel"
            onClick={handleCancel}
            disabled={saveLoading || deleteLoading}
            className="me-2"
          >
            {cancelText}
          </CancelButton>
        );
      }
      
      if (showClose) {
        buttons.push(
          <PharmaButton
            key="close"
            variant="secondary"
            onClick={onHide}
            disabled={saveLoading || deleteLoading}
            className="me-2"
          >
            {closeText}
          </PharmaButton>
        );
      }
      
      if (showSave) {
        buttons.push(
          <SaveButton
            key="save"
            onClick={handleSave}
            loading={saveLoading}
            disabled={saveDisabled || deleteLoading}
            type={formId ? 'submit' : 'button'}
            form={formId}
          >
            {saveText}
          </SaveButton>
        );
      }
    }
    
    return buttons;
  };
  
  // Determine footer alignment class
  const getFooterAlignClass = () => {
    switch (footerAlign) {
      case 'start': return 'justify-content-start';
      case 'center': return 'justify-content-center';
      case 'between': return 'justify-content-between';
      default: return 'justify-content-end';
    }
  };
  
  return (
    <Modal
      show={show}
      onHide={handleBackdropClick}
      size={size}
      centered={centered}
      fullscreen={fullscreen}
      backdrop={closeOnBackdrop ? true : 'static'}
      keyboard={closeOnEscape}
      className={`pharma-modal pharma-modal-${layout} ${className}`}
      aria-labelledby={ariaLabelledBy || 'pharma-modal-title'}
      aria-describedby={ariaDescribedBy}
      {...otherProps}
    >
      {/* Loading Overlay */}
      {loading && (
        <div className="pharma-modal-loading-overlay">
          <div className="pharma-modal-loading-content">
            <Spinner animation="border" className="mb-3" />
            <div className="pharma-modal-loading-text">{loadingText}</div>
          </div>
        </div>
      )}
      
      {/* Header */}
      {title && (
        <Modal.Header 
          closeButton={!preventClose && !loading}
          className={`pharma-modal-header ${headerClassName}`}
        >
          <Modal.Title 
            id="pharma-modal-title"
            className="pharma-modal-title"
          >
            {title}
          </Modal.Title>
        </Modal.Header>
      )}
      
      {/* Body */}
      <Modal.Body className={`pharma-modal-body ${bodyClassName}`}>
        {children}
      </Modal.Body>
      
      {/* Footer */}
      {showFooter && (
        <Modal.Footer 
          className={`pharma-modal-footer d-flex ${getFooterAlignClass()} ${footerClassName}`}
        >
          {renderFooterButtons()}
        </Modal.Footer>
      )}
    </Modal>
  );
};

// Pre-configured modal variants for common use cases
export const ConfirmationModal = (props) => (
  <PharmaModal 
    layout="confirmation"
    size="sm"
    showCancel={true}
    showDelete={true}
    {...props} 
  />
);

export const FormModal = (props) => (
  <PharmaModal 
    layout="form"
    showCancel={true}
    showSave={true}
    {...props} 
  />
);

export const InfoModal = (props) => (
  <PharmaModal 
    layout="simple"
    showClose={true}
    {...props} 
  />
);

export const LoadingModal = (props) => (
  <PharmaModal 
    loading={true}
    showFooter={false}
    closeOnBackdrop={false}
    closeOnEscape={false}
    preventClose={true}
    {...props} 
  />
);

export default PharmaModal;