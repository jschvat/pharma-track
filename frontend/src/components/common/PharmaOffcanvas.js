/**
 * PharmaOffcanvas - Pharmacy-Themed Offcanvas Component
 * 
 * Enhanced Bootstrap Offcanvas with pharmacy-specific styling and features.
 * Perfect for prescription details, drug information panels, patient records,
 * and other contextual information that needs to slide in from screen edges.
 * 
 * Features:
 * - Pharmacy-themed visual styles with pill/capsule/tablet headers
 * - Prescription and drug information optimized layouts
 * - Patient record side panels
 * - Inventory detail drawers
 * - Quick action toolbars
 * - Mobile-responsive design
 * 
 * @component
 * @author PharmaTraK Development Team
 * @version 1.0.0
 */

import React from 'react';
import { Offcanvas, CloseButton } from 'react-bootstrap';
import { PharmaBadge, PharmaButton, PharmaSpinner } from './PharmaComponents';
import '../../css/pharma-components.css';

const PharmaOffcanvas = ({
  // Visibility
  show = false,
  onHide = null,
  
  // Placement
  placement = 'end', // 'top', 'bottom', 'start', 'end'
  
  // Content
  title = '',
  children,
  
  // Visual theming
  pharmaTheme = 'capsule', // 'pill', 'capsule', 'tablet'
  variant = 'default', // 'default', 'primary', 'secondary', 'success', 'warning', 'danger'
  size = 'md', // 'sm', 'md', 'lg', 'xl'
  
  // Header configuration
  headerIcon = null,
  headerBadge = null,
  headerActions = [],
  showCloseButton = true,
  
  // Footer configuration
  footerActions = [],
  showFooter = false,
  
  // Behavior
  backdrop = true,
  keyboard = true,
  scroll = false,
  
  // Loading state
  loading = false,
  loadingMessage = 'Loading...',
  
  // Events
  onShow = null,
  onExited = null,
  
  // Styling
  className = '',
  headerClassName = '',
  bodyClassName = '',
  footerClassName = '',
  
  ...otherProps
}) => {
  
  // Build CSS classes
  const offcanvasClasses = [
    'pharma-offcanvas',
    `pharma-offcanvas-${pharmaTheme}`,
    variant !== 'default' ? `pharma-offcanvas-${variant}` : '',
    size !== 'md' ? `pharma-offcanvas-${size}` : '',
    className
  ].filter(Boolean).join(' ');
  
  const headerClasses = [
    'pharma-offcanvas-header',
    `pharma-offcanvas-header-${pharmaTheme}`,
    headerClassName
  ].filter(Boolean).join(' ');
  
  const bodyClasses = [
    'pharma-offcanvas-body',
    bodyClassName
  ].filter(Boolean).join(' ');
  
  const footerClasses = [
    'pharma-offcanvas-footer',
    footerClassName
  ].filter(Boolean).join(' ');
  
  // Render header
  const renderHeader = () => (
    <Offcanvas.Header className={headerClasses}>
      <div className="pharma-offcanvas-title-section d-flex align-items-center flex-grow-1">
        {headerIcon && (
          <i className={`${headerIcon} pharma-offcanvas-icon me-2`}></i>
        )}
        <Offcanvas.Title className="pharma-offcanvas-title">
          {title}
          {headerBadge && (
            <PharmaBadge
              variant={headerBadge.variant || 'secondary'}
              pharmaType={pharmaTheme}
              size="sm"
              className="ms-2"
            >
              {headerBadge.text}
            </PharmaBadge>
          )}
        </Offcanvas.Title>
      </div>
      
      {/* Header actions */}
      {headerActions.length > 0 && (
        <div className="pharma-offcanvas-header-actions d-flex align-items-center gap-2 me-2">
          {headerActions.map((action, index) => (
            <PharmaButton
              key={index}
              variant={action.variant || 'outline-secondary'}
              size="sm"
              onClick={action.onClick}
              pharmaType={pharmaTheme}
              title={action.tooltip}
            >
              {action.icon && <i className={action.icon}></i>}
              {action.text && <span className="ms-1">{action.text}</span>}
            </PharmaButton>
          ))}
        </div>
      )}
      
      {/* Close button */}
      {showCloseButton && (
        <CloseButton 
          onClick={onHide}
          className="pharma-offcanvas-close"
          variant={variant === 'dark' ? 'white' : undefined}
        />
      )}
    </Offcanvas.Header>
  );
  
  // Render body
  const renderBody = () => (
    <Offcanvas.Body className={bodyClasses}>
      {loading ? (
        <div className="pharma-offcanvas-loading text-center py-5">
          <PharmaSpinner 
            animation={pharmaTheme} 
            size="lg" 
            showLabel={true}
            centered={true}
          >
            {loadingMessage}
          </PharmaSpinner>
        </div>
      ) : (
        children
      )}
    </Offcanvas.Body>
  );
  
  // Render footer
  const renderFooter = () => {
    if (!showFooter && footerActions.length === 0) return null;
    
    return (
      <div className={footerClasses}>
        <div className="pharma-offcanvas-footer-content d-flex justify-content-end gap-2">
          {footerActions.map((action, index) => (
            <PharmaButton
              key={index}
              variant={action.variant || 'primary'}
              size={action.size || 'sm'}
              onClick={action.onClick}
              pharmaType={pharmaTheme}
              disabled={action.disabled || loading}
            >
              {action.icon && <i className={`${action.icon} me-1`}></i>}
              {action.text}
            </PharmaButton>
          ))}
        </div>
      </div>
    );
  };
  
  return (
    <Offcanvas
      show={show}
      onHide={onHide}
      onShow={onShow}
      onExited={onExited}
      placement={placement}
      backdrop={backdrop}
      keyboard={keyboard}
      scroll={scroll}
      className={offcanvasClasses}
      {...otherProps}
    >
      {renderHeader()}
      {renderBody()}
      {renderFooter()}
    </Offcanvas>
  );
};

// Specialized offcanvas components
export const PrescriptionDetailsOffcanvas = ({ 
  prescription, 
  onApprove = null,
  onReject = null,
  onEdit = null,
  ...props 
}) => (
  <PharmaOffcanvas
    title="Prescription Details"
    headerIcon="fas fa-prescription"
    pharmaTheme="capsule"
    size="lg"
    headerBadge={{ 
      text: prescription?.status || 'Unknown', 
      variant: prescription?.status === 'approved' ? 'success' : 'warning' 
    }}
    headerActions={[
      {
        icon: 'fas fa-edit',
        tooltip: 'Edit Prescription',
        onClick: onEdit,
        variant: 'outline-primary'
      },
      {
        icon: 'fas fa-print',
        tooltip: 'Print Label',
        onClick: () => console.log('Print prescription'),
        variant: 'outline-secondary'
      }
    ]}
    footerActions={[
      {
        text: 'Reject',
        variant: 'danger',
        icon: 'fas fa-times',
        onClick: onReject
      },
      {
        text: 'Approve',
        variant: 'success',
        icon: 'fas fa-check',
        onClick: onApprove
      }
    ]}
    showFooter={true}
    {...props}
  >
    {prescription && (
      <div className="pharma-prescription-details">
        <div className="mb-4">
          <h6><i className="fas fa-user me-2"></i>Patient Information</h6>
          <p><strong>Name:</strong> {prescription.patient_name}</p>
          <p><strong>DOB:</strong> {prescription.patient_dob}</p>
          <p><strong>Phone:</strong> {prescription.patient_phone}</p>
        </div>
        
        <div className="mb-4">
          <h6><i className="fas fa-pills me-2"></i>Medication</h6>
          <p><strong>Drug:</strong> {prescription.drug_name}</p>
          <p><strong>Strength:</strong> {prescription.strength}</p>
          <p><strong>Quantity:</strong> {prescription.quantity}</p>
          <p><strong>Days Supply:</strong> {prescription.days_supply}</p>
        </div>
        
        <div className="mb-4">
          <h6><i className="fas fa-user-md me-2"></i>Prescriber</h6>
          <p><strong>Doctor:</strong> {prescription.prescriber_name}</p>
          <p><strong>DEA:</strong> {prescription.prescriber_dea}</p>
          <p><strong>Date Written:</strong> {prescription.date_written}</p>
        </div>
      </div>
    )}
  </PharmaOffcanvas>
);

export const DrugInfoOffcanvas = ({ drug, ...props }) => (
  <PharmaOffcanvas
    title="Drug Information"
    headerIcon="fas fa-info-circle"
    pharmaTheme="pill"
    size="lg"
    headerBadge={{ 
      text: drug?.is_active ? 'Active' : 'Inactive', 
      variant: drug?.is_active ? 'success' : 'secondary' 
    }}
    headerActions={[
      {
        icon: 'fas fa-external-link-alt',
        tooltip: 'View in FDA Database',
        onClick: () => window.open(`https://www.accessdata.fda.gov/scripts/cder/daf/index.cfm?event=overview.process&ApplNo=${drug?.ndc}`, '_blank'),
        variant: 'outline-info'
      }
    ]}
    {...props}
  >
    {drug && (
      <div className="pharma-drug-info">
        <div className="mb-4">
          <h6><i className="fas fa-capsules me-2"></i>Basic Information</h6>
          <p><strong>NDC:</strong> {drug.ndc}</p>
          <p><strong>Generic Name:</strong> {drug.generic_name}</p>
          <p><strong>Brand Name:</strong> {drug.brand_name || 'N/A'}</p>
          <p><strong>Manufacturer:</strong> {drug.manufacturer_name}</p>
        </div>
        
        <div className="mb-4">
          <h6><i className="fas fa-weight me-2"></i>Formulation</h6>
          <p><strong>Strength:</strong> {drug.strength}</p>
          <p><strong>Dosage Form:</strong> {drug.dosage_form}</p>
          <p><strong>Route:</strong> {drug.route || 'N/A'}</p>
          <p><strong>DEA Schedule:</strong> {drug.dea_schedule || 'N/A'}</p>
        </div>
        
        <div className="mb-4">
          <h6><i className="fas fa-shield-alt me-2"></i>Safety Information</h6>
          {drug.warnings && (
            <div className="alert alert-warning">
              <strong>Warnings:</strong> {drug.warnings}
            </div>
          )}
          {drug.contraindications && (
            <div className="alert alert-danger">
              <strong>Contraindications:</strong> {drug.contraindications}
            </div>
          )}
        </div>
      </div>
    )}
  </PharmaOffcanvas>
);

export const InventoryDetailsOffcanvas = ({ 
  inventoryItem, 
  onAdjustStock = null,
  onMarkExpired = null,
  ...props 
}) => (
  <PharmaOffcanvas
    title="Inventory Details"
    headerIcon="fas fa-boxes"
    pharmaTheme="tablet"
    headerBadge={{ 
      text: `${inventoryItem?.quantity_on_hand || 0} units`, 
      variant: 'info' 
    }}
    footerActions={[
      {
        text: 'Adjust Stock',
        variant: 'primary',
        icon: 'fas fa-edit',
        onClick: onAdjustStock
      },
      {
        text: 'Mark Expired',
        variant: 'warning',
        icon: 'fas fa-exclamation-triangle',
        onClick: onMarkExpired
      }
    ]}
    showFooter={true}
    {...props}
  >
    {inventoryItem && (
      <div className="pharma-inventory-details">
        <div className="mb-4">
          <h6><i className="fas fa-pills me-2"></i>Drug Information</h6>
          <p><strong>NDC:</strong> {inventoryItem.ndc}</p>
          <p><strong>Name:</strong> {inventoryItem.generic_name}</p>
          <p><strong>Brand:</strong> {inventoryItem.brand_name || 'N/A'}</p>
        </div>
        
        <div className="mb-4">
          <h6><i className="fas fa-warehouse me-2"></i>Stock Information</h6>
          <p><strong>Current Stock:</strong> {inventoryItem.quantity_on_hand}</p>
          <p><strong>Reorder Level:</strong> {inventoryItem.reorder_level}</p>
          <p><strong>Unit Cost:</strong> ${inventoryItem.unit_cost}</p>
          <p><strong>Total Value:</strong> ${(inventoryItem.quantity_on_hand * inventoryItem.unit_cost).toFixed(2)}</p>
        </div>
        
        <div className="mb-4">
          <h6><i className="fas fa-calendar me-2"></i>Batch Information</h6>
          <p><strong>Lot Number:</strong> {inventoryItem.lot_number}</p>
          <p><strong>Expiration Date:</strong> {inventoryItem.expiration_date}</p>
          <p><strong>Received Date:</strong> {inventoryItem.received_date}</p>
        </div>
      </div>
    )}
  </PharmaOffcanvas>
);

export const QuickActionsOffcanvas = ({ actions = [], ...props }) => (
  <PharmaOffcanvas
    title="Quick Actions"
    headerIcon="fas fa-bolt"
    pharmaTheme="capsule"
    size="sm"
    placement="start"
    {...props}
  >
    <div className="pharma-quick-actions-grid">
      {actions.map((action, index) => (
        <PharmaButton
          key={index}
          variant={action.variant || 'outline-primary'}
          size="lg"
          onClick={action.onClick}
          className="pharma-quick-action-btn mb-2 w-100 text-start"
        >
          <i className={`${action.icon} me-3`}></i>
          <div>
            <div className="fw-bold">{action.title}</div>
            {action.description && (
              <small className="text-muted">{action.description}</small>
            )}
          </div>
        </PharmaButton>
      ))}
    </div>
  </PharmaOffcanvas>
);

export default PharmaOffcanvas;