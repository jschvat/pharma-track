/**
 * StatusBadge Component
 * 
 * Reusable badge component for displaying various status types with consistent styling.
 * Supports multiple predefined status types and custom configurations.
 * 
 * @author PharmaTraK Development Team
 * @version 1.0.0
 */

import React from 'react';
import { Badge } from 'react-bootstrap';

/**
 * StatusBadge - Reusable status indicator component
 * 
 * @param {Object} props - Component props
 * @param {string} props.type - Status type: 'active', 'role', 'stock', 'custom'
 * @param {any} props.value - The value to evaluate and display
 * @param {string} props.size - Badge size: 'sm', 'md', 'lg'
 * @param {Object} props.customConfig - Custom configuration for colors and logic
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element} StatusBadge component
 */
const StatusBadge = ({ 
  type = 'active', 
  value, 
  size = 'md',
  customConfig = {},
  className = '',
  ...props 
}) => {
  
  const getStatusConfig = () => {
    switch (type) {
      case 'active':
        return {
          variant: value ? 'success' : 'danger',
          text: value ? 'Active' : 'Inactive'
        };
      
      case 'role':
        return {
          variant: value === 'admin' ? 'primary' : 
                   value === 'manager' ? 'info' : 
                   value === 'staff' ? 'secondary' : 'light',
          text: value ? value.charAt(0).toUpperCase() + value.slice(1) : 'Unknown'
        };
      
      case 'stock':
        // Expects value as { quantity_on_hand, reorder_level }
        const isOutOfStock = value.quantity_on_hand <= 0;
        const isLowStock = value.quantity_on_hand <= (value.reorder_level || 0);
        
        return {
          variant: isOutOfStock ? 'danger' : isLowStock ? 'warning' : 'success',
          text: isOutOfStock ? 'Out of Stock' : 
                isLowStock ? 'Low Stock' : 'In Stock'
        };
      
      case 'prescription_status':
        return {
          variant: value === 'filled' ? 'success' :
                   value === 'pending' ? 'warning' :
                   value === 'cancelled' ? 'danger' : 'secondary',
          text: value ? value.charAt(0).toUpperCase() + value.slice(1) : 'Unknown'
        };
      
      case 'boolean':
        return {
          variant: value ? 'success' : 'danger',
          text: value ? 'Yes' : 'No'
        };
      
      case 'custom':
        return {
          variant: customConfig.variant || 'secondary',
          text: customConfig.text || value
        };
      
      default:
        return {
          variant: 'secondary',
          text: value
        };
    }
  };

  const getSizeClass = () => {
    switch (size) {
      case 'sm':
        return 'small';
      case 'lg':
        return 'fs-6';
      default:
        return '';
    }
  };

  const config = getStatusConfig();
  const sizeClass = getSizeClass();
  const combinedClassName = `${sizeClass} ${className}`.trim();

  return (
    <Badge 
      bg={config.variant} 
      className={combinedClassName}
      {...props}
    >
      {config.text}
    </Badge>
  );
};

export default StatusBadge;