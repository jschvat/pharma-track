/**
 * TransactionBadge Component
 * 
 * Reusable badge component specifically for displaying transaction types
 * with consistent styling, colors, icons, and text formatting.
 * 
 * @author PharmaTraK Development Team
 * @version 1.0.0
 */

import React from 'react';
import { Badge } from 'react-bootstrap';

/**
 * TransactionBadge - Specialized badge for transaction types
 * 
 * @param {Object} props - Component props
 * @param {string} props.type - Transaction type (e.g., 'prescription_fill', 'return_to_stock', etc.)
 * @param {boolean} props.showIcon - Whether to show the emoji icon
 * @param {string} props.size - Badge size: 'sm', 'md' (default), 'lg'
 * @param {boolean} props.showText - Whether to show the text label
 * @param {string} props.className - Additional CSS classes
 * @param {Object} props.customConfig - Custom configuration for unknown transaction types
 * @returns {JSX.Element} TransactionBadge component
 */
const TransactionBadge = ({ 
  type,
  showIcon = true,
  size = 'md',
  showText = true,
  className = '',
  customConfig = {},
  ...props 
}) => {
  
  // Transaction type configurations
  const getTransactionConfig = () => {
    const configs = {
      'prescription_fill': {
        variant: 'primary',
        icon: '💊',
        label: 'Prescription Fill'
      },
      'return_to_stock': {
        variant: 'danger',
        icon: '↩️',
        label: 'Return to Stock'
      },
      'expire': {
        variant: 'warning',
        icon: '⚠️',
        label: 'Expired'
      },
      'audit': {
        variant: 'info',
        icon: '🔍',
        label: 'Audit'
      },
      'shipment_received': {
        variant: 'success',
        icon: '📦',
        label: 'Shipment Received'
      },
      'initial_inventory': {
        variant: 'dark',
        icon: '📦',
        label: 'Initial Inventory'
      },
      'adjustment': {
        variant: 'secondary',
        icon: '⚖️',
        label: 'Adjustment'
      },
      'transfer_in': {
        variant: 'info',
        icon: '📥',
        label: 'Transfer In'
      },
      'transfer_out': {
        variant: 'warning',
        icon: '📤',
        label: 'Transfer Out'
      },
      'damage': {
        variant: 'danger',
        icon: '🚫',
        label: 'Damaged'
      },
      'loss': {
        variant: 'danger',
        icon: '❌',
        label: 'Lost'
      }
    };

    return configs[type] || {
      variant: customConfig.variant || 'secondary',
      icon: customConfig.icon || '📋',
      label: customConfig.label || formatTransactionType(type)
    };
  };

  // Format transaction type text (fallback for unknown types)
  const formatTransactionType = (type) => {
    if (!type) return 'Unknown';
    
    return type
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Get size-specific styles
  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          fontSize: '0.65rem',
          padding: '0.15rem 0.3rem'
        };
      case 'lg':
        return {
          fontSize: '0.9rem',
          padding: '0.4rem 0.8rem'
        };
      default: // md
        return {
          fontSize: '0.7rem',
          padding: '0.25rem 0.5rem'
        };
    }
  };

  const config = getTransactionConfig();
  const sizeStyles = getSizeStyles();

  // Build the badge content
  const content = (
    <>
      {showIcon && config.icon && <span>{config.icon}</span>}
      {showIcon && showText && <span> </span>}
      {showText && <span>{config.label}</span>}
    </>
  );

  return (
    <Badge 
      bg={config.variant}
      className={`transaction-badge ${className}`.trim()}
      style={sizeStyles}
      {...props}
    >
      {content}
    </Badge>
  );
};

export default TransactionBadge;