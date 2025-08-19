/**
 * Transaction History Sidebar Component
 * 
 * Displays transaction history for a selected drug in a sidebar format
 * with filtering, sorting, and checkbook-style register display.
 * Extracted from Inventory.js to improve maintainability.
 * 
 * Features:
 * - Checkbook-style transaction register
 * - Column filtering and sorting
 * - Running balance calculations
 * - Date/time formatting
 * - Transaction type badges
 * 
 * @component
 * @author PharmaTraK Development Team
 * @version 1.0.0
 */

import React from 'react';
import { Card, Table, Spinner, Form, Button } from 'react-bootstrap';
import { TransactionRegisterRow } from '../TransactionRow';

/**
 * TransactionHistorySidebar Component - Displays transaction history
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.show - Whether sidebar is visible
 * @param {Function} props.onHide - Function to hide sidebar
 * @param {Object} props.selectedDrug - Selected drug for history display
 * @param {Array} props.transactionHistory - Array of transactions
 * @param {boolean} props.historyLoading - Loading state for history
 * @param {string} props.sortField - Current sort field
 * @param {string} props.sortDirection - Current sort direction
 * @param {Function} props.onSort - Function to handle sorting
 * @param {Object} props.columnFilters - Column filter values
 * @param {Function} props.onColumnFilterChange - Function to handle filter changes
 * @returns {JSX.Element} The transaction history sidebar component
 */
const TransactionHistorySidebar = ({
  show,
  onHide,
  selectedDrug,
  transactionHistory = [],
  historyLoading = false,
  sortField = 'transaction_date',
  sortDirection = 'desc',
  onSort,
  columnFilters = {},
  onColumnFilterChange
}) => {

  // Calculate running balance for transactions
  const calculateRunningBalance = (transactions) => {
    // Sort transactions by date and id to ensure proper chronological order
    const sortedTransactions = [...transactions].sort((a, b) => {
      const dateA = new Date(a.transaction_date);
      const dateB = new Date(b.transaction_date);
      if (dateA.getTime() === dateB.getTime()) {
        return a.id - b.id; // Use ID as tiebreaker for same timestamp
      }
      return dateA - dateB;
    });

    let runningBalance = 0;
    
    return sortedTransactions.map(transaction => {
      runningBalance += transaction.quantity_change;
      return {
        ...transaction,
        running_balance: Math.max(0, runningBalance) // Ensure balance never goes negative
      };
    });
  };

  // Get sorted and filtered transactions
  const getSortedTransactions = (transactions) => {
    let filtered = transactions;

    // Apply column filters
    if (columnFilters.transaction_type) {
      filtered = filtered.filter(t => 
        t.transaction_type.toLowerCase().includes(columnFilters.transaction_type.toLowerCase())
      );
    }
    if (columnFilters.performed_by_name) {
      filtered = filtered.filter(t => 
        t.performed_by_name?.toLowerCase().includes(columnFilters.performed_by_name.toLowerCase())
      );
    }
    if (columnFilters.reason) {
      filtered = filtered.filter(t => 
        t.reason?.toLowerCase().includes(columnFilters.reason.toLowerCase())
      );
    }
    if (columnFilters.reference_number) {
      filtered = filtered.filter(t => 
        t.reference_number?.toLowerCase().includes(columnFilters.reference_number.toLowerCase())
      );
    }

    // Calculate running balances first
    const withBalances = calculateRunningBalance(filtered);

    // Then sort based on current sort settings
    return withBalances.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      // Handle date sorting
      if (sortField === 'transaction_date') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      // Handle numeric sorting
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }

      // Handle string sorting
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      // Handle date sorting
      if (aValue instanceof Date && bValue instanceof Date) {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }

      return 0;
    });
  };

  // Transaction type options for filter dropdown
  const transactionTypes = [
    'initial_inventory',
    'shipment_received', 
    'prescription_fill',
    'return_to_stock',
    'expire',
    'audit'
  ];

  if (!show) return null;

  return (
    <Card className="transaction-history-sidebar h-100">
      <Card.Header className="d-flex justify-content-between align-items-center">
        <div>
          <h6 className="mb-0">Transaction History</h6>
          {selectedDrug && (
            <small className="text-muted">
              {selectedDrug.generic_name}
              {selectedDrug.brand_name && ` (${selectedDrug.brand_name})`}
            </small>
          )}
        </div>
        <Button 
          variant="outline-secondary" 
          size="sm" 
          onClick={onHide}
          title="Close transaction history"
        >
          ✕
        </Button>
      </Card.Header>
      
      <Card.Body className="p-0">
        <div className="transaction-register-container" style={{height: 'calc(100vh - 200px)', overflow: 'auto'}}>
          <Table size="sm" className="mb-0 transaction-register-table">
            <thead className="sticky-top bg-light">
              <tr>
                <th 
                  style={{cursor: 'pointer', padding: '8px'}} 
                  onClick={() => onSort('transaction_date')}
                  title="Click to sort by date"
                >
                  Date {sortField === 'transaction_date' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  style={{cursor: 'pointer', padding: '8px'}} 
                  onClick={() => onSort('transaction_type')}
                  title="Click to sort by type"
                >
                  Type {sortField === 'transaction_type' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  style={{cursor: 'pointer', padding: '8px'}} 
                  onClick={() => onSort('performed_by_name')}
                  title="Click to sort by user"
                >
                  User {sortField === 'performed_by_name' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th style={{padding: '8px'}}>Reason</th>
                <th style={{padding: '8px'}}>Ref#</th>
                <th 
                  style={{cursor: 'pointer', padding: '8px'}} 
                  onClick={() => onSort('quantity_change')}
                  title="Click to sort by change"
                >
                  Change {sortField === 'quantity_change' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  style={{cursor: 'pointer', padding: '8px'}} 
                  onClick={() => onSort('running_balance')}
                  title="Click to sort by balance"
                >
                  Balance {sortField === 'running_balance' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
              </tr>
              
              {/* Filter Row */}
              <tr className="bg-light">
                <th style={{padding: '4px 8px'}}>
                  <small className="text-muted">Filter:</small>
                </th>
                <th style={{padding: '4px 8px'}}>
                  <Form.Select
                    size="sm"
                    value={columnFilters.transaction_type || ''}
                    onChange={(e) => onColumnFilterChange('transaction_type', e.target.value)}
                    style={{fontSize: '0.75rem'}}
                  >
                    <option value="">All types</option>
                    {transactionTypes.map(type => (
                      <option key={type} value={type}>
                        {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </option>
                    ))}
                  </Form.Select>
                </th>
                <th style={{padding: '4px 8px'}}>
                  <Form.Control
                    size="sm"
                    type="text"
                    placeholder="Filter user..."
                    value={columnFilters.performed_by_name || ''}
                    onChange={(e) => onColumnFilterChange('performed_by_name', e.target.value)}
                    style={{fontSize: '0.75rem'}}
                  />
                </th>
                <th style={{padding: '4px 8px'}}>
                  <Form.Control
                    size="sm"
                    type="text"
                    placeholder="Filter reason..."
                    value={columnFilters.reason || ''}
                    onChange={(e) => onColumnFilterChange('reason', e.target.value)}
                    style={{fontSize: '0.75rem'}}
                  />
                </th>
                <th style={{padding: '4px 8px'}}>
                  <Form.Control
                    size="sm"
                    type="text"
                    placeholder="Filter ref..."
                    value={columnFilters.reference_number || ''}
                    onChange={(e) => onColumnFilterChange('reference_number', e.target.value)}
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
      </Card.Body>
    </Card>
  );
};

export default TransactionHistorySidebar;