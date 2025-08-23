/**
 * Inventory Table Component
 * 
 * Displays inventory items in a responsive table format with status indicators,
 * action buttons, and click handling for transaction history.
 * Extracted from Inventory.js to improve maintainability.
 * 
 * Features:
 * - Responsive table design
 * - Status badges (low stock, expiring)
 * - Action dropdown menus
 * - Row click handling for history
 * - Loading and empty states
 * 
 * @component
 * @author PharmaTraK Development Team
 * @version 1.0.0
 */

import React from 'react';
import { Badge } from 'react-bootstrap';
import { PharmaCard, PharmaTable } from '../common/PharmaComponents';

/**
 * InventoryTable Component - Displays inventory items in table format
 * 
 * @param {Object} props - Component props
 * @param {Array} props.inventory - Array of inventory items
 * @param {boolean} props.loading - Loading state
 * @param {Object} props.pagination - Pagination information
 * @param {Function} props.onRowClick - Function called when row is clicked
 * @param {Function} props.onTransaction - Function to handle transactions
 * @param {boolean} props.showHistorySidebar - Whether history sidebar is shown
 * @returns {JSX.Element} The inventory table component
 */
const InventoryTable = ({
  inventory = [],
  loading = false,
  pagination = {},
  onRowClick,
  onTransaction,
  showHistorySidebar = false
}) => {

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Get status badge for item
  const getStatusBadge = (item) => {
    const badges = [];
    
    // Low stock check
    if (item.quantity_on_hand <= item.reorder_level) {
      badges.push(
        <Badge key="low-stock" bg="warning" className="me-1" style={{fontSize: '0.6rem'}}>
          LOW STOCK
        </Badge>
      );
    }

    // Expiring check (within 30 days)
    if (item.expiration_date) {
      const expirationDate = new Date(item.expiration_date);
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      
      if (expirationDate <= thirtyDaysFromNow) {
        badges.push(
          <Badge key="expiring" bg="danger" className="me-1" style={{fontSize: '0.6rem'}}>
            EXPIRING
          </Badge>
        );
      }
    }

    // No stock
    if (item.quantity_on_hand === 0) {
      badges.push(
        <Badge key="out-of-stock" bg="secondary" className="me-1" style={{fontSize: '0.6rem'}}>
          OUT OF STOCK
        </Badge>
      );
    }

    return badges;
  };


  // Loading state
  if (loading) {
    return (
      <PharmaCard
        title="Loading Inventory..."
        subtitle="Please wait"
        loading={true}
        loadingRows={5}
        className="inventory-card"
      />
    );
  }

  // Define columns for PharmaTable
  const tableColumns = [
    {
      field: 'generic_name',
      label: 'Drug',
      render: (value, row) => (
        <div>
          <div className="fw-bold small">{value}</div>
          {row.brand_name && (
            <div className="text-muted" style={{fontSize: '0.75rem'}}>
              {row.brand_name}
            </div>
          )}
          <div className="text-muted" style={{fontSize: '0.7rem'}}>
            {row.dosage_form} {row.strength}
          </div>
        </div>
      )
    },
    {
      field: 'ndc',
      label: 'NDC',
      cellClassName: 'small font-monospace'
    },
    {
      field: 'quantity_on_hand',
      label: 'Stock',
      render: (value, row) => (
        <div>
          <span className="fw-bold">{value}</span>
          <div className="text-muted" style={{fontSize: '0.7rem'}}>
            Reorder: {row.reorder_level}
          </div>
        </div>
      )
    },
    {
      field: 'status',
      label: 'Status',
      render: (value, row) => (
        <div className="d-flex flex-column align-items-start">
          {getStatusBadge(row)}
          {row.expiration_date && (
            <div className="text-muted" style={{fontSize: '0.6rem'}}>
              Exp: {new Date(row.expiration_date).toLocaleDateString()}
            </div>
          )}
        </div>
      )
    },
    {
      field: 'unit_cost',
      label: 'Unit Cost',
      type: 'currency',
      cellClassName: 'small'
    }
  ];

  // Define actions for each row
  const tableActions = [
    {
      label: '📝',
      variant: 'outline-primary',
      tooltip: 'Fill Prescription',
      onClick: (row) => onTransaction('prescription', row),
      disabled: (row) => row.quantity_on_hand === 0
    },
    {
      label: '↩️',
      variant: 'outline-success',
      tooltip: 'Return to Stock',
      onClick: (row) => onTransaction('return', row)
    },
    {
      label: '⚠️',
      variant: 'outline-warning',
      tooltip: 'Expire Medication',
      onClick: (row) => onTransaction('expire', row),
      disabled: (row) => row.quantity_on_hand === 0
    },
    {
      label: '🔍',
      variant: 'outline-secondary',
      tooltip: 'Audit Count',
      onClick: (row) => onTransaction('audit', row)
    }
  ];

  return (
    <PharmaCard
      title={`Inventory Items (${pagination.total || 0})`}
      subtitle="💡 Click on any row to view transaction history"
      headerIcon="📦"
      className="inventory-card"
    >
      <PharmaTable
        data={inventory}
        columns={tableColumns}
        actions={tableActions}
        loading={loading}
        loadingRows={5}
        emptyMessage="No inventory items found"
        emptyIcon="📦"
        onRowClick={onRowClick}
        striped={true}
        hover={true}
        size="sm"
        responsive={true}
        actionsPosition="end"
        className="inventory-table-container"
      />
    </PharmaCard>
  );
};

export default InventoryTable;