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
import { Card, Table, Spinner, Badge, Dropdown, ButtonGroup } from 'react-bootstrap';
import CardHeader from '../common/CardHeader';

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

  // Action dropdown menu
  const ActionDropdown = ({ item }) => (
    <Dropdown as={ButtonGroup} size="sm">
      <Dropdown.Toggle 
        variant="outline-secondary" 
        size="sm"
        style={{fontSize: '0.7rem', padding: '2px 8px'}}
      >
        Actions
      </Dropdown.Toggle>
      <Dropdown.Menu>
        <Dropdown.Item 
          onClick={(e) => {
            e.stopPropagation();
            onTransaction('prescription', item);
          }}
          disabled={item.quantity_on_hand === 0}
        >
          📝 Fill Prescription
        </Dropdown.Item>
        <Dropdown.Item 
          onClick={(e) => {
            e.stopPropagation();
            onTransaction('return', item);
          }}
        >
          ↩️ Return to Stock
        </Dropdown.Item>
        <Dropdown.Item 
          onClick={(e) => {
            e.stopPropagation();
            onTransaction('expire', item);
          }}
          disabled={item.quantity_on_hand === 0}
        >
          ⚠️ Expire Medication
        </Dropdown.Item>
        <Dropdown.Item 
          onClick={(e) => {
            e.stopPropagation();
            onTransaction('audit', item);
          }}
        >
          🔍 Audit Count
        </Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  );

  // Loading state
  if (loading) {
    return (
      <Card className="inventory-card">
        <CardHeader
          title="Loading Inventory..."
          subtitle="Please wait"
        />
        <Card.Body>
          <div className="text-center py-4">
            <Spinner animation="border" variant="primary" />
          </div>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className="inventory-card">
      <CardHeader
        title={`Inventory Items (${pagination.total || 0})`}
        subtitle="💡 Click on any row to view transaction history"
      />
      <Card.Body>
        <div className="inventory-table-container">
          <div className="table-responsive">
            <Table striped hover size="sm">
              <thead>
                <tr>
                  <th>Drug</th>
                  <th>NDC</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Unit Cost</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {inventory.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center text-muted py-4">
                      No inventory items found
                    </td>
                  </tr>
                ) : (
                  inventory.map((item) => (
                    <React.Fragment key={item.id}>
                      <tr 
                        style={{verticalAlign: 'middle', cursor: 'pointer'}}
                        onClick={() => onRowClick(item)}
                        className="inventory-row"
                      >
                        <td>
                          <div>
                            <div className="fw-bold small">{item.generic_name}</div>
                            {item.brand_name && (
                              <div className="text-muted" style={{fontSize: '0.75rem'}}>
                                {item.brand_name}
                              </div>
                            )}
                            <div className="text-muted" style={{fontSize: '0.7rem'}}>
                              {item.dosage_form} {item.strength}
                            </div>
                          </div>
                        </td>
                        <td className="small font-monospace">{item.ndc}</td>
                        <td>
                          <div>
                            <span className="fw-bold">{item.quantity_on_hand}</span>
                            <div className="text-muted" style={{fontSize: '0.7rem'}}>
                              Reorder: {item.reorder_level}
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="d-flex flex-column align-items-start">
                            {getStatusBadge(item)}
                            {item.expiration_date && (
                              <div className="text-muted" style={{fontSize: '0.6rem'}}>
                                Exp: {new Date(item.expiration_date).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="small">
                          {formatCurrency(item.unit_cost)}
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <ActionDropdown item={item} />
                        </td>
                      </tr>
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </Table>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

export default InventoryTable;