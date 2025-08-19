/**
 * Inventory Management Component (Refactored)
 * 
 * Comprehensive inventory management system for pharmacy operations.
 * This is the refactored version that uses extracted components for better maintainability.
 * 
 * Key Features:
 * - Real-time inventory display with filtering and search
 * - Transaction processing (prescriptions, returns, expirations, audits)
 * - Transaction history register with checkbook-style display
 * - Low stock and expiration alerts
 * - Responsive design with side-by-side layout on large screens
 * - Complete audit trail with user tracking
 * 
 * Architecture:
 * - Main orchestrator component
 * - Extracted TransactionModal for transaction handling
 * - Extracted InventoryTable for inventory display
 * - Extracted TransactionHistorySidebar for history
 * 
 * @component
 * @author PharmaTraK Development Team
 * @version 3.0.0 (Refactored)
 */

import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Alert } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { inventoryAPI, auditAPI } from '../services/api';
import { useSearchParams } from 'react-router-dom';
import SearchFilterBar from './common/SearchFilterBar';
import { 
  TransactionModal, 
  InventoryTable, 
  TransactionHistorySidebar 
} from './inventory';
import '../css/components.css';

/**
 * Inventory Component - Main inventory management interface
 * 
 * @returns {JSX.Element} The complete inventory management system
 */
const Inventory = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Core inventory state
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({});
  
  // Filter state
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    active: searchParams.get('active') !== 'false',
    low_stock: searchParams.get('filter') === 'low_stock',
    expiring: searchParams.get('filter') === 'expiring'
  });

  // Transaction modal state
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
  const [validationErrors, setValidationErrors] = useState({});
  const [showValidationWarning, setShowValidationWarning] = useState(false);
  const [availablePrescriptions, setAvailablePrescriptions] = useState([]);

  // Transaction history state
  const [showHistorySidebar, setShowHistorySidebar] = useState(false);
  const [transactionHistory, setTransactionHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedDrug, setSelectedDrug] = useState(null);
  const [sortField, setSortField] = useState('transaction_date');
  const [sortDirection, setSortDirection] = useState('desc');
  const [columnFilters, setColumnFilters] = useState({
    transaction_type: '',
    performed_by_name: '',
    reason: '',
    reference_number: ''
  });

  // Load inventory data
  useEffect(() => {
    loadInventory();
  }, [filters]);

  // Update URL parameters when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.search) params.set('search', filters.search);
    if (!filters.active) params.set('active', 'false');
    if (filters.low_stock) params.set('filter', 'low_stock');
    if (filters.expiring) params.set('filter', 'expiring');
    
    setSearchParams(params);
  }, [filters, setSearchParams]);

  /**
   * Load inventory data from API
   */
  const loadInventory = async () => {
    try {
      setLoading(true);
      setError('');
      
      const params = {
        store_id: user.store_id,
        page: 1,
        limit: 50,
        ...filters
      };

      const response = await inventoryAPI.getInventory(params);
      
      if (response.success) {
        setInventory(response.data);
        setPagination(response.pagination || {});
      } else {
        throw new Error(response.error || 'Failed to load inventory');
      }
    } catch (error) {
      console.error('Error loading inventory:', error);
      setError(error.message || 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle filter changes
   */
  const handleFilterChange = (key, value) => {
    setFilters(prev => {
      const newFilters = { ...prev, [key]: value };
      
      // Reset conflicting filters
      if (key === 'low_stock' && value) {
        newFilters.expiring = false;
      } else if (key === 'expiring' && value) {
        newFilters.low_stock = false;
      }
      
      return newFilters;
    });
  };

  /**
   * Handle row click to show transaction history
   */
  const handleRowClick = (item) => {
    setSelectedDrug(item);
    setShowHistorySidebar(true);
    loadTransactionHistory(item.drug_id);
  };

  /**
   * Load transaction history for a drug
   */
  const loadTransactionHistory = async (drugId) => {
    try {
      setHistoryLoading(true);
      const response = await auditAPI.getDrugHistory({
        store_id: user.store_id,
        drug_id: drugId
      });
      
      if (response.success) {
        setTransactionHistory(response.data);
      } else {
        throw new Error(response.error || 'Failed to load transaction history');
      }
    } catch (error) {
      console.error('Error loading transaction history:', error);
      setError(error.message || 'Failed to load transaction history');
    } finally {
      setHistoryLoading(false);
    }
  };

  /**
   * Handle transaction initiation
   */
  const handleTransaction = (type, item) => {
    setModalType(type);
    setSelectedItem(item);
    setShowModal(true);
    setValidationErrors({});
    setShowValidationWarning(false);
    
    // Reset form
    setTransactionForm({
      quantity: '',
      reason: '',
      prescription_number: '',
      reference_number: '',
      actual_quantity: ''
    });

    // Load available prescriptions for returns
    if (type === 'return') {
      loadAvailablePrescriptions(item.drug_id);
    }
  };

  /**
   * Load available prescriptions for returns
   */
  const loadAvailablePrescriptions = async (drugId) => {
    try {
      const response = await inventoryAPI.getAvailablePrescriptions({
        store_id: user.store_id,
        drug_id: drugId
      });
      
      if (response.success) {
        setAvailablePrescriptions(response.data);
      }
    } catch (error) {
      console.error('Error loading prescriptions:', error);
      setAvailablePrescriptions([]);
    }
  };

  /**
   * Handle transaction submission
   */
  const handleTransactionSubmit = async () => {
    try {
      setLoading(true);
      setValidationErrors({});

      // Validate form based on transaction type
      const errors = validateTransactionForm();
      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        setShowValidationWarning(true);
        return;
      }

      // Prepare transaction data
      const transactionData = {
        inventory_id: selectedItem.id,
        store_id: user.store_id,
        drug_id: selectedItem.drug_id,
        ...transactionForm
      };

      // Submit transaction based on type
      let response;
      switch (modalType) {
        case 'prescription':
          response = await inventoryAPI.fillPrescription(transactionData);
          break;
        case 'return':
          response = await inventoryAPI.returnToStock(transactionData);
          break;
        case 'expire':
          response = await inventoryAPI.expireMedication(transactionData);
          break;
        case 'audit':
          response = await inventoryAPI.auditInventory(transactionData);
          break;
        default:
          throw new Error('Invalid transaction type');
      }

      if (response.success) {
        setShowModal(false);
        await loadInventory(); // Reload inventory
        
        // Reload history if sidebar is open
        if (showHistorySidebar && selectedDrug) {
          await loadTransactionHistory(selectedDrug.drug_id);
        }
      } else {
        throw new Error(response.error || 'Transaction failed');
      }
    } catch (error) {
      console.error('Transaction error:', error);
      setError(error.message || 'Transaction failed');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Validate transaction form
   */
  const validateTransactionForm = () => {
    const errors = {};

    switch (modalType) {
      case 'prescription':
        if (!transactionForm.quantity || parseInt(transactionForm.quantity) <= 0) {
          errors.quantity = 'Quantity must be greater than 0';
        } else if (parseInt(transactionForm.quantity) > selectedItem?.quantity_on_hand) {
          errors.quantity = 'Quantity exceeds available stock';
        }
        if (!transactionForm.prescription_number?.trim()) {
          errors.prescription_number = 'Prescription number is required';
        }
        if (!transactionForm.reason?.trim()) {
          errors.reason = 'Reason is required';
        }
        break;

      case 'return':
        if (!transactionForm.reference_number?.trim()) {
          errors.reference_number = 'Prescription selection is required';
        }
        if (!transactionForm.quantity || parseInt(transactionForm.quantity) <= 0) {
          errors.quantity = 'Return quantity must be greater than 0';
        }
        if (!transactionForm.reason?.trim()) {
          errors.reason = 'Return reason is required';
        }
        break;

      case 'expire':
        if (!transactionForm.quantity || parseInt(transactionForm.quantity) <= 0) {
          errors.quantity = 'Quantity must be greater than 0';
        } else if (parseInt(transactionForm.quantity) > selectedItem?.quantity_on_hand) {
          errors.quantity = 'Quantity exceeds available stock';
        }
        if (!transactionForm.reason?.trim()) {
          errors.reason = 'Expiration reason is required';
        }
        break;

      case 'audit':
        if (transactionForm.actual_quantity === '' || parseInt(transactionForm.actual_quantity) < 0) {
          errors.actual_quantity = 'Actual count must be 0 or greater';
        }
        if (!transactionForm.reason?.trim()) {
          errors.reason = 'Audit reason is required';
        }
        break;
    }

    return errors;
  };

  /**
   * Handle history sorting
   */
  const handleHistorySort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  /**
   * Handle column filter changes
   */
  const handleColumnFilterChange = (field, value) => {
    setColumnFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <>
      <div className="main-content-container">
        <Container fluid className={`${showHistorySidebar ? 'main-content-expanded' : ''}`}>
          
          {/* Error Alert */}
          {error && (
            <Row className="mb-4">
              <Col>
                <Alert variant="danger" dismissible onClose={() => setError('')}>
                  {error}
                </Alert>
              </Col>
            </Row>
          )}

          {/* Search and Filter Bar */}
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
              <button 
                className="btn btn-primary" 
                onClick={loadInventory} 
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Refresh'}
              </button>
            }
          />

          <div className="content-area">
            <Row>
              {/* Inventory Table Column */}
              <Col lg={showHistorySidebar ? 6 : 12}>
                <InventoryTable
                  inventory={inventory}
                  loading={loading}
                  pagination={pagination}
                  onRowClick={handleRowClick}
                  onTransaction={handleTransaction}
                  showHistorySidebar={showHistorySidebar}
                />
              </Col>

              {/* Transaction History Sidebar */}
              {showHistorySidebar && (
                <Col lg={6}>
                  <TransactionHistorySidebar
                    show={showHistorySidebar}
                    onHide={() => setShowHistorySidebar(false)}
                    selectedDrug={selectedDrug}
                    transactionHistory={transactionHistory}
                    historyLoading={historyLoading}
                    sortField={sortField}
                    sortDirection={sortDirection}
                    onSort={handleHistorySort}
                    columnFilters={columnFilters}
                    onColumnFilterChange={handleColumnFilterChange}
                  />
                </Col>
              )}
            </Row>
          </div>
        </Container>
      </div>

      {/* Transaction Modal */}
      <TransactionModal
        show={showModal}
        onHide={() => setShowModal(false)}
        modalType={modalType}
        selectedItem={selectedItem}
        transactionForm={transactionForm}
        setTransactionForm={setTransactionForm}
        validationErrors={validationErrors}
        setValidationErrors={setValidationErrors}
        loading={loading}
        onSubmit={handleTransactionSubmit}
        availablePrescriptions={availablePrescriptions}
        showValidationWarning={showValidationWarning}
      />
    </>
  );
};

export default Inventory;