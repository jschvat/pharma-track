# Pharmacy Workflow Examples

Real-world examples of using PharmaTraK components to build complete pharmacy management workflows.

## Table of Contents

- [Prescription Processing](#prescription-processing)
- [Inventory Management](#inventory-management)
- [Patient Management](#patient-management)
- [Drug Information System](#drug-information-system)
- [Reporting Dashboard](#reporting-dashboard)
- [Compliance Monitoring](#compliance-monitoring)

---

## Prescription Processing

Complete prescription workflow from intake to dispensing.

### Prescription Intake Form

```jsx
import React, { useState } from 'react';
import {
  PharmaForm,
  PharmaFormGroup,
  PharmaSearch,
  PharmaButton,
  PharmaModal,
  DrugTooltip,
  PharmaAlert
} from '@pharmatrak/component-library';

function PrescriptionIntakeForm() {
  const [prescription, setPrescription] = useState({});
  const [selectedDrug, setSelectedDrug] = useState(null);
  const [showDrugModal, setShowDrugModal] = useState(false);
  const [interactions, setInteractions] = useState([]);

  const validationRules = {
    patient_id: [
      { type: 'required', message: 'Patient selection is required' }
    ],
    prescriber_id: [
      { type: 'required', message: 'Prescriber is required' }
    ],
    drug_id: [
      { type: 'required', message: 'Medication selection is required' }
    ],
    quantity: [
      { type: 'required', message: 'Quantity is required' },
      { type: 'custom', message: 'Quantity must be positive', value: (val) => val > 0 }
    ],
    days_supply: [
      { type: 'required', message: 'Days supply is required' },
      { type: 'custom', message: 'Days supply must be between 1-90', value: (val) => val >= 1 && val <= 90 }
    ],
    sig: [
      { type: 'required', message: 'Prescription directions are required' },
      { type: 'minLength', value: 10, message: 'Directions must be at least 10 characters' }
    ]
  };

  const handleDrugSelection = async (drug) => {
    setSelectedDrug(drug);
    
    // Check for interactions
    const patientMedications = await getPatientMedications(prescription.patient_id);
    const drugInteractions = await checkDrugInteractions(drug.id, patientMedications);
    
    if (drugInteractions.length > 0) {
      setInteractions(drugInteractions);
    }
  };

  const handleSubmit = async (formData) => {
    try {
      const result = await createPrescription(formData);
      
      if (result.success) {
        showNotification({
          type: 'success',
          title: 'Prescription Created',
          message: `Prescription #${result.data.rx_number} has been created successfully.`
        });
        
        // Navigate to prescription review
        navigateTo(`/prescriptions/${result.data.id}/review`);
      }
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Creation Failed',
        message: 'Failed to create prescription. Please try again.'
      });
    }
  };

  return (
    <div className="prescription-intake">
      <h2>New Prescription Intake</h2>
      
      {interactions.length > 0 && (
        <PharmaAlert variant="warning" className="mb-4">
          <strong>Drug Interaction Alert:</strong> {interactions.length} potential interaction(s) detected.
          <PharmaButton 
            size="sm" 
            variant="outline-warning" 
            className="ml-2"
            onClick={() => setShowInteractionModal(true)}
          >
            Review Interactions
          </PharmaButton>
        </PharmaAlert>
      )}

      <PharmaForm
        onSubmit={handleSubmit}
        validationRules={validationRules}
        className="prescription-form"
      >
        {/* Patient Selection */}
        <div className="row">
          <div className="col-md-6">
            <PharmaFormGroup
              label="Patient"
              name="patient_id"
              fieldType="select"
              required
              helpText="Search by name, phone, or date of birth"
            >
              <PharmaSearch
                placeholder="Search patients..."
                searchTypes={['patient']}
                onResultSelect={(patient) => {
                  setPrescription(prev => ({ ...prev, patient_id: patient.id }));
                }}
              />
            </PharmaFormGroup>
          </div>
          
          <div className="col-md-6">
            <PharmaFormGroup
              label="Prescriber"
              name="prescriber_id"
              fieldType="select"
              required
              helpText="Select prescribing physician"
            >
              <PharmaSearch
                placeholder="Search prescribers..."
                searchTypes={['prescriber']}
                onResultSelect={(prescriber) => {
                  setPrescription(prev => ({ ...prev, prescriber_id: prescriber.id }));
                }}
              />
            </PharmaFormGroup>
          </div>
        </div>

        {/* Medication Selection */}
        <PharmaFormGroup
          label="Medication"
          name="drug_id"
          required
          helpText="Search by drug name, NDC, or generic name"
        >
          <div className="input-group">
            <PharmaSearch
              placeholder="Search medications..."
              searchTypes={['drug', 'ndc']}
              onResultSelect={handleDrugSelection}
            />
            <div className="input-group-append">
              <PharmaButton
                variant="outline-secondary"
                onClick={() => setShowDrugModal(true)}
              >
                Browse Formulary
              </PharmaButton>
            </div>
          </div>
          
          {selectedDrug && (
            <div className="selected-drug mt-2 p-3 bg-light rounded">
              <h6>
                <DrugTooltip drug={selectedDrug} showInteractions>
                  {selectedDrug.generic_name}
                </DrugTooltip>
                {selectedDrug.brand_name && (
                  <small className="text-muted ml-2">({selectedDrug.brand_name})</small>
                )}
              </h6>
              <div className="drug-details">
                <span className="badge badge-primary mr-2">{selectedDrug.strength}</span>
                <span className="badge badge-secondary mr-2">{selectedDrug.dosage_form}</span>
                <span className="badge badge-info">{selectedDrug.route}</span>
              </div>
            </div>
          )}
        </PharmaFormGroup>

        {/* Prescription Details */}
        <div className="row">
          <div className="col-md-4">
            <PharmaFormGroup
              label="Quantity"
              name="quantity"
              fieldType="number"
              required
              min={1}
              helpText="Number of units to dispense"
            />
          </div>
          
          <div className="col-md-4">
            <PharmaFormGroup
              label="Days Supply"
              name="days_supply"
              fieldType="number"
              required
              min={1}
              max={90}
              helpText="Expected days supply (1-90)"
            />
          </div>
          
          <div className="col-md-4">
            <PharmaFormGroup
              label="Refills"
              name="refills_authorized"
              fieldType="number"
              min={0}
              max={5}
              defaultValue={0}
              helpText="Number of refills authorized"
            />
          </div>
        </div>

        <PharmaFormGroup
          label="Prescription Directions (Sig)"
          name="sig"
          fieldType="textarea"
          required
          rows={3}
          placeholder="Take 1 tablet by mouth twice daily with food"
          helpText="Clear directions for patient use"
        />

        <PharmaFormGroup
          label="Notes (Internal)"
          name="notes"
          fieldType="textarea"
          rows={2}
          placeholder="Internal notes for pharmacy staff"
          helpText="Private notes not visible to patient"
        />

        {/* Priority and Flags */}
        <div className="row">
          <div className="col-md-6">
            <PharmaFormGroup
              label="Priority"
              name="priority"
              fieldType="select"
              options={[
                { value: 'routine', label: 'Routine' },
                { value: 'urgent', label: 'Urgent' },
                { value: 'stat', label: 'STAT' },
                { value: 'asap', label: 'ASAP' }
              ]}
              defaultValue="routine"
            />
          </div>
          
          <div className="col-md-6">
            <div className="form-check-list">
              <PharmaFormGroup
                label="Special Instructions"
                name="special_instructions"
                fieldType="checkbox"
                options={[
                  { value: 'generic_substitution', label: 'Generic substitution allowed' },
                  { value: 'safety_cap', label: 'Safety cap required' },
                  { value: 'consultation_required', label: 'Pharmacist consultation required' }
                ]}
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="form-actions mt-4">
          <PharmaButton type="submit" variant="success" size="lg">
            Create Prescription
          </PharmaButton>
          
          <PharmaButton 
            type="button" 
            variant="secondary" 
            size="lg" 
            className="ml-3"
            onClick={() => saveDraft()}
          >
            Save as Draft
          </PharmaButton>
          
          <PharmaButton 
            type="button" 
            variant="outline-secondary" 
            size="lg" 
            className="ml-3"
            onClick={() => resetForm()}
          >
            Clear Form
          </PharmaButton>
        </div>
      </PharmaForm>

      {/* Drug Selection Modal */}
      <PharmaModal
        show={showDrugModal}
        onHide={() => setShowDrugModal(false)}
        title="Select Medication"
        size="lg"
      >
        <DrugFormularyBrowser onSelect={handleDrugSelection} />
      </PharmaModal>
    </div>
  );
}
```

### Prescription Review & Filling

```jsx
function PrescriptionReview({ prescriptionId }) {
  const [prescription, setPrescription] = useState(null);
  const [inventoryCheck, setInventoryCheck] = useState(null);
  const [fillingStatus, setFillingStatus] = useState('ready');
  
  useEffect(() => {
    loadPrescription();
    checkInventoryAvailability();
  }, [prescriptionId]);

  const handleFillPrescription = async () => {
    setFillingStatus('filling');
    
    try {
      const result = await fillPrescription(prescriptionId);
      
      if (result.success) {
        setFillingStatus('filled');
        showNotification({
          type: 'success',
          title: 'Prescription Filled',
          message: `Prescription #${prescription.rx_number} has been filled successfully.`
        });
      }
    } catch (error) {
      setFillingStatus('error');
      showNotification({
        type: 'error',
        title: 'Filling Failed',
        message: error.message || 'Failed to fill prescription.'
      });
    }
  };

  return (
    <div className="prescription-review">
      <PharmaBreadcrumbs
        items={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Prescriptions', path: '/prescriptions' },
          { label: `RX #${prescription?.rx_number}`, current: true }
        ]}
      />

      <div className="prescription-header mb-4">
        <div className="d-flex justify-content-between align-items-center">
          <h2>Prescription Review</h2>
          <div className="prescription-status">
            <span className={`badge badge-${getStatusColor(prescription?.status)}`}>
              {prescription?.status?.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* Inventory Alert */}
      {inventoryCheck && !inventoryCheck.available && (
        <PharmaAlert variant="warning" className="mb-4">
          <strong>Insufficient Inventory:</strong> Only {inventoryCheck.available_quantity} units available. 
          Prescription requires {prescription.quantity} units.
          <PharmaButton 
            size="sm" 
            variant="outline-warning" 
            className="ml-2"
            onClick={() => orderInventory()}
          >
            Order More
          </PharmaButton>
        </PharmaAlert>
      )}

      <div className="row">
        {/* Prescription Details */}
        <div className="col-lg-8">
          <div className="card">
            <div className="card-header">
              <h5>Prescription Details</h5>
            </div>
            <div className="card-body">
              <div className="prescription-info">
                <div className="row mb-3">
                  <div className="col-sm-3"><strong>RX Number:</strong></div>
                  <div className="col-sm-9">{prescription?.rx_number}</div>
                </div>
                
                <div className="row mb-3">
                  <div className="col-sm-3"><strong>Patient:</strong></div>
                  <div className="col-sm-9">
                    {prescription?.patient?.first_name} {prescription?.patient?.last_name}
                    <br />
                    <small className="text-muted">
                      DOB: {prescription?.patient?.date_of_birth} | 
                      Phone: {prescription?.patient?.phone}
                    </small>
                  </div>
                </div>
                
                <div className="row mb-3">
                  <div className="col-sm-3"><strong>Prescriber:</strong></div>
                  <div className="col-sm-9">
                    Dr. {prescription?.prescriber?.first_name} {prescription?.prescriber?.last_name}
                    <br />
                    <small className="text-muted">
                      DEA: {prescription?.prescriber?.dea_number} | 
                      NPI: {prescription?.prescriber?.npi}
                    </small>
                  </div>
                </div>
                
                <div className="row mb-3">
                  <div className="col-sm-3"><strong>Medication:</strong></div>
                  <div className="col-sm-9">
                    <DrugTooltip drug={prescription?.drug} showInteractions>
                      {prescription?.drug?.generic_name}
                    </DrugTooltip>
                    {prescription?.drug?.brand_name && (
                      <small className="text-muted ml-2">({prescription?.drug?.brand_name})</small>
                    )}
                    <br />
                    <span className="badge badge-primary mr-2">{prescription?.drug?.strength}</span>
                    <span className="badge badge-secondary">{prescription?.drug?.dosage_form}</span>
                  </div>
                </div>
                
                <div className="row mb-3">
                  <div className="col-sm-3"><strong>Directions:</strong></div>
                  <div className="col-sm-9">
                    <div className="prescription-sig">
                      {prescription?.sig}
                    </div>
                  </div>
                </div>
                
                <div className="row">
                  <div className="col-sm-6">
                    <strong>Quantity:</strong> {prescription?.quantity} {prescription?.drug?.dosage_form?.toLowerCase()}s
                  </div>
                  <div className="col-sm-6">
                    <strong>Days Supply:</strong> {prescription?.days_supply} days
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions Panel */}
        <div className="col-lg-4">
          <div className="card">
            <div className="card-header">
              <h5>Actions</h5>
            </div>
            <div className="card-body">
              <div className="action-buttons d-grid gap-2">
                <PharmaButton
                  variant="success"
                  size="lg"
                  loading={fillingStatus === 'filling'}
                  loadingText="Filling..."
                  disabled={!inventoryCheck?.available || fillingStatus === 'filled'}
                  onClick={handleFillPrescription}
                >
                  {fillingStatus === 'filled' ? 'Filled' : 'Fill Prescription'}
                </PharmaButton>
                
                <PharmaButton
                  variant="info"
                  onClick={() => printLabel()}
                >
                  Print Label
                </PharmaButton>
                
                <PharmaButton
                  variant="secondary"
                  onClick={() => contactPatient()}
                >
                  Contact Patient
                </PharmaButton>
                
                <PharmaButton
                  variant="warning"
                  confirmAction
                  confirmMessage="Are you sure you want to return this prescription to stock?"
                  onClick={() => returnToStock()}
                >
                  Return to Stock
                </PharmaButton>
                
                <PharmaButton
                  variant="outline-danger"
                  confirmAction
                  confirmMessage="This will cancel the prescription. This action cannot be undone."
                  onClick={() => cancelPrescription()}
                >
                  Cancel Prescription
                </PharmaButton>
              </div>
            </div>
          </div>

          {/* Inventory Status */}
          <div className="card mt-3">
            <div className="card-header">
              <h6>Inventory Status</h6>
            </div>
            <div className="card-body">
              <div className="inventory-status">
                <div className="d-flex justify-content-between">
                  <span>Available:</span>
                  <span className={inventoryCheck?.available ? 'text-success' : 'text-danger'}>
                    {inventoryCheck?.available_quantity || 0} units
                  </span>
                </div>
                <div className="d-flex justify-content-between">
                  <span>Required:</span>
                  <span>{prescription?.quantity} units</span>
                </div>
                <div className="d-flex justify-content-between">
                  <span>Lot Number:</span>
                  <span>{inventoryCheck?.lot_number || 'N/A'}</span>
                </div>
                <div className="d-flex justify-content-between">
                  <span>Expiration:</span>
                  <span>{inventoryCheck?.expiration_date || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## Inventory Management

Complete inventory management system with real-time updates.

### Inventory Dashboard

```jsx
function InventoryDashboard() {
  const [inventoryStats, setInventoryStats] = useState({});
  const [lowStockItems, setLowStockItems] = useState([]);
  const [expiringItems, setExpiringItems] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);

  const inventoryColumns = [
    {
      key: 'drug_name',
      label: 'Medication',
      render: (value, row) => (
        <DrugTooltip drug={row.drug}>
          <span className="drug-name">
            {row.drug.generic_name}
            {row.drug.brand_name && (
              <small className="text-muted d-block">{row.drug.brand_name}</small>
            )}
          </span>
        </DrugTooltip>
      )
    },
    {
      key: 'ndc',
      label: 'NDC',
      format: 'ndc',
      render: (value) => <code>{value}</code>
    },
    {
      key: 'quantity_on_hand',
      label: 'Quantity',
      align: 'right',
      render: (value, row) => (
        <span className={`badge ${value <= row.reorder_level ? 'badge-warning' : 'badge-success'}`}>
          {value}
        </span>
      )
    },
    {
      key: 'reorder_level',
      label: 'Reorder Level',
      align: 'right'
    },
    {
      key: 'expiration_date',
      label: 'Expires',
      format: 'date',
      render: (value) => {
        const isExpiringSoon = isWithinDays(value, 30);
        return (
          <span className={isExpiringSoon ? 'text-warning' : ''}>
            {formatDate(value)}
            {isExpiringSoon && <i className="fas fa-exclamation-triangle ml-1" />}
          </span>
        );
      }
    }
  ];

  const inventoryActions = [
    {
      key: 'adjust',
      label: 'Adjust',
      variant: 'primary',
      size: 'sm',
      onClick: (row) => openAdjustmentModal(row)
    },
    {
      key: 'reorder',
      label: 'Reorder',
      variant: 'warning',
      size: 'sm',
      visible: (row) => row.quantity_on_hand <= row.reorder_level,
      onClick: (row) => initiateReorder(row)
    },
    {
      key: 'history',
      label: 'History',
      variant: 'info',
      size: 'sm',
      onClick: (row) => viewTransactionHistory(row)
    }
  ];

  return (
    <div className="inventory-dashboard">
      <div className="dashboard-header mb-4">
        <div className="d-flex justify-content-between align-items-center">
          <h2>Inventory Management</h2>
          <div className="header-actions">
            <PharmaButton
              variant="success"
              icon={<i className="fas fa-plus" />}
              onClick={() => setShowAddModal(true)}
            >
              Add Item
            </PharmaButton>
            
            <PharmaButton
              variant="info"
              icon={<i className="fas fa-upload" />}
              className="ml-2"
              onClick={() => setShowImportModal(true)}
            >
              Import Inventory
            </PharmaButton>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="row mb-4">
        <div className="col-md-3">
          <div className="card text-center">
            <div className="card-body">
              <h3 className="text-primary">{inventoryStats.totalItems || 0}</h3>
              <p className="card-text">Total Items</p>
            </div>
          </div>
        </div>
        
        <div className="col-md-3">
          <div className="card text-center">
            <div className="card-body">
              <h3 className="text-warning">{inventoryStats.lowStockItems || 0}</h3>
              <p className="card-text">Low Stock</p>
            </div>
          </div>
        </div>
        
        <div className="col-md-3">
          <div className="card text-center">
            <div className="card-body">
              <h3 className="text-danger">{inventoryStats.expiringItems || 0}</h3>
              <p className="card-text">Expiring Soon</p>
            </div>
          </div>
        </div>
        
        <div className="col-md-3">
          <div className="card text-center">
            <div className="card-body">
              <h3 className="text-success">${inventoryStats.totalValue || 0}</h3>
              <p className="card-text">Total Value</p>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {lowStockItems.length > 0 && (
        <PharmaAlert variant="warning" className="mb-4">
          <strong>Low Stock Alert:</strong> {lowStockItems.length} items are below reorder level.
          <PharmaButton 
            size="sm" 
            variant="outline-warning" 
            className="ml-2"
            onClick={() => viewLowStockItems()}
          >
            View Items
          </PharmaButton>
        </PharmaAlert>
      )}

      {expiringItems.length > 0 && (
        <PharmaAlert variant="danger" className="mb-4">
          <strong>Expiration Alert:</strong> {expiringItems.length} items expiring within 30 days.
          <PharmaButton 
            size="sm" 
            variant="outline-danger" 
            className="ml-2"
            onClick={() => viewExpiringItems()}
          >
            View Items
          </PharmaButton>
        </PharmaAlert>
      )}

      {/* Main Inventory Table */}
      <div className="card">
        <div className="card-header">
          <h5>Current Inventory</h5>
        </div>
        <div className="card-body">
          <PharmaTable
            data={inventory}
            columns={inventoryColumns}
            actions={inventoryActions}
            pagination={{
              enabled: true,
              pageSize: 25,
              showSizeChanger: true,
              showQuickJumper: true
            }}
            sorting={{
              enabled: true,
              defaultSort: { key: 'drug_name', direction: 'asc' }
            }}
            filtering={{
              enabled: true,
              globalSearch: true,
              columnFilters: true
            }}
            selection={{
              enabled: true,
              mode: 'multiple',
              onSelectionChange: handleSelectionChange
            }}
            responsive
            striped
            hover
          />
        </div>
      </div>
    </div>
  );
}
```

### Inventory Adjustment Modal

```jsx
function InventoryAdjustmentModal({ item, show, onHide, onSave }) {
  const [adjustment, setAdjustment] = useState({
    type: 'manual',
    quantity_change: 0,
    reason: '',
    reference_number: '',
    notes: ''
  });

  const adjustmentTypes = [
    { value: 'manual', label: 'Manual Count Adjustment' },
    { value: 'damaged', label: 'Damaged/Expired' },
    { value: 'returned', label: 'Customer Return' },
    { value: 'transfer', label: 'Store Transfer' },
    { value: 'theft', label: 'Theft/Loss' },
    { value: 'donation', label: 'Donation' }
  ];

  const handleSubmit = async (formData) => {
    try {
      const result = await adjustInventory(item.id, formData);
      
      if (result.success) {
        showNotification({
          type: 'success',
          title: 'Inventory Adjusted',
          message: `${item.drug.generic_name} inventory has been updated.`
        });
        
        onSave(result.data);
        onHide();
      }
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Adjustment Failed',
        message: error.message || 'Failed to adjust inventory.'
      });
    }
  };

  return (
    <PharmaModal
      show={show}
      onHide={onHide}
      title="Adjust Inventory"
      size="lg"
    >
      <div className="inventory-adjustment">
        {/* Current Status */}
        <div className="current-status mb-4 p-3 bg-light rounded">
          <h6>Current Status</h6>
          <div className="row">
            <div className="col-md-6">
              <strong>Medication:</strong> {item?.drug?.generic_name}
              <br />
              <strong>NDC:</strong> {item?.drug?.ndc}
            </div>
            <div className="col-md-6">
              <strong>Current Quantity:</strong> {item?.quantity_on_hand}
              <br />
              <strong>Lot Number:</strong> {item?.lot_number || 'N/A'}
            </div>
          </div>
        </div>

        <PharmaForm onSubmit={handleSubmit}>
          <div className="row">
            <div className="col-md-6">
              <PharmaFormGroup
                label="Adjustment Type"
                name="type"
                fieldType="select"
                options={adjustmentTypes}
                required
              />
            </div>
            
            <div className="col-md-6">
              <PharmaFormGroup
                label="Quantity Change"
                name="quantity_change"
                fieldType="number"
                required
                helpText="Use negative numbers to decrease inventory"
              />
            </div>
          </div>

          <PharmaFormGroup
            label="Reason"
            name="reason"
            fieldType="textarea"
            required
            rows={3}
            placeholder="Explain the reason for this adjustment..."
          />

          <div className="row">
            <div className="col-md-6">
              <PharmaFormGroup
                label="Reference Number"
                name="reference_number"
                placeholder="Invoice, RMA, or reference number"
                helpText="Optional reference for tracking"
              />
            </div>
            
            <div className="col-md-6">
              <PharmaFormGroup
                label="Performed By"
                name="performed_by"
                value={currentUser.name}
                disabled
              />
            </div>
          </div>

          {/* Quantity Preview */}
          <div className="quantity-preview mt-3 p-3 border rounded">
            <div className="row">
              <div className="col-md-4">
                <div className="text-center">
                  <div className="h4">{item?.quantity_on_hand}</div>
                  <small className="text-muted">Current</small>
                </div>
              </div>
              
              <div className="col-md-4 text-center">
                <i className="fas fa-arrow-right text-primary"></i>
              </div>
              
              <div className="col-md-4">
                <div className="text-center">
                  <div className="h4 text-primary">
                    {(item?.quantity_on_hand || 0) + (adjustment.quantity_change || 0)}
                  </div>
                  <small className="text-muted">New Quantity</small>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <PharmaButton type="button" variant="secondary" onClick={onHide}>
              Cancel
            </PharmaButton>
            
            <PharmaButton 
              type="submit" 
              variant="primary"
              confirmAction
              confirmMessage="Are you sure you want to adjust this inventory?"
            >
              Save Adjustment
            </PharmaButton>
          </div>
        </PharmaForm>
      </div>
    </PharmaModal>
  );
}
```

---

## Patient Management

Comprehensive patient management with HIPAA compliance.

### Patient Registration

```jsx
function PatientRegistration() {
  const [patient, setPatient] = useState({});
  const [insuranceCards, setInsuranceCards] = useState([]);
  const [allergies, setAllergies] = useState([]);

  const patientValidationRules = {
    first_name: [
      { type: 'required', message: 'First name is required' },
      { type: 'minLength', value: 2, message: 'Minimum 2 characters' }
    ],
    last_name: [
      { type: 'required', message: 'Last name is required' }
    ],
    date_of_birth: [
      { type: 'required', message: 'Date of birth is required' },
      { type: 'custom', message: 'Patient must be under 150 years old', 
        value: (dob) => {
          const age = calculateAge(dob);
          return age <= 150;
        }
      }
    ],
    phone: [
      { type: 'required', message: 'Phone number is required' },
      { type: 'phone', message: 'Valid phone number required' }
    ],
    email: [
      { type: 'email', message: 'Valid email address required' }
    ],
    address: [
      { type: 'required', message: 'Address is required' }
    ]
  };

  return (
    <div className="patient-registration">
      <h2>Patient Registration</h2>
      
      <PharmaForm
        onSubmit={handlePatientRegistration}
        validationRules={patientValidationRules}
        showProgress
        progressSteps={['Personal Info', 'Contact Info', 'Insurance', 'Medical History']}
      >
        {/* Step 1: Personal Information */}
        <div className="form-step" data-step="0">
          <h4>Personal Information</h4>
          
          <div className="row">
            <div className="col-md-6">
              <PharmaFormGroup
                label="First Name"
                name="first_name"
                required
                autoComplete="given-name"
              />
            </div>
            
            <div className="col-md-6">
              <PharmaFormGroup
                label="Last Name"
                name="last_name"
                required
                autoComplete="family-name"
              />
            </div>
          </div>

          <div className="row">
            <div className="col-md-6">
              <PharmaFormGroup
                label="Date of Birth"
                name="date_of_birth"
                fieldType="date"
                required
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
            
            <div className="col-md-6">
              <PharmaFormGroup
                label="Gender"
                name="gender"
                fieldType="select"
                options={[
                  { value: 'male', label: 'Male' },
                  { value: 'female', label: 'Female' },
                  { value: 'other', label: 'Other' },
                  { value: 'not_specified', label: 'Prefer not to specify' }
                ]}
              />
            </div>
          </div>
        </div>

        {/* Step 2: Contact Information */}
        <div className="form-step" data-step="1">
          <h4>Contact Information</h4>
          
          <PharmaFormGroup
            label="Primary Phone"
            name="phone"
            fieldType="phone"
            required
            autoComplete="tel"
          />

          <PharmaFormGroup
            label="Email Address"
            name="email"
            fieldType="email"
            autoComplete="email"
            helpText="For prescription notifications and pharmacy communications"
          />

          <PharmaFormGroup
            label="Address"
            name="address"
            required
            autoComplete="street-address"
          />

          <div className="row">
            <div className="col-md-6">
              <PharmaFormGroup
                label="City"
                name="city"
                required
                autoComplete="address-level2"
              />
            </div>
            
            <div className="col-md-3">
              <PharmaFormGroup
                label="State"
                name="state"
                fieldType="select"
                options={US_STATES}
                required
                autoComplete="address-level1"
              />
            </div>
            
            <div className="col-md-3">
              <PharmaFormGroup
                label="ZIP Code"
                name="zipcode"
                pattern="[0-9]{5}(-[0-9]{4})?"
                required
                autoComplete="postal-code"
              />
            </div>
          </div>

          {/* Emergency Contact */}
          <h5 className="mt-4">Emergency Contact</h5>
          
          <div className="row">
            <div className="col-md-6">
              <PharmaFormGroup
                label="Emergency Contact Name"
                name="emergency_contact.name"
              />
            </div>
            
            <div className="col-md-6">
              <PharmaFormGroup
                label="Relationship"
                name="emergency_contact.relationship"
                placeholder="Spouse, Parent, Sibling, etc."
              />
            </div>
          </div>

          <PharmaFormGroup
            label="Emergency Contact Phone"
            name="emergency_contact.phone"
            fieldType="phone"
          />
        </div>

        {/* Step 3: Insurance Information */}
        <div className="form-step" data-step="2">
          <h4>Insurance Information</h4>
          
          <InsuranceCardManager
            insuranceCards={insuranceCards}
            onChange={setInsuranceCards}
          />
        </div>

        {/* Step 4: Medical History */}
        <div className="form-step" data-step="3">
          <h4>Medical History</h4>
          
          <AllergyManager
            allergies={allergies}
            onChange={setAllergies}
          />

          <PharmaFormGroup
            label="Current Medications"
            name="current_medications"
            fieldType="textarea"
            rows={4}
            placeholder="List all current medications, vitamins, and supplements..."
            helpText="Include prescription and over-the-counter medications"
          />

          <PharmaFormGroup
            label="Medical Conditions"
            name="medical_conditions"
            fieldType="textarea"
            rows={3}
            placeholder="List any chronic conditions, surgeries, or significant medical history..."
          />

          <PharmaFormGroup
            label="Preferred Language"
            name="preferred_language"
            fieldType="select"
            options={[
              { value: 'english', label: 'English' },
              { value: 'spanish', label: 'Spanish' },
              { value: 'french', label: 'French' },
              { value: 'other', label: 'Other' }
            ]}
          />
        </div>

        {/* HIPAA Notice */}
        <div className="hipaa-notice mt-4 p-3 border rounded">
          <h6>HIPAA Notice</h6>
          <p className="small">
            By providing this information, you acknowledge that you have received our 
            Notice of Privacy Practices and understand your rights regarding the 
            protection of your health information.
          </p>
          
          <PharmaFormGroup
            name="hipaa_acknowledgment"
            fieldType="checkbox"
            options={[
              { 
                value: 'acknowledged', 
                label: 'I acknowledge receipt of the HIPAA Notice of Privacy Practices' 
              }
            ]}
            validation={[
              { type: 'required', message: 'HIPAA acknowledgment is required' }
            ]}
          />
        </div>
      </PharmaForm>
    </div>
  );
}
```

This comprehensive example demonstrates real-world pharmacy workflows using PharmaTraK components with proper validation, error handling, and pharmacy-specific features like NDC validation, drug interactions, and HIPAA compliance.