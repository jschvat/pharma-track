/**
 * Inventory Management Component
 * 
 * Comprehensive inventory management system for pharmacy operations.
 * Provides real-time inventory tracking, transaction management, and audit functionality
 * with dual-pane layout for inventory items and transaction history register.
 * 
 * Key Features:
 * - Real-time inventory display with filtering and search
 * - Transaction processing (prescriptions, returns, expirations, audits)
 * - Transaction history register with checkbook-style display
 * - Low stock and expiration alerts
 * - Responsive design with side-by-side layout on large screens
 * - Complete audit trail with user tracking
 * 
 * Technical Details:
 * - Uses React hooks for state management
 * - Integrates with backend inventory and audit APIs
 * - URL parameter management for persistent search state
 * - Custom CSS for scrollable containers and transaction styling
 * 
 * @component
 * @author PharmaTraK Development Team
 * @version 2.0.0
 */

import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Badge, Form, InputGroup, Spinner, Alert, Modal } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { inventoryAPI, auditAPI } from '../services/api';
import { useSearchParams } from 'react-router-dom';

/**
 * Inventory Component - Main inventory management interface
 * 
 * @returns {JSX.Element} The complete inventory management system
 */
const Inventory = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    active: searchParams.get('active') !== 'false',
    low_stock: searchParams.get('filter') === 'low_stock',
    expiring: searchParams.get('filter') === 'expiring'
  });

  // Transaction Modal
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [transactionForm, setTransactionForm] = useState({
    quantity: '',
    reason: '',
    prescription_number: '',
    reference_number: '',
    actual_quantity: ''
  });

  // Transaction History Modal & Sidebar
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showHistorySidebar, setShowHistorySidebar] = useState(false);
  const [transactionHistory, setTransactionHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedDrug, setSelectedDrug] = useState(null);

  useEffect(() => {
    loadInventory();
  }, [filters]);

  const loadInventory = async () => {
    if (!user.store_id) return;

    try {
      setLoading(true);
      setError('');

      const params = {
        page: 1,
        limit: 20,
        active: filters.active,
        search: filters.search || undefined,
        low_stock: filters.low_stock || undefined,
        expiring_days: filters.expiring ? 30 : undefined
      };

      // Remove undefined values
      Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

      const response = await inventoryAPI.getByStore(user.store_id, params);
      setInventory(response.data.inventory || []);
      setPagination(response.data.pagination || {});

    } catch (err) {
      console.error('Inventory loading error:', err);
      setError('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
    
    // Update URL params
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
  };

  const openTransactionModal = (type, item) => {
    setModalType(type);
    setSelectedItem(item);
    setTransactionForm({
      quantity: '',
      reason: '',
      prescription_number: '',
      reference_number: '',
      actual_quantity: type === 'audit' ? item.quantity_on_hand : ''
    });
    setShowModal(true);
  };

  const handleTransaction = async () => {
    if (!selectedItem) return;

    try {
      setLoading(true);
      let response;

      switch (modalType) {
        case 'prescription':
          response = await inventoryAPI.fillPrescription(selectedItem.id, {
            quantity: parseInt(transactionForm.quantity),
            prescription_number: transactionForm.prescription_number,
            reason: transactionForm.reason || 'Prescription fill'
          });
          break;
        case 'return':
          response = await inventoryAPI.returnToStock(selectedItem.id, {
            quantity: parseInt(transactionForm.quantity),
            reason: transactionForm.reason,
            reference_number: transactionForm.reference_number
          });
          break;
        case 'expire':
          response = await inventoryAPI.expire(selectedItem.id, {
            quantity: parseInt(transactionForm.quantity),
            reason: transactionForm.reason
          });
          break;
        case 'audit':
          response = await inventoryAPI.audit(selectedItem.id, {
            actual_quantity: parseInt(transactionForm.actual_quantity),
            reason: transactionForm.reason
          });
          break;
        default:
          return;
      }

      setShowModal(false);
      loadInventory(); // Reload inventory
    } catch (err) {
      setError(err.response?.data?.message || 'Transaction failed');
    } finally {
      setLoading(false);
    }
  };

  const loadTransactionHistory = async (item) => {
    try {
      setHistoryLoading(true);
      setSelectedDrug(item);
      
      // Show register next to the table
      setShowHistorySidebar(true);
      setShowHistoryModal(false);
      
      // Get transaction history for this inventory item
      const response = await auditAPI.getInventoryHistory(item.id);
      setTransactionHistory(response.data.history || []);
      
    } catch (err) {
      console.error('Failed to load transaction history:', err);
      setError('Failed to load transaction history');
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleRowClick = (item) => {
    loadTransactionHistory(item);
  };

  const getStockBadge = (item) => {
    if (item.quantity_on_hand <= 0) {
      return <Badge bg="danger">Out of Stock</Badge>;
    }
    if (item.quantity_on_hand <= item.reorder_level) {
      return <Badge bg="warning">Low Stock</Badge>;
    }
    return <Badge bg="success">In Stock</Badge>;
  };

  const getExpirationBadge = (expirationDate) => {
    if (!expirationDate) return null;

    const expDate = new Date(expirationDate);
    const today = new Date();
    const daysUntilExpiration = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiration < 0) {
      return <Badge bg="danger">Expired</Badge>;
    }
    if (daysUntilExpiration <= 30) {
      return <Badge bg="warning">Expires Soon</Badge>;
    }
    return null;
  };

  return (
    <>
      <style>{`
        .inventory-row:hover {
          background-color: #f8f9fa !important;
          transform: scale(1.005);
          transition: all 0.2s ease;
        }
        .inventory-row {
          transition: all 0.2s ease;
        }
        .inventory-sidebar-layout {
          position: relative;
        }
        .transaction-register {
          background: white;
          border: 1px solid #dee2e6;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          height: calc(100% - 100px);
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        .register-header {
          background: var(--granite-dark, #2c3e50);
          color: white;
          padding: 1rem;
          border-radius: 8px 8px 0 0;
        }
        .register-body {
          flex: 1;
          overflow-y: scroll !important;
          overflow-x: hidden;
          padding: 0;
          min-height: 400px;
          max-height: calc(100vh - 300px);
          height: calc(100vh - 300px);
          scrollbar-width: thin;
          scrollbar-color: #6c757d #f8f9fa;
        }
        .register-body::-webkit-scrollbar {
          width: 14px !important;
          display: block !important;
          background: #e9ecef;
        }
        .register-body::-webkit-scrollbar-track {
          background: #e9ecef !important;
          border-radius: 7px;
        }
        .register-body::-webkit-scrollbar-thumb {
          background: #6c757d !important;
          border-radius: 7px;
          border: 1px solid #e9ecef;
          min-height: 30px;
        }
        .register-body::-webkit-scrollbar-thumb:hover {
          background: #495057 !important;
        }
        .register-body::-webkit-scrollbar-corner {
          background: #e9ecef;
        }
        .register-entry {
          border-bottom: 1px solid #e9ecef;
          padding: 1rem;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
          line-height: 1.4;
          transition: background-color 0.2s ease;
        }
        .register-entry:hover {
          background-color: #f8f9fa;
        }
        .register-date {
          font-size: 0.75rem;
          color: #6c757d;
          font-weight: 500;
          margin-bottom: 0.5rem;
        }
        .register-transaction {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 0.5rem;
        }
        .register-description {
          flex: 1;
          margin-right: 1rem;
        }
        .register-transaction-type {
          font-weight: 600;
          font-size: 0.9rem;
          margin-bottom: 0.25rem;
        }
        .register-transaction-type.prescription_fill {
          color: #0d6efd;
        }
        .register-transaction-type.return_to_stock {
          color: #198754;
        }
        .register-transaction-type.expire {
          color: #fd7e14;
        }
        .register-transaction-type.audit {
          color: #6f42c1;
        }
        .register-transaction-type.initial_stock {
          color: #20c997;
        }
        .register-reference {
          font-size: 0.8rem;
          color: #6c757d;
          font-weight: 500;
        }
        .register-amount {
          font-weight: bold;
          min-width: 80px;
          text-align: right;
          font-size: 1rem;
        }
        .register-amount.positive {
          color: #198754;
          background-color: #d1e7dd;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
        }
        .register-amount.negative {
          color: #dc3545;
          background-color: #f8d7da;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
        }
        .register-balance {
          font-weight: bold;
          color: #495057;
          text-align: right;
          border-top: 2px solid #dee2e6;
          padding-top: 0.5rem;
          margin-top: 0.5rem;
          font-size: 1rem;
          background-color: #f8f9fa;
          padding: 0.5rem;
          border-radius: 4px;
        }
        .register-reason {
          font-size: 0.8rem;
          color: #495057;
          font-style: italic;
          margin-top: 0.25rem;
          line-height: 1.3;
        }
        .register-user {
          font-size: 0.75rem;
          color: #6c757d;
          margin-top: 0.25rem;
        }
        .inventory-main-content {
          transition: all 0.3s ease;
        }
        .inventory-card {
          height: calc(100% - 20px);
          display: flex;
          flex-direction: column;
        }
        .inventory-card .card-body {
          flex: 1;
          overflow: hidden;
          padding: 0;
          min-height: 0;
          display: flex;
          flex-direction: column;
        }
        .inventory-table-container {
          flex: 1;
          overflow-y: scroll !important;
          overflow-x: hidden;
          padding: 1rem;
          min-height: 400px;
          max-height: calc(100vh - 300px);
          height: calc(100vh - 300px);
          scrollbar-width: thin;
          scrollbar-color: #6c757d #f8f9fa;
        }
        .inventory-table-container::-webkit-scrollbar {
          width: 14px !important;
          display: block !important;
          background: #e9ecef;
        }
        .inventory-table-container::-webkit-scrollbar-track {
          background: #e9ecef !important;
          border-radius: 7px;
        }
        .inventory-table-container::-webkit-scrollbar-thumb {
          background: #6c757d !important;
          border-radius: 7px;
          border: 1px solid #e9ecef;
          min-height: 30px;
        }
        .inventory-table-container::-webkit-scrollbar-thumb:hover {
          background: #495057 !important;
        }
        .inventory-table-container::-webkit-scrollbar-corner {
          background: #e9ecef;
        }
        .table-responsive {
          min-height: calc(100vh - 350px);
        }
        .main-content-expanded {
          margin-left: -250px;
          padding-left: 250px;
          width: calc(100% + 250px);
        }
        .main-content-container {
          height: 80vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        .content-area {
          flex: 1;
          min-height: 0;
          overflow: hidden;
          padding-bottom: 20px;
        }
      `}</style>
      <div className="main-content-container">
        <Container fluid className={`${showHistorySidebar ? 'main-content-expanded' : ''}`}>

      {error && (
        <Row className="mb-4">
          <Col>
            <Alert variant="danger" dismissible onClose={() => setError('')}>
              {error}
            </Alert>
          </Col>
        </Row>
      )}

      {/* Filters */}
      <Card className="mb-4">
        <Card.Body>
          <Row>
            <Col md={4}>
              <InputGroup>
                <Form.Control
                  type="text"
                  placeholder="Search drugs..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                />
                <Button variant="outline-secondary" onClick={loadInventory}>
                  Search
                </Button>
              </InputGroup>
            </Col>
            <Col md={2}>
              <Form.Check
                type="switch"
                id="active-switch"
                label="Active Only"
                checked={filters.active}
                onChange={(e) => handleFilterChange('active', e.target.checked)}
              />
            </Col>
            <Col md={2}>
              <Form.Check
                type="switch"
                id="low-stock-switch"
                label="Low Stock"
                checked={filters.low_stock}
                onChange={(e) => handleFilterChange('low_stock', e.target.checked)}
              />
            </Col>
            <Col md={2}>
              <Form.Check
                type="switch"
                id="expiring-switch"
                label="Expiring"
                checked={filters.expiring}
                onChange={(e) => handleFilterChange('expiring', e.target.checked)}
              />
            </Col>
            <Col md={2}>
              <Button variant="primary" onClick={loadInventory} disabled={loading}>
                {loading ? <Spinner animation="border" size="sm" /> : 'Refresh'}
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <div className="content-area">
        {/* Main Content Layout - Side by Side */}
        <Row>
        {/* Inventory Table Column */}
        <Col lg={showHistorySidebar ? 6 : 12}>
          <Card className="inventory-card">
            <Card.Header>
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Inventory Items ({pagination.total || 0})</h5>
                <div className="text-muted small">
                  💡 Click on any row to view transaction history
                </div>
              </div>
            </Card.Header>
            <Card.Body>
              {loading ? (
                <div className="text-center py-4">
                  <Spinner animation="border" variant="primary" />
                </div>
              ) : (
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
                      </tr>
                    </thead>
                    <tbody>
                      {inventory.map((item) => (
                        <React.Fragment key={item.id}>
                          <tr 
                            style={{verticalAlign: 'middle', cursor: 'pointer'}}
                            onClick={() => handleRowClick(item)}
                            className="inventory-row">
                            <td>
                              <div>
                                <div className="fw-bold small">{item.generic_name}</div>
                                {item.brand_name && (
                                  <div className="text-muted" style={{fontSize: '0.75rem'}}>{item.brand_name}</div>
                                )}
                                <div className="text-muted" style={{fontSize: '0.7rem'}}>{item.dosage_form} {item.strength}</div>
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
                              <div className="d-flex flex-column gap-1">
                                {getStockBadge(item)}
                                {getExpirationBadge(item.expiration_date)}
                              </div>
                            </td>
                            <td className="small">{item.unit_cost ? `$${parseFloat(item.unit_cost).toFixed(2)}` : 'N/A'}</td>
                          </tr>
                          <tr>
                            <td colSpan="5" className="py-1 border-top-0" style={{backgroundColor: '#f8f9fa'}}>
                              <div className="d-flex gap-1 justify-content-center">
                                <Button
                                  size="sm"
                                  variant="primary"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openTransactionModal('prescription', item);
                                  }}
                                  disabled={item.quantity_on_hand <= 0}
                                  style={{fontSize: '0.75rem', padding: '0.25rem 0.5rem'}}
                                >
                                  Fill Rx
                                </Button>
                                <Button
                                  size="sm"
                                  variant="success"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openTransactionModal('return', item);
                                  }}
                                  style={{fontSize: '0.75rem', padding: '0.25rem 0.5rem'}}
                                >
                                  Return
                                </Button>
                                <Button
                                  size="sm"
                                  variant="warning"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openTransactionModal('expire', item);
                                  }}
                                  disabled={item.quantity_on_hand <= 0}
                                  style={{fontSize: '0.75rem', padding: '0.25rem 0.5rem'}}
                                >
                                  Expire
                                </Button>
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openTransactionModal('audit', item);
                                  }}
                                  style={{fontSize: '0.75rem', padding: '0.25rem 0.5rem'}}
                                >
                                  Audit
                                </Button>
                              </div>
                            </td>
                          </tr>
                        </React.Fragment>
                      ))}
                    </tbody>
                  </Table>

                    {inventory.length === 0 && (
                      <div className="text-center py-4 text-muted">
                        No inventory items found
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Transaction Register Column */}
        {showHistorySidebar && (
          <Col lg={6} className="d-flex flex-column">
            <Alert variant="info" className="mb-3 flex-shrink-0">
              📋 <strong>{selectedDrug?.generic_name}</strong>
              {selectedDrug?.brand_name && ` (${selectedDrug.brand_name})`}
            </Alert>
            <Card className="transaction-register flex-grow-1">
              <div className="register-header">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="mb-0">Transaction Register</h6>
                    <div className="small opacity-75">
                      {selectedDrug?.generic_name}
                      {selectedDrug?.brand_name && ` (${selectedDrug.brand_name})`}
                    </div>
                  </div>
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="text-white p-0"
                    onClick={() => setShowHistorySidebar(false)}
                  >
                    ✕
                  </Button>
                </div>
              </div>
              
              <div className="register-body">
                {historyLoading ? (
                  <div className="d-flex justify-content-center align-items-center py-4">
                    <Spinner animation="border" size="sm" variant="primary" />
                  </div>
                ) : transactionHistory.length === 0 ? (
                  <div className="register-entry text-center text-muted">
                    No transactions found
                  </div>
                ) : (
                  transactionHistory.map((transaction, index) => (
                    <div key={index} className="register-entry">
                      <div className="register-date">
                        📅 {new Date(transaction.transaction_date).toLocaleDateString()} at {new Date(transaction.transaction_date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      
                      <div className="register-transaction">
                        <div className="register-description">
                          <div className={`register-transaction-type ${transaction.transaction_type}`}>
                            {transaction.transaction_type === 'prescription_fill' && '💊 Prescription Fill'}
                            {transaction.transaction_type === 'return_to_stock' && '↩️ Return to Stock'}
                            {transaction.transaction_type === 'expire' && '⚠️ Expired'}
                            {transaction.transaction_type === 'audit' && '🔍 Audit'}
                            {transaction.transaction_type === 'initial_stock' && '📦 Initial Stock'}
                          </div>
                          {transaction.prescription_number && (
                            <div className="register-reference">Rx# {transaction.prescription_number}</div>
                          )}
                          {transaction.reference_number && (
                            <div className="register-reference">Ref# {transaction.reference_number}</div>
                          )}
                        </div>
                        
                        <div className={`register-amount ${transaction.quantity_change >= 0 ? 'positive' : 'negative'}`}>
                          {transaction.quantity_change >= 0 ? '+' : ''}{transaction.quantity_change}
                        </div>
                      </div>
                      
                      <div className="register-balance">
                        Running Balance: {transaction.quantity_after}
                      </div>
                      
                      {transaction.reason && (
                        <div className="register-reason">
                          💬 {transaction.reason}
                        </div>
                      )}
                      
                      {transaction.performed_by_name && (
                        <div className="register-user">
                          👤 {transaction.performed_by_name}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </Card>
          </Col>
        )}
      </Row>
      </div>

      {/* Transaction Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            {modalType === 'prescription' && 'Fill Prescription'}
            {modalType === 'return' && 'Return to Stock'}
            {modalType === 'expire' && 'Expire Medication'}
            {modalType === 'audit' && 'Audit Inventory'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedItem && (
            <div>
              <div className="mb-3">
                <strong>{selectedItem.generic_name}</strong>
                {selectedItem.brand_name && <div className="text-muted">{selectedItem.brand_name}</div>}
                <div className="small text-muted">Current Stock: {selectedItem.quantity_on_hand}</div>
              </div>

              {modalType === 'audit' ? (
                <Form.Group className="mb-3">
                  <Form.Label>Actual Quantity</Form.Label>
                  <Form.Control
                    type="number"
                    value={transactionForm.actual_quantity}
                    onChange={(e) => setTransactionForm({...transactionForm, actual_quantity: e.target.value})}
                    min="0"
                    required
                  />
                </Form.Group>
              ) : (
                <Form.Group className="mb-3">
                  <Form.Label>Quantity</Form.Label>
                  <Form.Control
                    type="number"
                    value={transactionForm.quantity}
                    onChange={(e) => setTransactionForm({...transactionForm, quantity: e.target.value})}
                    min="1"
                    max={modalType === 'prescription' || modalType === 'expire' ? selectedItem.quantity_on_hand : undefined}
                    required
                  />
                </Form.Group>
              )}

              {modalType === 'prescription' && (
                <Form.Group className="mb-3">
                  <Form.Label>Prescription Number</Form.Label>
                  <Form.Control
                    type="text"
                    value={transactionForm.prescription_number}
                    onChange={(e) => setTransactionForm({...transactionForm, prescription_number: e.target.value})}
                    required
                  />
                </Form.Group>
              )}

              {modalType === 'return' && (
                <Form.Group className="mb-3">
                  <Form.Label>Reference Number</Form.Label>
                  <Form.Control
                    type="text"
                    value={transactionForm.reference_number}
                    onChange={(e) => setTransactionForm({...transactionForm, reference_number: e.target.value})}
                  />
                </Form.Group>
              )}

              <Form.Group className="mb-3">
                <Form.Label>Reason</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={transactionForm.reason}
                  onChange={(e) => setTransactionForm({...transactionForm, reason: e.target.value})}
                  required
                />
              </Form.Group>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleTransaction}
            disabled={loading}
          >
            {loading ? <Spinner animation="border" size="sm" /> : 'Confirm'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Transaction History Modal */}
      <Modal show={showHistoryModal} onHide={() => setShowHistoryModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            Transaction History - {selectedDrug?.generic_name}
            {selectedDrug?.brand_name && ` (${selectedDrug.brand_name})`}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedDrug && (
            <div className="mb-3">
              <Row>
                <Col md={6}>
                  <div className="small text-muted">NDC: {selectedDrug.ndc}</div>
                  <div className="small text-muted">Dosage: {selectedDrug.dosage_form} {selectedDrug.strength}</div>
                  <div className="small text-muted">Manufacturer: {selectedDrug.manufacturer_name}</div>
                </Col>
                <Col md={6}>
                  <div className="small text-muted">Current Stock: <strong>{selectedDrug.quantity_on_hand}</strong></div>
                  <div className="small text-muted">Lot: {selectedDrug.lot_number || 'N/A'}</div>
                  <div className="small text-muted">Expires: {selectedDrug.expiration_date ? new Date(selectedDrug.expiration_date).toLocaleDateString() : 'N/A'}</div>
                </Col>
              </Row>
            </div>
          )}

          {historyLoading ? (
            <div className="text-center py-4">
              <Spinner animation="border" variant="primary" />
              <div className="mt-2">Loading transaction history...</div>
            </div>
          ) : (
            <div>
              {transactionHistory.length === 0 ? (
                <div className="text-center py-4 text-muted">
                  No transaction history found for this item.
                </div>
              ) : (
                <div className="table-responsive">
                  <Table striped hover size="sm">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Quantity</th>
                        <th>Running Total</th>
                        <th>Reason</th>
                        <th>User</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactionHistory.map((transaction, index) => (
                        <tr key={index}>
                          <td className="small">
                            {new Date(transaction.transaction_date).toLocaleDateString()}
                            <div className="text-muted" style={{fontSize: '0.7rem'}}>
                              {new Date(transaction.transaction_date).toLocaleTimeString()}
                            </div>
                          </td>
                          <td>
                            <Badge 
                              bg={
                                transaction.transaction_type === 'prescription_fill' ? 'primary' :
                                transaction.transaction_type === 'return_to_stock' ? 'success' :
                                transaction.transaction_type === 'expire' ? 'warning' :
                                transaction.transaction_type === 'audit' ? 'info' :
                                transaction.transaction_type === 'initial_stock' ? 'dark' :
                                'secondary'
                              }
                              className="small"
                            >
                              {transaction.transaction_type.replace('_', ' ').toUpperCase()}
                            </Badge>
                          </td>
                          <td>
                            <span className={transaction.quantity_change >= 0 ? 'text-success' : 'text-danger'}>
                              {transaction.quantity_change >= 0 ? '+' : ''}{transaction.quantity_change}
                            </span>
                          </td>
                          <td className="fw-bold">{transaction.quantity_after}</td>
                          <td className="small">{transaction.reason || 'N/A'}</td>
                          <td className="small">{transaction.performed_by_name || 'System'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowHistoryModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
        </Container>
      </div>
    </>
  );
};

export default Inventory;