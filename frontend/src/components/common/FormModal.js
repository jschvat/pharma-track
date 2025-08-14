import React from 'react';
import { Modal, Button, Spinner, Form } from 'react-bootstrap';

/**
 * FormModal Component
 * 
 * A reusable modal component for forms with consistent structure,
 * loading states, and form submission handling.
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.show - Whether modal is visible
 * @param {function} props.onHide - Function to call when modal should be hidden
 * @param {string} props.title - Modal title
 * @param {string} [props.size] - Modal size ('sm', 'lg', 'xl')
 * @param {function} [props.onSubmit] - Form submit handler
 * @param {boolean} [props.loading=false] - Whether form is in loading state
 * @param {string} [props.submitText='Submit'] - Submit button text
 * @param {string} [props.cancelText='Cancel'] - Cancel button text
 * @param {string} [props.submitVariant='primary'] - Submit button variant
 * @param {string} [props.cancelVariant='secondary'] - Cancel button variant
 * @param {boolean} [props.showFooter=true] - Whether to show modal footer
 * @param {boolean} [props.showCancelButton=true] - Whether to show cancel button
 * @param {boolean} [props.disableSubmit=false] - Whether submit button is disabled
 * @param {React.ReactNode} [props.additionalButtons] - Additional buttons to show in footer
 * @param {React.ReactNode} props.children - Modal body content
 * @param {string} [props.backdrop='true'] - Modal backdrop ('static', true, false)
 * @param {boolean} [props.keyboard=true] - Whether modal can be closed with keyboard
 * @param {boolean} [props.centered=false] - Whether modal is vertically centered
 * @param {function} [props.onExited] - Callback when modal has exited
 * @param {string} [props.className] - Additional CSS classes for modal
 */
const FormModal = ({
  show,
  onHide,
  title,
  size,
  onSubmit,
  loading = false,
  submitText = 'Submit',
  cancelText = 'Cancel',
  submitVariant = 'primary',
  cancelVariant = 'secondary',
  showFooter = true,
  showCancelButton = true,
  disableSubmit = false,
  additionalButtons,
  children,
  backdrop = true,
  keyboard = true,
  centered = false,
  onExited,
  className,
  ...otherProps
}) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit && !loading && !disableSubmit) {
      onSubmit(e);
    }
  };

  const isSubmitDisabled = loading || disableSubmit;

  return (
    <Modal
      show={show}
      onHide={onHide}
      size={size}
      backdrop={backdrop}
      keyboard={keyboard && !loading}
      centered={centered}
      onExited={onExited}
      className={className}
      {...otherProps}
    >
      <Modal.Header closeButton={!loading}>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>

      {onSubmit ? (
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            {children}
          </Modal.Body>
          
          {showFooter && (
            <Modal.Footer>
              {showCancelButton && (
                <Button 
                  variant={cancelVariant} 
                  onClick={onHide}
                  disabled={loading}
                >
                  {cancelText}
                </Button>
              )}
              
              {additionalButtons}
              
              <Button 
                variant={submitVariant} 
                type="submit" 
                disabled={isSubmitDisabled}
              >
                {loading ? (
                  <>
                    <Spinner 
                      as="span" 
                      animation="border" 
                      size="sm" 
                      role="status" 
                      aria-hidden="true" 
                      className="me-2"
                    />
                    {typeof loading === 'string' ? loading : 'Loading...'}
                  </>
                ) : (
                  submitText
                )}
              </Button>
            </Modal.Footer>
          )}
        </Form>
      ) : (
        <>
          <Modal.Body>
            {children}
          </Modal.Body>
          
          {showFooter && (
            <Modal.Footer>
              {showCancelButton && (
                <Button 
                  variant={cancelVariant} 
                  onClick={onHide}
                  disabled={loading}
                >
                  {cancelText}
                </Button>
              )}
              
              {additionalButtons}
            </Modal.Footer>
          )}
        </>
      )}
    </Modal>
  );
};

export default FormModal;