/**
 * AddDrugModal Component
 * 
 * Modal dialog for adding FDA drugs to the database with initial inventory details.
 * Extracted from FDASearch.js to improve modularity and reusability.
 * 
 * Features:
 * - Drug information display
 * - Package NDC selection (when multiple packages available)
 * - Initial inventory form (quantity, pricing, lot info, etc.)
 * - Form validation and error handling
 * - Professional Bootstrap modal design
 * 
 * @component
 * @author PharmaTraK Development Team
 * @version 1.0.0
 */

import React from 'react';
import { Modal, Button, Form, Row, Col, Alert } from 'react-bootstrap';

/**
 * AddDrugModal Component - Modal for adding drug with initial inventory
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.show - Whether the modal is visible
 * @param {Function} props.onHide - Handler for closing the modal
 * @param {Object} props.selectedDrug - Selected drug object from FDA search
 * @param {string} props.selectedPackageNDC - Selected package NDC
 * @param {Function} props.onPackageNDCChange - Handler for package NDC selection
 * @param {Object} props.initialInventoryForm - Initial inventory form data
 * @param {Function} props.onInventoryFormChange - Handler for inventory form changes
 * @param {Function} props.onSubmit - Handler for form submission
 * @param {boolean} props.addingToDatabase - Loading state for database addition
 * @param {string} props.modalError - Error message to display in modal
 * @param {Function} props.formatNDC - Function to format NDC numbers
 * @param {Function} props.standardizeNDC - Function to standardize NDC format
 * @returns {JSX.Element} The add drug modal component
 */
const AddDrugModal = ({
  show,
  onHide,
  selectedDrug,
  selectedPackageNDC,
  onPackageNDCChange,
  initialInventoryForm,
  onInventoryFormChange,
  onSubmit,
  addingToDatabase,
  modalError,
  formatNDC,
  standardizeNDC
}) => {
  /**
   * Handle modal close with cleanup
   */
  const handleClose = () => {
    onHide();
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Add Drug to Inventory</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {selectedDrug && (
          <>
            {/* Drug Information Display */}
            <div className="mb-4 p-3 bg-light rounded">
              <h6 className="text-primary mb-2">Drug Information</h6>
              <Row>
                <Col md={6}>
                  <strong>Generic Name:</strong> {selectedDrug.generic_name}<br/>
                  <strong>Brand Name:</strong> {selectedDrug.brand_name || 'N/A'}<br/>
                  <strong>NDC:</strong> {formatNDC(selectedDrug.ndc)}
                </Col>
                <Col md={6}>
                  <strong>Manufacturer:</strong> {selectedDrug.manufacturer_name || 'N/A'}<br/>
                  <strong>Dosage Form:</strong> {selectedDrug.dosage_form || 'N/A'}<br/>
                  <strong>Strength:</strong> {selectedDrug.strength || 'N/A'}
                </Col>
              </Row>
            </div>

            {/* Package Selection */}
            {selectedDrug.packaging && selectedDrug.packaging.length > 0 && (
              <div className="mb-4">
                <h6 className="text-primary mb-2">Select Package Information</h6>
                <Form.Group className="mb-3">
                  <Form.Label>
                    Package NDC and Description 
                    <span className="text-danger">*</span>
                    <i 
                      className="bi bi-info-circle ms-2 text-info" 
                      title="Select the specific package NDC from the available options. The selected NDC will be used for database entry."
                    ></i>
                  </Form.Label>
                  <Form.Control
                    as="select"
                    value={selectedPackageNDC}
                    onChange={(e) => onPackageNDCChange(e.target.value)}
                    required
                  >
                    <option value="">Choose a package...</option>
                    {selectedDrug.packaging.map((pkg, index) => (
                      <option key={index} value={pkg.package_ndc}>
                        NDC: {standardizeNDC(pkg.package_ndc)} - {pkg.description || 'No description'}
                      </option>
                    ))}
                  </Form.Control>
                  {selectedPackageNDC && (
                    <div className="form-text">
                      <strong>Selected Package NDC (5-4-2 format):</strong> {standardizeNDC(selectedPackageNDC)}
                    </div>
                  )}
                </Form.Group>
              </div>
            )}

            {/* Modal Error Display */}
            {modalError && (
              <Alert variant="danger" className="d-flex align-items-center mb-3">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                <div>{modalError}</div>
              </Alert>
            )}
            
            {/* Initial Inventory Form */}
            <h6 className="mb-3">Initial Inventory Details</h6>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Initial Quantity <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="number"
                    name="quantity"
                    value={initialInventoryForm.quantity}
                    onChange={onInventoryFormChange}
                    min="1"
                    required
                    placeholder="Enter initial quantity"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Reorder Level</Form.Label>
                  <Form.Control
                    type="number"
                    name="reorder_level"
                    value={initialInventoryForm.reorder_level}
                    onChange={onInventoryFormChange}
                    min="0"
                    placeholder="Minimum stock level"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Unit Cost</Form.Label>
                  <Form.Control
                    type="number"
                    name="unit_cost"
                    value={initialInventoryForm.unit_cost}
                    onChange={onInventoryFormChange}
                    min="0"
                    step="0.01"
                    placeholder="Cost per unit"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Selling Price</Form.Label>
                  <Form.Control
                    type="number"
                    name="selling_price"
                    value={initialInventoryForm.selling_price}
                    onChange={onInventoryFormChange}
                    min="0"
                    step="0.01"
                    placeholder="Selling price per unit"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Lot Number</Form.Label>
                  <Form.Control
                    type="text"
                    name="lot_number"
                    value={initialInventoryForm.lot_number}
                    onChange={onInventoryFormChange}
                    placeholder="Batch/lot number"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Expiration Date</Form.Label>
                  <Form.Control
                    type="date"
                    name="expiration_date"
                    value={initialInventoryForm.expiration_date}
                    onChange={onInventoryFormChange}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Supplier</Form.Label>
              <Form.Control
                type="text"
                name="supplier"
                value={initialInventoryForm.supplier}
                onChange={onInventoryFormChange}
                placeholder="Supplier name"
              />
            </Form.Group>
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Cancel
        </Button>
        <Button 
          variant="primary" 
          onClick={onSubmit}
          disabled={
            addingToDatabase || 
            !initialInventoryForm.quantity || 
            (selectedDrug?.packaging?.length > 0 && !selectedPackageNDC)
          }
        >
          {addingToDatabase ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status"></span>
              Adding...
            </>
          ) : (
            'Add to Inventory'
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default AddDrugModal;