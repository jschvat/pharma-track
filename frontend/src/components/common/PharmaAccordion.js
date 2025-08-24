/**
 * PharmaAccordion - Pharmacy-Themed Accordion Component
 * 
 * Enhanced Bootstrap Accordion with pharmacy-specific styling and features.
 * Perfect for organizing drug information, prescription details, and
 * medical data in expandable sections with pharmacy theming.
 * 
 * Features:
 * - Pharmacy-themed visual styles (pill, capsule, tablet headers)
 * - Drug information organization patterns
 * - Prescription workflow sections
 * - Medical data categorization
 * - Interactive expand/collapse animations
 * - Accessibility compliant navigation
 * 
 * @component
 * @author PharmaTraK Development Team
 * @version 1.0.0
 */

import React, { useState } from 'react';
import { Accordion, Card, Badge } from 'react-bootstrap';
import { PharmaBadge, PharmaSpinner } from './PharmaComponents';
import '../../css/pharma-components.css';

const PharmaAccordion = ({
  // Data
  items = [],
  
  // Visual theming
  pharmaTheme = 'tablet', // 'pill', 'capsule', 'tablet'
  variant = 'default', // 'default', 'primary', 'secondary'
  
  // Behavior
  defaultActiveKey = null,
  alwaysOpen = false,
  flush = false,
  
  // Events
  onSelect = null,
  onToggle = null,
  
  // Styling
  className = '',
  headerClassName = '',
  bodyClassName = '',
  
  // Loading
  loading = false,
  
  ...otherProps
}) => {
  
  const [activeKeys, setActiveKeys] = useState(
    defaultActiveKey ? [defaultActiveKey] : []
  );
  
  // Build CSS classes
  const accordionClasses = [
    'pharma-accordion',
    `pharma-accordion-${pharmaTheme}`,
    variant !== 'default' ? `pharma-accordion-${variant}` : '',
    flush ? 'pharma-accordion-flush' : '',
    className
  ].filter(Boolean).join(' ');
  
  // Handle accordion toggle
  const handleToggle = (eventKey) => {
    const newActiveKeys = alwaysOpen
      ? activeKeys.includes(eventKey)
        ? activeKeys.filter(key => key !== eventKey)
        : [...activeKeys, eventKey]
      : activeKeys.includes(eventKey)
        ? []
        : [eventKey];
    
    setActiveKeys(newActiveKeys);
    
    if (onToggle) {
      onToggle(eventKey, newActiveKeys);
    }
  };
  
  // Render accordion item header
  const renderHeader = (item, index) => {
    const eventKey = item.eventKey || index.toString();
    const isActive = activeKeys.includes(eventKey);
    
    return (
      <Accordion.Header 
        className={`pharma-accordion-header ${headerClassName}`}
        onClick={() => handleToggle(eventKey)}
      >
        <div className="pharma-accordion-header-content d-flex align-items-center justify-content-between w-100">
          <div className="pharma-accordion-title d-flex align-items-center">
            {item.icon && (
              <i className={`${item.icon} pharma-accordion-icon me-2`}></i>
            )}
            <span className="pharma-accordion-title-text">{item.title}</span>
            {item.subtitle && (
              <small className="text-muted ms-2">({item.subtitle})</small>
            )}
          </div>
          
          <div className="pharma-accordion-meta d-flex align-items-center gap-2">
            {item.badge && (
              <PharmaBadge
                variant={item.badge.variant || 'secondary'}
                pharmaType={pharmaTheme}
                size="sm"
              >
                {item.badge.text}
              </PharmaBadge>
            )}
            
            {item.status && (
              <PharmaBadge
                status={item.status}
                pharmaType={pharmaTheme}
                size="sm"
              />
            )}
            
            {item.loading && (
              <PharmaSpinner animation="pill" size="sm" />
            )}
            
            <i className={`fas fa-chevron-${isActive ? 'up' : 'down'} pharma-accordion-chevron`}></i>
          </div>
        </div>
      </Accordion.Header>
    );
  };
  
  // Render accordion item body
  const renderBody = (item, index) => {
    const eventKey = item.eventKey || index.toString();
    
    return (
      <Accordion.Body className={`pharma-accordion-body ${bodyClassName}`}>
        {typeof item.content === 'function' ? item.content() : item.content}
      </Accordion.Body>
    );
  };
  
  if (loading) {
    return (
      <div className="pharma-accordion-loading text-center py-4">
        <PharmaSpinner animation={pharmaTheme} size="lg" showLabel={true}>
          Loading accordion content...
        </PharmaSpinner>
      </div>
    );
  }
  
  return (
    <Accordion
      activeKey={alwaysOpen ? activeKeys : activeKeys[0]}
      onSelect={onSelect}
      flush={flush}
      className={accordionClasses}
      {...otherProps}
    >
      {items.map((item, index) => {
        const eventKey = item.eventKey || index.toString();
        
        return (
          <Accordion.Item
            key={eventKey}
            eventKey={eventKey}
            className="pharma-accordion-item"
          >
            {renderHeader(item, index)}
            {renderBody(item, index)}
          </Accordion.Item>
        );
      })}
    </Accordion>
  );
};

// Specialized accordion components
export const DrugInfoAccordion = ({ drug, ...props }) => {
  const items = [
    {
      title: 'Basic Information',
      icon: 'fas fa-info-circle',
      badge: { text: 'Required', variant: 'primary' },
      content: (
        <div className="pharma-drug-basic-info">
          <div className="row">
            <div className="col-md-6">
              <p><strong>NDC:</strong> {drug.ndc}</p>
              <p><strong>Generic Name:</strong> {drug.generic_name}</p>
              <p><strong>Brand Name:</strong> {drug.brand_name || 'N/A'}</p>
            </div>
            <div className="col-md-6">
              <p><strong>Strength:</strong> {drug.strength}</p>
              <p><strong>Dosage Form:</strong> {drug.dosage_form}</p>
              <p><strong>Manufacturer:</strong> {drug.manufacturer_name}</p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Clinical Information',
      icon: 'fas fa-stethoscope',
      badge: { text: 'Clinical', variant: 'success' },
      content: (
        <div className="pharma-drug-clinical-info">
          <p><strong>Route:</strong> {drug.route || 'N/A'}</p>
          <p><strong>DEA Schedule:</strong> {drug.dea_schedule || 'N/A'}</p>
          <p><strong>Product Type:</strong> {drug.product_type}</p>
          {drug.indications_and_usage && (
            <div>
              <strong>Indications and Usage:</strong>
              <div className="mt-2">{drug.indications_and_usage}</div>
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Safety Information',
      icon: 'fas fa-shield-alt',
      badge: { text: 'Safety', variant: 'warning' },
      content: (
        <div className="pharma-drug-safety-info">
          {drug.warnings && (
            <div className="mb-3">
              <strong>Warnings:</strong>
              <div className="mt-2 text-warning">{drug.warnings}</div>
            </div>
          )}
          {drug.contraindications && (
            <div className="mb-3">
              <strong>Contraindications:</strong>
              <div className="mt-2 text-danger">{drug.contraindications}</div>
            </div>
          )}
          {drug.adverse_reactions && (
            <div>
              <strong>Adverse Reactions:</strong>
              <div className="mt-2">{drug.adverse_reactions}</div>
            </div>
          )}
        </div>
      )
    }
  ];
  
  return (
    <PharmaAccordion
      items={items}
      pharmaTheme="pill"
      defaultActiveKey="0"
      {...props}
    />
  );
};

export const PrescriptionWorkflowAccordion = ({ prescription, ...props }) => {
  const items = [
    {
      title: 'Patient Information',
      icon: 'fas fa-user',
      status: prescription.patient_verified ? 'active' : 'pending',
      content: (
        <div className="pharma-prescription-patient">
          <p><strong>Name:</strong> {prescription.patient_name}</p>
          <p><strong>DOB:</strong> {prescription.patient_dob}</p>
          <p><strong>Address:</strong> {prescription.patient_address}</p>
          <p><strong>Insurance:</strong> {prescription.insurance_info}</p>
        </div>
      )
    },
    {
      title: 'Prescription Details',
      icon: 'fas fa-prescription',
      status: prescription.rx_verified ? 'active' : 'pending',
      content: (
        <div className="pharma-prescription-details">
          <p><strong>Drug:</strong> {prescription.drug_name}</p>
          <p><strong>Strength:</strong> {prescription.strength}</p>
          <p><strong>Quantity:</strong> {prescription.quantity}</p>
          <p><strong>Days Supply:</strong> {prescription.days_supply}</p>
          <p><strong>Refills:</strong> {prescription.refills_remaining}</p>
        </div>
      )
    },
    {
      title: 'Insurance & Billing',
      icon: 'fas fa-credit-card',
      status: prescription.insurance_processed ? 'active' : 'pending',
      content: (
        <div className="pharma-prescription-billing">
          <p><strong>Insurance Copay:</strong> ${prescription.copay}</p>
          <p><strong>Total Cost:</strong> ${prescription.total_cost}</p>
          <p><strong>Claim Status:</strong> {prescription.claim_status}</p>
        </div>
      )
    },
    {
      title: 'Fulfillment',
      icon: 'fas fa-check-circle',
      status: prescription.fulfilled ? 'active' : 'pending',
      content: (
        <div className="pharma-prescription-fulfillment">
          <p><strong>Filled Date:</strong> {prescription.filled_date || 'Pending'}</p>
          <p><strong>Pharmacist:</strong> {prescription.pharmacist || 'Unassigned'}</p>
          <p><strong>Status:</strong> {prescription.status}</p>
        </div>
      )
    }
  ];
  
  return (
    <PharmaAccordion
      items={items}
      pharmaTheme="capsule"
      alwaysOpen={true}
      {...props}
    />
  );
};

export const InventoryDetailsAccordion = ({ inventoryItem, ...props }) => {
  const items = [
    {
      title: 'Stock Information',
      icon: 'fas fa-boxes',
      badge: { text: `${inventoryItem.quantity_on_hand} units`, variant: 'info' },
      content: (
        <div className="pharma-inventory-stock">
          <div className="row">
            <div className="col-md-6">
              <p><strong>Current Stock:</strong> {inventoryItem.quantity_on_hand}</p>
              <p><strong>Reorder Level:</strong> {inventoryItem.reorder_level}</p>
              <p><strong>Max Stock:</strong> {inventoryItem.max_stock || 'N/A'}</p>
            </div>
            <div className="col-md-6">
              <p><strong>Unit Cost:</strong> ${inventoryItem.unit_cost}</p>
              <p><strong>Total Value:</strong> ${(inventoryItem.quantity_on_hand * inventoryItem.unit_cost).toFixed(2)}</p>
              <p><strong>Supplier:</strong> {inventoryItem.supplier || 'N/A'}</p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Batch Information',
      icon: 'fas fa-barcode',
      content: (
        <div className="pharma-inventory-batch">
          <p><strong>Lot Number:</strong> {inventoryItem.lot_number}</p>
          <p><strong>Expiration Date:</strong> {inventoryItem.expiration_date}</p>
          <p><strong>Received Date:</strong> {inventoryItem.received_date}</p>
          <p><strong>Location:</strong> {inventoryItem.location || 'N/A'}</p>
        </div>
      )
    }
  ];
  
  return (
    <PharmaAccordion
      items={items}
      pharmaTheme="tablet"
      defaultActiveKey="0"
      {...props}
    />
  );
};

export default PharmaAccordion;