/**
 * Transaction Modal Component
 * 
 * Handles all inventory transaction types (prescription, return, expire, audit)
 * Extracted from Inventory.js to improve maintainability and reduce complexity.
 * 
 * Features:
 * - Prescription filling with validation
 * - Return to stock with prescription selection
 * - Medication expiration handling
 * - Inventory audit adjustments
 * - Comprehensive form validation
 * - Real-time error feedback
 * 
 * @component
 * @author PharmaTraK Development Team
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import { Button, Spinner, Alert, Form, Dropdown } from 'react-bootstrap';
import DraggableDialog from '../DraggableDialog';
import FormField from '../common/FormField';

/**
 * TransactionModal Component - Handles inventory transaction operations
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.show - Whether modal is visible
 * @param {Function} props.onHide - Function to hide modal
 * @param {string} props.modalType - Type of transaction (prescription, return, expire, audit)
 * @param {Object} props.selectedItem - Selected inventory item
 * @param {Object} props.transactionForm - Form data
 * @param {Function} props.setTransactionForm - Function to update form data
 * @param {Object} props.validationErrors - Validation error messages
 * @param {Function} props.setValidationErrors - Function to update validation errors
 * @param {boolean} props.loading - Loading state
 * @param {Function} props.onSubmit - Function to handle form submission
 * @param {Array} props.availablePrescriptions - Available prescriptions for returns
 * @param {boolean} props.showValidationWarning - Whether to show validation warning
 * @returns {JSX.Element} The transaction modal component
 */
const TransactionModal = ({
  show,
  onHide,
  modalType,
  selectedItem,
  transactionForm,
  setTransactionForm,
  validationErrors,
  setValidationErrors,
  loading,
  onSubmit,
  availablePrescriptions = [],
  showValidationWarning
}) => {
  // Form validation
  const isFormValid = () => {
    if (!modalType || !selectedItem) return false;

    switch (modalType) {
      case 'prescription':
        return transactionForm.quantity && 
               transactionForm.prescription_number && 
               transactionForm.reason &&
               parseInt(transactionForm.quantity) > 0 &&
               parseInt(transactionForm.quantity) <= selectedItem.quantity_on_hand;
      
      case 'return':
        return transactionForm.reference_number && 
               transactionForm.quantity && 
               transactionForm.reason &&
               parseInt(transactionForm.quantity) > 0;
      
      case 'expire':
        return transactionForm.quantity && 
               transactionForm.reason &&
               parseInt(transactionForm.quantity) > 0 &&
               parseInt(transactionForm.quantity) <= selectedItem.quantity_on_hand;
      
      case 'audit':
        return transactionForm.actual_quantity !== '' && 
               transactionForm.reason &&
               parseInt(transactionForm.actual_quantity) >= 0;
      
      default:
        return false;
    }
  };

  // Clear validation error helper
  const clearValidationError = (field) => {
    if (validationErrors[field]) {
      setValidationErrors({...validationErrors, [field]: undefined});
    }
  };

  // Update form field helper
  const updateFormField = (field, value) => {
    setTransactionForm({...transactionForm, [field]: value});
    clearValidationError(field);
  };

  // Format helpers
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString();
  };

  // Modal configuration
  const getModalConfig = () => {
    switch (modalType) {
      case 'prescription':
        return {
          title: 'Fill Prescription',
          width: 500,
          height: 600
        };
      case 'return':
        return {
          title: 'Return to Stock',
          width: 550,
          height: 650
        };
      case 'expire':
        return {
          title: 'Expire Medication',
          width: 480,
          height: 520
        };
      case 'audit':
        return {
          title: 'Audit Inventory',
          width: 480,
          height: 540
        };
      default:
        return {
          title: 'Transaction',
          width: 500,
          height: 600
        };
    }
  };

  const config = getModalConfig();

  // Validation errors display
  const ValidationErrors = () => (
    (showValidationWarning || Object.keys(validationErrors).some(key => validationErrors[key])) && (
      <Alert variant="warning" className="mt-3 mb-0">
        <Alert.Heading className="h6 mb-2">
          <i className="fas fa-exclamation-triangle me-2"></i>
          Please correct the following errors:
        </Alert.Heading>
        <ul className="mb-0 ps-3">
          {Object.entries(validationErrors).map(([field, error]) => 
            error && (
              <li key={field} className="small">
                <strong>{field.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}:</strong> {error}
              </li>
            )
          )}
        </ul>
      </Alert>
    )
  );

  // Modal footer with buttons and validation
  const ModalFooter = () => (
    <>
      <div className="d-flex justify-content-between align-items-start w-100">
        <div className="me-3 flex-grow-1">
          <Button variant="secondary" onClick={onHide} className="me-2">
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={onSubmit}
            disabled={loading || !isFormValid()}
          >
            {loading ? <Spinner animation="border" size="sm" /> : 'Confirm'}
          </Button>
        </div>
      </div>
      <ValidationErrors />
    </>
  );

  // Item information display
  const ItemInfo = () => selectedItem && (
    <div className="mb-3">
      <strong>{selectedItem.generic_name}</strong>
      {selectedItem.brand_name && <div className="text-muted">{selectedItem.brand_name}</div>}
      <div className="small text-muted">Current Stock: {selectedItem.quantity_on_hand}</div>
      {modalType === 'expire' && selectedItem.expiration_date && (
        <div className="small text-muted">Expires: {formatDate(selectedItem.expiration_date)}</div>
      )}
    </div>
  );

  // Prescription form content
  const PrescriptionForm = () => (
    <div>
      <ItemInfo />
      
      <FormField
        label="Quantity"
        name="quantity"
        type="number"
        value={transactionForm.quantity}
        onChange={(e) => updateFormField('quantity', e.target.value)}
        inputProps={{
          min: 1,
          max: selectedItem.quantity_on_hand
        }}
        required
        error={validationErrors.quantity}
        className={validationErrors.quantity ? 'is-invalid' : ''}
      />

      <FormField
        label="Prescription Number"
        name="prescription_number"
        value={transactionForm.prescription_number}
        onChange={(e) => {
          const prescriptionNumber = e.target.value;
          const updatedReason = prescriptionNumber 
            ? `Prescription fill - Rx# ${prescriptionNumber}`
            : 'Prescription fill';
          
          setTransactionForm({
            ...transactionForm, 
            prescription_number: prescriptionNumber,
            reason: updatedReason
          });
          clearValidationError('prescription_number');
        }}
        required
        placeholder="Enter prescription number (e.g., RX123456)"
        error={validationErrors.prescription_number}
        className={validationErrors.prescription_number ? 'is-invalid' : ''}
      />

      <FormField
        label="Reason"
        name="reason"
        type="textarea"
        rows={3}
        value={transactionForm.reason}
        onChange={(e) => updateFormField('reason', e.target.value)}
        required
        helpText="Reason auto-populated from prescription number. You can edit if needed."
        error={validationErrors.reason}
        className={validationErrors.reason ? 'is-invalid' : ''}
      />
    </div>
  );

  // Return form content
  const ReturnForm = () => (
    <div>
      <ItemInfo />
      
      <div className="mb-3">
        <label className="form-label">Select Prescription to Return <span className="text-danger">*</span></label>
        <Dropdown>
          <Dropdown.Toggle variant="outline-secondary" className="w-100 text-start">
            {transactionForm.reference_number ? 
              `Rx# ${transactionForm.reference_number}` : 
              'Choose a prescription...'
            }
          </Dropdown.Toggle>
          <Dropdown.Menu className="w-100">
            {availablePrescriptions.length === 0 ? (
              <Dropdown.Item disabled>No prescriptions available for return</Dropdown.Item>
            ) : (
              availablePrescriptions.map((rx) => (
                <Dropdown.Item 
                  key={rx.prescription_number}
                  onClick={() => {
                    setTransactionForm({
                      ...transactionForm, 
                      reference_number: rx.prescription_number,
                      quantity: ''
                    });
                    clearValidationError('reference_number');
                  }}
                >
                  <div className="prescription-table">
                    <div className="prescription-row">
                      <div className="prescription-cell rx-number">Rx #{rx.prescription_number}</div>
                      <div className="prescription-cell date">{formatDate(rx.fill_date)}</div>
                      <div className="prescription-cell time">{formatTime(rx.fill_date)}</div>
                      <div className="prescription-cell user">{rx.filled_by || 'Unknown'}</div>
                      <div className="prescription-cell quantity">Qty: {rx.available_for_return}</div>
                    </div>
                  </div>
                </Dropdown.Item>
              ))
            )}
          </Dropdown.Menu>
        </Dropdown>
        {validationErrors.reference_number && (
          <div className="invalid-feedback d-block">
            {validationErrors.reference_number}
          </div>
        )}
        <Form.Text className="text-muted">
          Only prescriptions that were previously filled can be returned.
        </Form.Text>
      </div>
      
      {transactionForm.reference_number && (
        <FormField
          label="Return Quantity"
          name="quantity"
          type="number"
          value={transactionForm.quantity}
          onChange={(e) => updateFormField('quantity', e.target.value)}
          inputProps={{
            min: 1,
            max: availablePrescriptions.find(rx => rx.prescription_number === transactionForm.reference_number)?.available_for_return || 1
          }}
          required
          helpText={`Maximum returnable: ${availablePrescriptions.find(rx => rx.prescription_number === transactionForm.reference_number)?.available_for_return || 0} units`}
          error={validationErrors.quantity}
          className={validationErrors.quantity ? 'is-invalid' : ''}
        />
      )}

      <FormField
        label="Return Reason"
        name="reason"
        type="textarea"
        rows={3}
        value={transactionForm.reason}
        onChange={(e) => updateFormField('reason', e.target.value)}
        required
        helpText="Provide a reason for this return (e.g., patient no longer needs medication, wrong dosage, etc.)"
        error={validationErrors.reason}
        className={validationErrors.reason ? 'is-invalid' : ''}
      />
    </div>
  );

  // Expire form content
  const ExpireForm = () => (
    <div>
      <ItemInfo />

      <FormField
        label="Quantity to Expire"
        name="quantity"
        type="number"
        value={transactionForm.quantity}
        onChange={(e) => updateFormField('quantity', e.target.value)}
        inputProps={{
          min: 1,
          max: selectedItem.quantity_on_hand
        }}
        required
        helpText={`Maximum available: ${selectedItem.quantity_on_hand} units`}
        error={validationErrors.quantity}
        className={validationErrors.quantity ? 'is-invalid' : ''}
      />

      <FormField
        label="Expiration Reason"
        name="reason"
        type="textarea"
        rows={3}
        value={transactionForm.reason}
        onChange={(e) => updateFormField('reason', e.target.value)}
        required
        placeholder="e.g., Past expiration date, damaged packaging, etc."
        helpText="Provide a reason for expiring this medication"
        error={validationErrors.reason}
        className={validationErrors.reason ? 'is-invalid' : ''}
      />
    </div>
  );

  // Audit form content
  const AuditForm = () => (
    <div>
      <ItemInfo />

      <FormField
        label="Actual Count"
        name="actual_quantity"
        type="number"
        value={transactionForm.actual_quantity}
        onChange={(e) => updateFormField('actual_quantity', e.target.value)}
        inputProps={{ min: 0 }}
        required
        helpText={`System shows: ${selectedItem.quantity_on_hand} units. Enter the actual physical count.`}
        error={validationErrors.actual_quantity}
        className={validationErrors.actual_quantity ? 'is-invalid' : ''}
      />

      {transactionForm.actual_quantity !== '' && (
        <div className="mb-3">
          <div className="alert alert-info">
            <strong>Adjustment:</strong> 
            {(() => {
              const difference = parseInt(transactionForm.actual_quantity) - selectedItem.quantity_on_hand;
              if (difference > 0) {
                return ` +${difference} units (increase)`;
              } else if (difference < 0) {
                return ` ${difference} units (decrease)`;
              } else {
                return ' No adjustment needed';
              }
            })()}
          </div>
        </div>
      )}

      <FormField
        label="Audit Reason"
        name="reason"
        type="textarea"
        rows={3}
        value={transactionForm.reason}
        onChange={(e) => updateFormField('reason', e.target.value)}
        required
        placeholder="e.g., Physical count discrepancy, damaged inventory, etc."
        helpText="Explain why this audit adjustment is necessary"
        error={validationErrors.reason}
        className={validationErrors.reason ? 'is-invalid' : ''}
      />
    </div>
  );

  // Render form content based on modal type
  const renderFormContent = () => {
    if (!selectedItem) return null;

    switch (modalType) {
      case 'prescription':
        return <PrescriptionForm />;
      case 'return':
        return <ReturnForm />;
      case 'expire':
        return <ExpireForm />;
      case 'audit':
        return <AuditForm />;
      default:
        return null;
    }
  };

  if (!modalType) return null;

  return (
    <DraggableDialog
      show={show}
      onHide={onHide}
      title={config.title}
      width={config.width}
      height={config.height}
      footer={<ModalFooter />}
    >
      {renderFormContent()}
    </DraggableDialog>
  );
};

export default TransactionModal;