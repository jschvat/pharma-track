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
import { TransactionRegisterRow, TransactionModalRow } from './TransactionRow';
import DataTable from './common/DataTable';
import SearchFilterBar from './common/SearchFilterBar';
import CardHeader from './common/CardHeader';
import ActionButtonGroup from './common/ActionButtonGroup';
import FormField from './common/FormField';
import FormModal from './common/FormModal';
import '../css/components.css';

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
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' for oldest first, 'desc' for newest first
  const [availablePrescriptions, setAvailablePrescriptions] = useState([]); // Prescriptions that can be returned
  const [sortField, setSortField] = useState('transaction_date');
  const [sortDirection, setSortDirection] = useState('desc');
  const [columnFilters, setColumnFilters] = useState({
    transaction_type: '',
    performed_by_name: '',
    reason: '',
    reference_number: ''
  });

  useEffect(() => {
    loadInventory();
  }, [filters]);

  // Helper function to calculate running balance for transactions
  const calculateRunningBalance = (transactions) => {
    // Sort transactions by date and id to ensure proper chronological order
    const sortedTransactions = [...transactions].sort((a, b) => {
      const dateA = new Date(a.transaction_date);
      const dateB = new Date(b.transaction_date);
      if (dateA.getTime() === dateB.getTime()) {
        return a.id - b.id; // Use ID as tiebreaker for same timestamp
      }
      return dateA - dateB; // Oldest first for calculation
    });
    
    let runningBalance = 0;
    return sortedTransactions.map(transaction => {
      runningBalance += transaction.quantity_change;
      return {
        ...transaction,
        calculated_running_balance: runningBalance
      };
    });
  };

  // Helper function to filter, sort and display transactions
  const getSortedTransactions = (transactions) => {
    // First apply filters
    const filteredTransactions = getFilteredTransactions(transactions);
    // Then recalculate running balance for filtered results
    const withRunningBalance = calculateRunningBalance(filteredTransactions);
    
    // Sort for display based on sortField and sortDirection
    return withRunningBalance.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortField) {
        case 'transaction_date':
          aValue = new Date(a.transaction_date);
          bValue = new Date(b.transaction_date);
          break;
        case 'transaction_type':
          aValue = a.transaction_type;
          bValue = b.transaction_type;
          break;
        case 'performed_by_name':
          aValue = (a.performed_by_name || 'System').toLowerCase();
          bValue = (b.performed_by_name || 'System').toLowerCase();
          break;
        case 'quantity_change':
          aValue = parseInt(a.quantity_change);
          bValue = parseInt(b.quantity_change);
          break;
        case 'quantity_after':
          aValue = parseInt(a.calculated_running_balance || a.quantity_after);
          bValue = parseInt(b.calculated_running_balance || b.quantity_after);
          break;
        default:
          aValue = new Date(a.transaction_date);
          bValue = new Date(b.transaction_date);
      }
      
      if (sortDirection === 'asc') {
        if (aValue === bValue) {
          // Use transaction date as tiebreaker, then ID
          const dateA = new Date(a.transaction_date);
          const dateB = new Date(b.transaction_date);
          if (dateA.getTime() === dateB.getTime()) {
            return a.id - b.id;
          }
          return dateA - dateB;
        }
        return aValue > bValue ? 1 : -1;
      } else {
        if (aValue === bValue) {
          // Use transaction date as tiebreaker, then ID
          const dateA = new Date(a.transaction_date);
          const dateB = new Date(b.transaction_date);
          if (dateA.getTime() === dateB.getTime()) {
            return b.id - a.id;
          }
          return dateB - dateA;
        }
        return aValue < bValue ? 1 : -1;
      }
    });
  };

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

  // Helper function to get available prescriptions for return
  const getAvailablePrescriptions = (transactions) => {
    // Get all prescription fills with reference numbers
    const prescriptionFills = transactions.filter(t => 
      t.transaction_type === 'prescription_fill' && 
      t.reference_number && 
      t.quantity_change < 0
    );
    
    // Get all returns that reference prescription numbers
    const returns = transactions.filter(t => 
      t.transaction_type === 'return_to_stock' && 
      t.reference_number
    );
    
    // Calculate net quantities for each prescription (fills minus returns)
    const prescriptionMap = new Map();
    
    prescriptionFills.forEach(fill => {
      const rxNumber = fill.reference_number;
      const fillQuantity = Math.abs(fill.quantity_change);
      prescriptionMap.set(rxNumber, {
        prescription_number: rxNumber,
        fill_date: fill.transaction_date,
        filled_quantity: fillQuantity,
        returned_quantity: 0,
        available_for_return: fillQuantity
      });
    });
    
    returns.forEach(returnTx => {
      const rxNumber = returnTx.reference_number;
      if (prescriptionMap.has(rxNumber)) {
        const prescription = prescriptionMap.get(rxNumber);
        prescription.returned_quantity += returnTx.quantity_change;
        prescription.available_for_return = prescription.filled_quantity - prescription.returned_quantity;
      }
    });
    
    // Return only prescriptions that still have quantity available for return
    return Array.from(prescriptionMap.values()).filter(p => p.available_for_return > 0);
  };

  // Sorting functions for the transaction register table
  const handleSort = (field) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field) => {
    if (field !== sortField) {
      return '↕️';
    }
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  // Column filter functions
  const handleColumnFilterChange = (field, value) => {
    setColumnFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const clearAllFilters = () => {
    setColumnFilters({
      transaction_type: '',
      performed_by_name: '',
      reason: '',
      reference_number: ''
    });
  };

  const getFilteredTransactions = (transactions) => {
    return transactions.filter(transaction => {
      return (
        (!columnFilters.transaction_type || transaction.transaction_type === columnFilters.transaction_type) &&
        (!columnFilters.performed_by_name || (transaction.performed_by_name || 'System').toLowerCase().includes(columnFilters.performed_by_name.toLowerCase())) &&
        (!columnFilters.reason || (transaction.reason || '').toLowerCase().includes(columnFilters.reason.toLowerCase())) &&
        (!columnFilters.reference_number || (transaction.reference_number || '').includes(columnFilters.reference_number))
      );
    });
  };

  const getUniqueValues = (transactions, field) => {
    const values = new Set();
    transactions.forEach(transaction => {
      let value;
      switch (field) {
        case 'transaction_type':
          value = transaction.transaction_type;
          break;
        case 'performed_by_name':
          value = transaction.performed_by_name || 'System';
          break;
        default:
          return;
      }
      values.add(value);
    });
    return Array.from(values).sort();
  };


  const openTransactionModal = async (type, item) => {
    setModalType(type);
    setSelectedItem(item);
    setTransactionForm({
      quantity: '',
      reason: '',
      prescription_number: '',
      reference_number: '',
      actual_quantity: type === 'audit' ? item.quantity_on_hand : ''
    });
    
    // For return transactions, get available prescriptions
    if (type === 'return') {
      try {
        const response = await auditAPI.getInventoryHistory(item.id);
        const transactions = response.data.history || [];
        const availableRx = getAvailablePrescriptions(transactions);
        
        if (availableRx.length === 0) {
          alert('No filled prescriptions available for return. You can only return medications from prescriptions that were previously filled.');
          return;
        }
        
        setAvailablePrescriptions(availableRx);
      } catch (error) {
        console.error('Error loading prescription history:', error);
        alert('Could not load prescription history for returns.');
        return;
      }
    }
    
    setShowModal(true);
  };

  const handleTransaction = async () => {
    if (!selectedItem) return;

    // Validate required fields
    if (modalType === 'audit') {
      if (!transactionForm.reason || transactionForm.reason.trim() === '') {
        setError('Audit reason is required');
        return;
      }
      if (!transactionForm.actual_quantity || transactionForm.actual_quantity === '' || parseInt(transactionForm.actual_quantity) < 0) {
        setError('Valid actual quantity is required');
        return;
      }
    }

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
      
      // Only refresh transaction register if it's for the currently viewed drug
      if (selectedDrug && selectedDrug.id === selectedItem.id) {
        console.log('🔄 Refreshing transaction register for current drug:', selectedDrug.generic_name);
        loadTransactionHistory(selectedItem);
      }
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

  // Helper function to get inventory actions
  const getInventoryActions = (item) => [
    {
      type: 'custom',
      label: 'Fill Rx',
      variant: 'primary',
      disabled: item.quantity_on_hand <= 0,
      onClick: (e) => {
        e.stopPropagation();
        openTransactionModal('prescription', item);
      }
    },
    {
      type: 'custom',
      label: 'Return',
      variant: 'success',
      onClick: (e) => {
        e.stopPropagation();
        openTransactionModal('return', item);
      }
    },
    {
      type: 'custom',
      label: 'Expire',
      variant: 'warning',
      disabled: item.quantity_on_hand <= 0,
      onClick: (e) => {
        e.stopPropagation();
        openTransactionModal('expire', item);
      }
    },
    {
      type: 'custom',
      label: 'Audit',
      variant: 'secondary',
      onClick: (e) => {
        e.stopPropagation();
        openTransactionModal('audit', item);
      }
    }
  ];

  return (
    <>
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

      <SearchFilterBar
        searchPlaceholder="Search drugs..."
        searchValue={filters.search}
        onSearchChange={(value) => handleFilterChange('search', value)}
        filters={[
          {
            key: 'active',
            label: 'Active Only',
            type: 'switch',
            value: filters.active,
            onChange: (value) => handleFilterChange('active', value)
          },
          {
            key: 'low_stock',
            label: 'Low Stock',
            type: 'switch',
            value: filters.low_stock,
            onChange: (value) => handleFilterChange('low_stock', value)
          },
          {
            key: 'expiring',
            label: 'Expiring',
            type: 'switch',
            value: filters.expiring,
            onChange: (value) => handleFilterChange('expiring', value)
          }
        ]}
        additionalActions={
          <Button variant="primary" onClick={loadInventory} disabled={loading}>
            {loading ? <Spinner animation="border" size="sm" /> : 'Refresh'}
          </Button>
        }
      />

      <div className="content-area">
        {/* Main Content Layout - Side by Side */}
        <Row>
        {/* Inventory Table Column */}
        <Col lg={showHistorySidebar ? 6 : 12}>
          <Card className="inventory-card">
            <CardHeader
              title={`Inventory Items (${pagination.total || 0})`}
              subtitle="💡 Click on any row to view transaction history"
            />
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
                              <ActionButtonGroup
                                actions={getInventoryActions(item)}
                                size="sm"
                                className="d-flex gap-1 justify-content-center"
                              />
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
                  {Object.values(columnFilters).some(filter => filter !== '') && (
                    <Badge bg="info" className="d-flex align-items-center gap-1">
                      🔍 Filtered
                      <Button 
                        size="sm" 
                        variant="link" 
                        className="p-0 text-white ms-1"
                        onClick={clearAllFilters}
                        style={{fontSize: '0.8rem'}}
                      >
                        ✕
                      </Button>
                    </Badge>
                  )}
                  <div className="d-flex align-items-center gap-2">
                    <div className="btn-group register-sort-buttons" role="group">
                      <Button
                        variant={sortOrder === 'desc' ? 'primary' : 'outline-primary'}
                        size="sm"
                        onClick={() => setSortOrder('desc')}
                        title="Newest first"
                      >
                        📅↓
                      </Button>
                      <Button
                        variant={sortOrder === 'asc' ? 'primary' : 'outline-primary'}
                        size="sm"
                        onClick={() => setSortOrder('asc')}
                        title="Oldest first"
                      >
                        📅↑
                      </Button>
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
              </div>
              
              <div className="register-body">
                <div className="table-responsive h-100">
                  <Table hover size="sm" className="mb-0 register-table" style={{fontSize: '0.85rem'}}>
                    <thead className="bg-light sticky-top">
                      <tr style={{borderBottom: '1px solid #dee2e6'}}>
                        <th 
                          style={{cursor: 'pointer', minWidth: '110px'}} 
                          onClick={() => handleSort('transaction_date')}
                          className="user-select-none"
                        >
                          Date {getSortIcon('transaction_date')}
                        </th>
                        <th 
                          style={{cursor: 'pointer', minWidth: '140px'}} 
                          onClick={() => handleSort('transaction_type')}
                          className="user-select-none"
                        >
                          Type {getSortIcon('transaction_type')}
                        </th>
                        <th 
                          style={{cursor: 'pointer', minWidth: '80px'}} 
                          onClick={() => handleSort('performed_by_name')}
                          className="user-select-none"
                        >
                          User {getSortIcon('performed_by_name')}
                        </th>
                        <th style={{minWidth: '150px'}}>Reason</th>
                        <th style={{minWidth: '90px'}}>Reference</th>
                        <th 
                          style={{cursor: 'pointer', minWidth: '70px', textAlign: 'right'}} 
                          onClick={() => handleSort('quantity_change')}
                          className="user-select-none text-end"
                        >
                          Change {getSortIcon('quantity_change')}
                        </th>
                        <th 
                          style={{cursor: 'pointer', minWidth: '70px', textAlign: 'right'}} 
                          onClick={() => handleSort('quantity_after')}
                          className="user-select-none text-end"
                        >
                          Balance {getSortIcon('quantity_after')}
                        </th>
                      </tr>
                      <tr style={{borderBottom: '2px solid #dee2e6'}}>
                        <th style={{padding: '4px 8px'}}>
                          <Button 
                            size="sm" 
                            variant="link" 
                            className="p-0 text-muted"
                            onClick={clearAllFilters}
                            title="Clear all filters"
                          >
                            🗑️
                          </Button>
                        </th>
                        <th style={{padding: '4px 8px'}}>
                          <Form.Select
                            size="sm"
                            value={columnFilters.transaction_type}
                            onChange={(e) => handleColumnFilterChange('transaction_type', e.target.value)}
                            style={{fontSize: '0.75rem'}}
                          >
                            <option value="">All Types</option>
                            {getUniqueValues(transactionHistory, 'transaction_type').map(type => (
                              <option key={type} value={type}>
                                {type.replace('_', ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                              </option>
                            ))}
                          </Form.Select>
                        </th>
                        <th style={{padding: '4px 8px'}}>
                          <Form.Select
                            size="sm"
                            value={columnFilters.performed_by_name}
                            onChange={(e) => handleColumnFilterChange('performed_by_name', e.target.value)}
                            style={{fontSize: '0.75rem'}}
                          >
                            <option value="">All Users</option>
                            {getUniqueValues(transactionHistory, 'performed_by_name').map(user => (
                              <option key={user} value={user}>{user}</option>
                            ))}
                          </Form.Select>
                        </th>
                        <th style={{padding: '4px 8px'}}>
                          <Form.Control
                            size="sm"
                            type="text"
                            placeholder="Filter reason..."
                            value={columnFilters.reason}
                            onChange={(e) => handleColumnFilterChange('reason', e.target.value)}
                            style={{fontSize: '0.75rem'}}
                          />
                        </th>
                        <th style={{padding: '4px 8px'}}>
                          <Form.Control
                            size="sm"
                            type="text"
                            placeholder="Filter ref..."
                            value={columnFilters.reference_number}
                            onChange={(e) => handleColumnFilterChange('reference_number', e.target.value)}
                            style={{fontSize: '0.75rem'}}
                          />
                        </th>
                        <th></th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {historyLoading ? (
                        <tr>
                          <td colSpan="7" className="text-center py-4">
                            <Spinner animation="border" size="sm" variant="primary" />
                          </td>
                        </tr>
                      ) : transactionHistory.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="text-center text-muted py-4">
                            No transactions found
                          </td>
                        </tr>
                      ) : (
                        getSortedTransactions(transactionHistory).map((transaction, index) => (
                          <TransactionRegisterRow 
                            key={`${transaction.id}-${index}`}
                            transaction={transaction} 
                            index={index} 
                          />
                        ))
                      )}
                    </tbody>
                  </Table>
                </div>
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
                <>
                  <FormField
                    label="Actual Quantity"
                    name="actual_quantity"
                    type="number"
                    value={transactionForm.actual_quantity}
                    onChange={(e) => setTransactionForm({...transactionForm, actual_quantity: e.target.value})}
                    inputProps={{ min: 0 }}
                    required
                    helpText="Enter the actual counted quantity during physical inventory"
                  />
                  <FormField
                    label="Audit Reason"
                    name="reason"
                    value={transactionForm.reason}
                    onChange={(e) => setTransactionForm({...transactionForm, reason: e.target.value})}
                    placeholder="Physical inventory count, cycle count, etc."
                    required
                    helpText="Provide a reason for this inventory audit"
                  />
                </>
              ) : (
                <FormField
                  label="Quantity"
                  name="quantity"
                  type="number"
                  value={transactionForm.quantity}
                  onChange={(e) => setTransactionForm({...transactionForm, quantity: e.target.value})}
                  inputProps={{
                    min: 1,
                    max: modalType === 'prescription' || modalType === 'expire' ? selectedItem.quantity_on_hand : undefined
                  }}
                  required
                />
              )}

              {modalType === 'prescription' && (
                <FormField
                  label="Prescription Number"
                  name="prescription_number"
                  value={transactionForm.prescription_number}
                  onChange={(e) => setTransactionForm({...transactionForm, prescription_number: e.target.value})}
                  required
                />
              )}

              {modalType === 'return' && (
                <>
                  <FormField
                    label="Select Prescription to Return"
                    name="reference_number"
                    type="select"
                    value={transactionForm.reference_number}
                    onChange={(e) => {
                      const selectedRx = availablePrescriptions.find(rx => rx.prescription_number === e.target.value);
                      setTransactionForm({
                        ...transactionForm, 
                        reference_number: e.target.value,
                        quantity: selectedRx ? selectedRx.available_for_return.toString() : ''
                      });
                    }}
                    options={[
                      { value: '', label: 'Choose a prescription...' },
                      ...availablePrescriptions.map(rx => ({
                        value: rx.prescription_number,
                        label: `Rx# ${rx.prescription_number} - ${rx.available_for_return} units available (Filled: ${new Date(rx.fill_date).toLocaleDateString()})`
                      }))
                    ]}
                    required
                    helpText="Only prescriptions that were previously filled can be returned."
                  />
                  
                  {transactionForm.reference_number && (
                    <FormField
                      label="Return Quantity"
                      name="quantity"
                      type="number"
                      value={transactionForm.quantity}
                      onChange={(e) => setTransactionForm({...transactionForm, quantity: e.target.value})}
                      inputProps={{
                        min: 1,
                        max: availablePrescriptions.find(rx => rx.prescription_number === transactionForm.reference_number)?.available_for_return || 1
                      }}
                      required
                      helpText={`Maximum returnable: ${availablePrescriptions.find(rx => rx.prescription_number === transactionForm.reference_number)?.available_for_return || 0} units`}
                    />
                  )}
                </>
              )}

              <FormField
                label="Reason"
                name="reason"
                type="textarea"
                rows={3}
                value={transactionForm.reason}
                onChange={(e) => setTransactionForm({...transactionForm, reason: e.target.value})}
                required
              />
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
                        <TransactionModalRow 
                          key={index}
                          transaction={transaction} 
                          index={index} 
                        />
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