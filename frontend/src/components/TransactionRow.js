/**
 * Transaction Row Components
 * 
 * Reusable components for displaying transaction rows in different contexts:
 * - TransactionRegisterRow: Complex register-style row with running balance
 * - TransactionModalRow: Simple modal-style row for history dialogs
 * 
 * @author PharmaTraK Development Team
 * @version 1.0.0
 */

import React from 'react';
import { Badge } from 'react-bootstrap';

/**
 * Transaction row for the register/sidebar view
 * Shows detailed transaction information with running balance
 */
export const TransactionRegisterRow = ({ transaction, index }) => {
  return (
    <tr 
      key={`${transaction.id}-${index}`} 
      className={index % 2 === 0 ? 'transaction-row-even' : 'transaction-row-odd'}
      style={{borderBottom: '1px solid #dee2e6'}}
    >
      {/* Date & Time */}
      <td style={{fontSize: '0.8rem', color: '#6c757d', whiteSpace: 'nowrap'}}>
        <div>{new Date(transaction.transaction_date).toLocaleDateString()}</div>
        <div>{new Date(transaction.transaction_date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</div>
      </td>
      
      {/* Transaction Type Badge */}
      <td>
        <Badge 
          bg={
            transaction.transaction_type === 'prescription_fill' ? 'primary' :
            transaction.transaction_type === 'return_to_stock' ? 'danger' :
            transaction.transaction_type === 'expire' ? 'warning' :
            transaction.transaction_type === 'audit' ? 'info' :
            transaction.transaction_type === 'shipment_received' ? 'success' :
            transaction.transaction_type === 'initial_inventory' ? 'dark' :
            'secondary'
          }
          className="small"
          style={{fontSize: '0.7rem'}}
        >
          {transaction.transaction_type === 'prescription_fill' && '💊'}
          {transaction.transaction_type === 'return_to_stock' && '↩️'}
          {transaction.transaction_type === 'expire' && '⚠️'}
          {transaction.transaction_type === 'audit' && '🔍'}
          {transaction.transaction_type === 'shipment_received' && '📦'}
          {transaction.transaction_type === 'initial_inventory' && '📦'}
          {' '}
          {transaction.transaction_type.replace('_', ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
        </Badge>
      </td>
      
      {/* Performed By */}
      <td style={{fontSize: '0.8rem'}}>
        {transaction.performed_by_name || 'System'}
      </td>
      
      {/* Reason */}
      <td style={{fontSize: '0.8rem'}}>
        {transaction.reason || '-'}
      </td>
      
      {/* Reference Number */}
      <td style={{fontSize: '0.8rem'}}>
        {transaction.reference_number ? (
          <span style={{
            color: transaction.transaction_type === 'return_to_stock' ? '#dc3545' : 
                   transaction.transaction_type === 'shipment_received' ? '#198754' : '#6c757d',
            fontWeight: transaction.transaction_type === 'return_to_stock' || transaction.transaction_type === 'shipment_received' ? '600' : 'normal'
          }}>
            {transaction.transaction_type === 'return_to_stock' ? 'Rx# ' :
             transaction.transaction_type === 'shipment_received' ? 'Inv# ' : 
             'Ref# '}{transaction.reference_number}
          </span>
        ) : '-'}
      </td>
      
      {/* Quantity Change */}
      <td className="text-end" style={{fontWeight: '600'}}>
        <span className={transaction.quantity_change >= 0 ? 'text-success' : 'text-danger'}>
          {transaction.quantity_change >= 0 ? '+' : ''}{transaction.quantity_change}
        </span>
      </td>
      
      {/* Running Balance */}
      <td className="text-end" style={{fontWeight: '600'}}>
        {transaction.calculated_running_balance}
      </td>
    </tr>
  );
};

/**
 * Transaction row for the modal/popup view
 * Shows simplified transaction information for history dialogs
 */
export const TransactionModalRow = ({ transaction, index }) => {
  return (
    <tr 
      key={index}
      className={index % 2 === 0 ? 'transaction-row-even' : 'transaction-row-odd'}
    >
      {/* Date & Time */}
      <td className="small">
        {new Date(transaction.transaction_date).toLocaleDateString()}
        <div className="text-muted" style={{fontSize: '0.7rem'}}>
          {new Date(transaction.transaction_date).toLocaleTimeString()}
        </div>
      </td>
      
      {/* Transaction Type Badge */}
      <td>
        <Badge 
          bg={
            transaction.transaction_type === 'prescription_fill' ? 'primary' :
            transaction.transaction_type === 'return_to_stock' ? 'danger' :
            transaction.transaction_type === 'expire' ? 'warning' :
            transaction.transaction_type === 'audit' ? 'info' :
            transaction.transaction_type === 'shipment_received' ? 'success' :
            transaction.transaction_type === 'initial_inventory' ? 'dark' :
            'secondary'
          }
          className="small"
        >
          {transaction.transaction_type.replace('_', ' ').toUpperCase()}
        </Badge>
      </td>
      
      {/* Quantity Change */}
      <td>
        <span className={transaction.quantity_change >= 0 ? 'text-success' : 'text-danger'}>
          {transaction.quantity_change >= 0 ? '+' : ''}{transaction.quantity_change}
        </span>
      </td>
      
      {/* Running Total */}
      <td className="fw-bold">{transaction.quantity_after}</td>
      
      {/* Reason */}
      <td className="small">{transaction.reason || 'N/A'}</td>
      
      {/* User */}
      <td className="small">{transaction.performed_by_name || 'System'}</td>
    </tr>
  );
};