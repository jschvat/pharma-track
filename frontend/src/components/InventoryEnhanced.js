/**
 * Enhanced Inventory Component - Phase 4 Components Demonstration
 * 
 * This component demonstrates how Phase 4 advanced components can dramatically
 * improve complex pharmacy workflows by replacing traditional Bootstrap components
 * with sophisticated, pharmacy-specific functionality.
 * 
 * Key Enhancements:
 * - PharmaDataGrid with advanced filtering and sorting
 * - PharmaTabs for organized workflow management
 * - PharmaForm for streamlined transaction processing
 * - PharmaDatePicker for expiration date management
 * - PharmaProgressBar for inventory health indicators
 * 
 * @component
 * @author PharmaTraK Development Team - Phase 4 Integration
 * @version 4.0.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Badge } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { inventoryAPI } from '../services/api';
import {
  PharmaDataGrid,
  InventoryDataGrid,
  PharmaTabs,
  PharmaForm,
  InventoryForm,
  PharmaDatePicker,
  ExpirationDatePicker,
  PharmaCard,
  PharmaButton,
  PharmaProgressBar,
  InventoryProgress,
  PharmaAlert
} from './common/PharmaComponents';

const InventoryEnhanced = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [inventory, setInventory] = useState([]);
  const [stats, setStats] = useState({});
  const [lowStockItems, setLowStockItems] = useState([]);
  const [expiringItems, setExpiringItems] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  
  // Transaction modal state
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [transactionType, setTransactionType] = useState('');

  // Load enhanced inventory data
  const loadInventoryData = useCallback(async () => {
    if (!user?.store_id) return;
    
    try {
      setLoading(true);
      setError('');
      
      // Load consolidated inventory data
      const response = await inventoryAPI.getConsolidated(user.store_id, {
        page: 1,
        limit: 100,
        active: true
      });
      
      const data = response.data.data;
      setInventory(data.inventory || []);
      setStats(data.stats || {});
      setLowStockItems(data.low_stock || []);
      setExpiringItems(data.expiring || []);
      setRecentTransactions(data.recent_transactions || []);
      
    } catch (err) {
      console.error('Failed to load inventory:', err);
      setError('Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  }, [user?.store_id]);

  useEffect(() => {
    loadInventoryData();
  }, [loadInventoryData]);

  // Handle inventory actions
  const handleInventoryAction = (action, item) => {
    setSelectedItem(item);
    setTransactionType(action);
    setShowTransactionModal(true);
  };

  // Handle transaction form submission
  const handleTransactionSubmit = async (formData, { reset }) => {
    try {
      setLoading(true);
      
      let response;
      switch (transactionType) {
        case 'prescription':
          response = await inventoryAPI.fillPrescription(selectedItem.id, {
            quantity: parseInt(formData.quantity),
            prescription_number: formData.prescription_number,
            reason: formData.reason || 'Prescription fill'
          });
          break;
        case 'return':
          response = await inventoryAPI.returnToStock(selectedItem.id, {
            quantity: parseInt(formData.quantity),
            reason: formData.reason,
            reference_number: formData.reference_number
          });
          break;
        case 'expire':
          response = await inventoryAPI.expire(selectedItem.id, {
            quantity: parseInt(formData.quantity),
            reason: formData.reason
          });
          break;
        case 'audit':
          response = await inventoryAPI.audit(selectedItem.id, {
            actual_quantity: parseInt(formData.actual_quantity),
            reason: formData.reason
          });
          break;
        default:
          throw new Error('Invalid transaction type');
      }
      
      // Close modal and refresh data
      setShowTransactionModal(false);
      reset();
      await loadInventoryData();
      
      console.log('Transaction completed successfully:', response.data);
      
    } catch (err) {
      console.error('Transaction failed:', err);
      setError(`Transaction failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Render inventory health indicators
  const renderInventoryHealth = () => {
    if (!stats.total_items) return null;
    
    const healthScore = Math.max(
      100 - ((stats.low_stock_items / stats.total_items) * 100) -
      ((stats.expiring_items / stats.total_items) * 100), 
      0
    );
    
    return (
      <Row className="mb-4">
        <Col>
          <PharmaCard
            title="Inventory Health Dashboard"
            headerIcon="📊"
            variant="primary"
          >
            <Row className="text-center">
              <Col md={3}>
                <div className="mb-3">
                  <div className="display-6 fw-bold text-primary">📦</div>
                  <div className="h4 mb-1">{stats.total_items}</div>
                  <div className="text-muted small">Total Items</div>
                  <InventoryProgress
                    value={100}
                    label="Inventory Coverage"
                    size="sm"
                    className="mt-2"
                  />
                </div>
              </Col>
              <Col md={3}>
                <div className="mb-3">
                  <div className="display-6 fw-bold text-success">✅</div>
                  <div className="h4 mb-1">{stats.active_items}</div>
                  <div className="text-muted small">Active Items</div>
                  <InventoryProgress
                    value={(stats.active_items / stats.total_items) * 100}
                    label="Active Ratio"
                    size="sm"
                    className="mt-2"
                  />
                </div>
              </Col>
              <Col md={3}>
                <div className="mb-3">
                  <div className="display-6 fw-bold text-warning">⚠️</div>
                  <div className="h4 mb-1">{stats.low_stock_items}</div>
                  <div className="text-muted small">Low Stock</div>
                  <InventoryProgress
                    value={Math.max(100 - (stats.low_stock_items / stats.total_items) * 100, 0)}
                    label="Stock Health"
                    size="sm"
                    className="mt-2"
                  />
                </div>
              </Col>
              <Col md={3}>
                <div className="mb-3">
                  <div className="display-6 fw-bold text-danger">🚨</div>
                  <div className="h4 mb-1">{stats.expiring_items}</div>
                  <div className="text-muted small">Expiring Soon</div>
                  <InventoryProgress
                    type="expiration"
                    value={Math.max(100 - (stats.expiring_items / stats.total_items) * 100, 0)}
                    label="Freshness Score"
                    size="sm"
                    className="mt-2"
                  />
                </div>
              </Col>
            </Row>
            
            <hr />
            
            <div className="text-center">
              <h6 className="mb-2">Overall Inventory Health Score</h6>
              <PharmaProgressBar
                value={healthScore}
                label="Health Score"
                showPercentage={true}
                type="inventory"
                size="lg"
                gradient={true}
                className="mx-auto"
                style={{ maxWidth: '400px' }}
              />
              <div className="mt-2">
                <Badge bg={healthScore > 80 ? 'success' : healthScore > 60 ? 'warning' : 'danger'}>
                  {healthScore > 80 ? 'Excellent' : healthScore > 60 ? 'Good' : 'Needs Attention'}
                </Badge>
              </div>
            </div>
          </PharmaCard>
        </Col>
      </Row>
    );
  };

  // Render main inventory interface with tabs
  const renderInventoryTabs = () => {
    return (
      <PharmaTabs
        variant="pills"
        showBadges={true}
        showIcons={true}
        tabs={[
          {
            id: 'current',
            label: 'Current Stock',
            icon: '📦',
            badge: { content: inventory.length, variant: 'primary' },
            content: (
              <PharmaCard>
                <InventoryDataGrid
                  data={inventory}
                  loading={loading}
                  searchable={true}
                  filterable={true}
                  sortable={true}
                  exportable={true}
                  selectable={false}
                  paginated={true}
                  pageSize={25}
                  rowActions={[
                    {
                      icon: '💊',
                      label: 'Fill Prescription',
                      variant: 'outline-primary',
                      tooltip: 'Fill prescription from this item',
                      onClick: (row) => handleInventoryAction('prescription', row),
                      disabled: (row) => row.quantity_on_hand === 0
                    },
                    {
                      icon: '↩️',
                      label: 'Return',
                      variant: 'outline-success',
                      tooltip: 'Return to stock',
                      onClick: (row) => handleInventoryAction('return', row)
                    },
                    {
                      icon: '⚠️',
                      label: 'Expire',
                      variant: 'outline-warning',
                      tooltip: 'Mark as expired',
                      onClick: (row) => handleInventoryAction('expire', row),
                      disabled: (row) => row.quantity_on_hand === 0
                    },
                    {
                      icon: '🔍',
                      label: 'Audit',
                      variant: 'outline-secondary',
                      tooltip: 'Perform inventory audit',
                      onClick: (row) => handleInventoryAction('audit', row)
                    }
                  ]}
                  columns={[
                    { field: 'ndc', label: 'NDC', type: 'ndc', sortable: true, filterable: true },
                    { 
                      field: 'generic_name', 
                      label: 'Drug Name', 
                      sortable: true, 
                      filterable: true,
                      render: (value, row) => (
                        <div>
                          <div className="fw-bold">{value}</div>
                          {row.brand_name && (
                            <div className="text-muted small">{row.brand_name}</div>
                          )}
                          <div className="text-muted small">
                            {row.strength} • {row.dosage_form}
                          </div>
                        </div>
                      )
                    },
                    { 
                      field: 'quantity_on_hand', 
                      label: 'Stock', 
                      type: 'number', 
                      sortable: true,
                      render: (value, row) => (
                        <div>
                          <span className={`fw-bold ${value <= row.reorder_level ? 'text-warning' : ''}`}>
                            {value}
                          </span>
                          <div className="text-muted small">
                            Reorder: {row.reorder_level}
                          </div>
                        </div>
                      )
                    },
                    { 
                      field: 'unit_cost', 
                      label: 'Unit Cost', 
                      type: 'currency', 
                      sortable: true 
                    },
                    { 
                      field: 'expiration_date', 
                      label: 'Expires', 
                      type: 'date', 
                      sortable: true,
                      render: (value) => {
                        if (!value) return 'N/A';
                        const expDate = new Date(value);
                        const today = new Date();
                        const daysUntil = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
                        
                        return (
                          <div>
                            <div className="small">{expDate.toLocaleDateString()}</div>
                            <Badge 
                              bg={daysUntil <= 30 ? 'danger' : daysUntil <= 60 ? 'warning' : 'success'}
                              style={{ fontSize: '0.6rem' }}
                            >
                              {daysUntil}d
                            </Badge>
                          </div>
                        );
                      }
                    }
                  ]}
                />
              </PharmaCard>
            )
          },
          {
            id: 'low-stock',
            label: 'Low Stock',
            icon: '⚠️',
            badge: { content: lowStockItems.length, variant: 'warning' },
            content: (
              <PharmaCard variant="warning">
                <InventoryDataGrid
                  data={lowStockItems}
                  emptyMessage="All items are properly stocked!"
                  emptyIcon="✅"
                  columns={[
                    { field: 'generic_name', label: 'Drug Name', sortable: true },
                    { field: 'brand_name', label: 'Brand', sortable: true },
                    { field: 'quantity_on_hand', label: 'Current', type: 'number', sortable: true },
                    { field: 'reorder_level', label: 'Reorder At', type: 'number', sortable: true },
                    { 
                      field: 'reorder_urgency', 
                      label: 'Urgency', 
                      render: (value, row) => {
                        const ratio = row.quantity_on_hand / row.reorder_level;
                        return (
                          <div>
                            <PharmaProgressBar
                              value={Math.min(ratio * 100, 100)}
                              size="sm"
                              showLabel={false}
                              type="inventory"
                            />
                            <Badge 
                              bg={ratio <= 0.2 ? 'danger' : ratio <= 0.5 ? 'warning' : 'primary'}
                              style={{ fontSize: '0.6rem' }}
                            >
                              {ratio <= 0.2 ? 'Critical' : ratio <= 0.5 ? 'Low' : 'Monitor'}
                            </Badge>
                          </div>
                        );
                      }
                    }
                  ]}
                  rowActions={[
                    {
                      icon: '🛒',
                      label: 'Reorder',
                      variant: 'warning',
                      onClick: (row) => console.log('Reorder', row)
                    }
                  ]}
                />
              </PharmaCard>
            )
          },
          {
            id: 'expiring',
            label: 'Expiring Soon',
            icon: '🚨',
            badge: { content: expiringItems.length, variant: 'danger' },
            content: (
              <PharmaCard variant="danger">
                <InventoryDataGrid
                  data={expiringItems}
                  emptyMessage="No items expiring soon"
                  emptyIcon="🗓️"
                  columns={[
                    { field: 'generic_name', label: 'Drug Name', sortable: true },
                    { field: 'quantity_on_hand', label: 'Stock', type: 'number', sortable: true },
                    { 
                      field: 'expiration_date', 
                      label: 'Expiration', 
                      sortable: true,
                      render: (value) => {
                        const expDate = new Date(value);
                        const daysUntil = Math.ceil((expDate - new Date()) / (1000 * 60 * 60 * 24));
                        
                        return (
                          <div>
                            <div>{expDate.toLocaleDateString()}</div>
                            <PharmaProgressBar
                              type="expiration"
                              value={(daysUntil / 30) * 100}
                              size="sm"
                              showLabel={false}
                              className="mt-1"
                            />
                            <Badge 
                              bg={daysUntil <= 7 ? 'danger' : daysUntil <= 14 ? 'warning' : 'info'}
                              style={{ fontSize: '0.6rem' }}
                            >
                              {daysUntil} days
                            </Badge>
                          </div>
                        );
                      }
                    }
                  ]}
                  rowActions={[
                    {
                      icon: '⚠️',
                      label: 'Expire',
                      variant: 'danger',
                      onClick: (row) => handleInventoryAction('expire', row)
                    }
                  ]}
                />
              </PharmaCard>
            )
          },
          {
            id: 'analytics',
            label: 'Analytics',
            icon: '📈',
            content: (
              <PharmaCard>
                <div className="text-center py-5">
                  <div style={{ fontSize: '4rem' }}>📊</div>
                  <h4>Advanced Analytics</h4>
                  <p className="text-muted">
                    Comprehensive inventory analytics and reporting tools.
                    This demonstrates how Phase 4 components can be extended
                    for complex analytical workflows.
                  </p>
                  <PharmaButton variant="primary">
                    Launch Analytics Suite
                  </PharmaButton>
                </div>
              </PharmaCard>
            )
          }
        ]}
        className="inventory-management-tabs"
      />
    );
  };

  // Render transaction modal using PharmaForm
  const renderTransactionModal = () => {
    if (!showTransactionModal || !selectedItem) return null;

    const getFormTitle = () => {
      switch (transactionType) {
        case 'prescription': return 'Fill Prescription';
        case 'return': return 'Return to Stock';
        case 'expire': return 'Expire Medication';
        case 'audit': return 'Audit Inventory';
        default: return 'Transaction';
      }
    };

    const getValidationRules = () => {
      const baseRules = {
        reason: { required: true, minLength: 5, maxLength: 500 }
      };

      switch (transactionType) {
        case 'prescription':
          return {
            ...baseRules,
            quantity: { required: true, min: 1, max: selectedItem.quantity_on_hand },
            prescription_number: { required: true, minLength: 3, maxLength: 50 }
          };
        case 'return':
          return {
            ...baseRules,
            quantity: { required: true, min: 1 },
            reference_number: { minLength: 3, maxLength: 50 }
          };
        case 'expire':
          return {
            ...baseRules,
            quantity: { required: true, min: 1, max: selectedItem.quantity_on_hand }
          };
        case 'audit':
          return {
            ...baseRules,
            actual_quantity: { required: true, min: 0 }
          };
        default:
          return baseRules;
      }
    };

    return (
      <PharmaForm
        title={getFormTitle()}
        subtitle={`${selectedItem.generic_name} (${selectedItem.brand_name || 'Generic'})`}
        onSubmit={handleTransactionSubmit}
        onCancel={() => setShowTransactionModal(false)}
        showCancelButton={true}
        submitText="Process Transaction"
        validationRules={getValidationRules()}
        validateOnChange={true}
        validateOnBlur={true}
        autoSave={false}
        loading={loading}
      >
        <div className="mb-3">
          <strong>Current Stock:</strong> {selectedItem.quantity_on_hand}
        </div>
        
        {transactionType === 'prescription' && (
          <>
            <input type="number" name="quantity" placeholder="Quantity to dispense" min="1" max={selectedItem.quantity_on_hand} />
            <input type="text" name="prescription_number" placeholder="Prescription Number" />
          </>
        )}
        
        {transactionType === 'return' && (
          <>
            <input type="number" name="quantity" placeholder="Quantity to return" min="1" />
            <input type="text" name="reference_number" placeholder="Reference Number (Optional)" />
          </>
        )}
        
        {transactionType === 'expire' && (
          <input type="number" name="quantity" placeholder="Quantity to expire" min="1" max={selectedItem.quantity_on_hand} />
        )}
        
        {transactionType === 'audit' && (
          <input type="number" name="actual_quantity" placeholder="Actual count found" min="0" defaultValue={selectedItem.quantity_on_hand} />
        )}
        
        <textarea name="reason" placeholder="Reason for transaction..." rows={3} />
      </PharmaForm>
    );
  };

  if (loading && !inventory.length) {
    return (
      <Container fluid>
        <PharmaCard loading={true} loadingRows={5}>
          Loading enhanced inventory management...
        </PharmaCard>
      </Container>
    );
  }

  return (
    <Container fluid>
      {error && (
        <PharmaAlert variant="danger" dismissible onClose={() => setError('')}>
          {error}
        </PharmaAlert>
      )}

      <div className="mb-4">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h2>Enhanced Inventory Management</h2>
            <p className="text-muted mb-0">
              Powered by Phase 4 Advanced Components • Store: {user?.store_name || 'System'}
            </p>
          </div>
          <div>
            <Badge bg="info" className="me-2">Phase 4 Demo</Badge>
            <PharmaButton 
              variant="primary" 
              icon="🔄"
              onClick={loadInventoryData}
              loading={loading}
            >
              Refresh Data
            </PharmaButton>
          </div>
        </div>
      </div>

      {renderInventoryHealth()}
      {renderInventoryTabs()}
      {renderTransactionModal()}
    </Container>
  );
};

export default InventoryEnhanced;