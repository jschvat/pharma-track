/**
 * PharmaBadge - Pharmacy-Themed Badge Component
 * 
 * Enhanced Bootstrap Badge with pharmacy-specific styling and types.
 * Provides consistent visual indicators for pharmacy operations with
 * pill/capsule/tablet themed appearances.
 * 
 * Features:
 * - Pharmacy-themed visual styles (pill, capsule, tablet)
 * - Status-specific colors and meanings
 * - NDC and drug status indicators
 * - Prescription and inventory status badges
 * - Accessibility compliant with ARIA labels
 * 
 * @component
 * @author PharmaTraK Development Team
 * @version 1.0.0
 */

import React from 'react';
import { Badge } from 'react-bootstrap';
import '../../css/pharma-components.css';

const PharmaBadge = ({
  // Content
  children,
  
  // Pharmacy-specific variants
  variant = 'primary',
  pharmaType = 'default', // 'pill', 'capsule', 'tablet', 'default'
  status = null, // 'active', 'inactive', 'expired', 'low-stock', 'out-of-stock', 'recalled'
  
  // Visual appearance
  size = 'md', // 'sm', 'md', 'lg'
  pill = false,
  
  // Functionality
  clickable = false,
  onClick = null,
  
  // Accessibility
  'aria-label': ariaLabel,
  title,
  
  // Styling
  className = '',
  style = {},
  
  ...otherProps
}) => {
  
  // Determine variant based on status if provided
  const getStatusVariant = () => {
    if (!status) return variant;
    
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'secondary';
      case 'expired':
        return 'danger';
      case 'low-stock':
        return 'warning';
      case 'out-of-stock':
        return 'danger';
      case 'recalled':
        return 'danger';
      case 'pending':
        return 'info';
      case 'approved':
        return 'success';
      case 'rejected':
        return 'danger';
      case 'in-progress':
        return 'primary';
      default:
        return variant;
    }
  };
  
  // Build CSS classes
  const badgeClasses = [
    'pharma-badge',
    pharmaType !== 'default' ? `pharma-badge-${pharmaType}` : '',
    size !== 'md' ? `pharma-badge-${size}` : '',
    clickable ? 'pharma-badge-clickable' : '',
    status ? `pharma-badge-status-${status}` : '',
    className
  ].filter(Boolean).join(' ');
  
  // Handle click events
  const handleClick = (e) => {
    if (clickable && onClick) {
      e.preventDefault();
      onClick(e);
    }
  };
  
  // Render badge with pharmacy theming
  return (
    <Badge
      bg={getStatusVariant()}
      pill={pill || pharmaType === 'pill'}
      className={badgeClasses}
      style={style}
      onClick={handleClick}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      aria-label={ariaLabel}
      title={title}
      {...otherProps}
    >
      {children}
    </Badge>
  );
};

// Pharmacy-specific badge variants
export const StatusBadge = ({ status, children, ...props }) => (
  <PharmaBadge status={status} {...props}>
    {children || status}
  </PharmaBadge>
);

export const DrugStatusBadge = ({ active = true, ...props }) => (
  <PharmaBadge 
    status={active ? 'active' : 'inactive'} 
    pharmaType="pill"
    {...props}
  >
    {active ? 'Active' : 'Inactive'}
  </PharmaBadge>
);

export const StockStatusBadge = ({ quantity, reorderLevel = 0, ...props }) => {
  let status = 'active';
  let text = 'In Stock';
  
  if (quantity === 0) {
    status = 'out-of-stock';
    text = 'Out of Stock';
  } else if (quantity <= reorderLevel) {
    status = 'low-stock';
    text = 'Low Stock';
  }
  
  return (
    <PharmaBadge 
      status={status} 
      pharmaType="tablet"
      title={`Quantity: ${quantity}`}
      {...props}
    >
      {text}
    </PharmaBadge>
  );
};

export const PrescriptionStatusBadge = ({ status, ...props }) => (
  <PharmaBadge 
    status={status} 
    pharmaType="capsule"
    {...props}
  >
    {status === 'pending' && 'Pending'}
    {status === 'approved' && 'Approved'}
    {status === 'rejected' && 'Rejected'}
    {status === 'in-progress' && 'In Progress'}
  </PharmaBadge>
);

export const ExpirationBadge = ({ expirationDate, warningDays = 30, ...props }) => {
  const now = new Date();
  const expDate = new Date(expirationDate);
  const daysUntilExpiration = Math.ceil((expDate - now) / (1000 * 60 * 60 * 24));
  
  let status = 'active';
  let text = 'Valid';
  
  if (daysUntilExpiration < 0) {
    status = 'expired';
    text = 'Expired';
  } else if (daysUntilExpiration <= warningDays) {
    status = 'warning';
    text = `Expires in ${daysUntilExpiration} days`;
  }
  
  return (
    <PharmaBadge 
      status={status} 
      pharmaType="tablet"
      title={`Expires: ${expDate.toLocaleDateString()}`}
      {...props}
    >
      {text}
    </PharmaBadge>
  );
};

export default PharmaBadge;