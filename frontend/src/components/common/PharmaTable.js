/**
 * PharmaTable - Enhanced Table Component
 * 
 * A comprehensive table component that enhances the standard Bootstrap table
 * with advanced features like sorting, filtering, pagination, selection,
 * loading states, and consistent styling.
 * 
 * Features:
 * - Built-in sorting with visual indicators
 * - Row selection (single/multiple)
 * - Loading states with skeleton rows
 * - Responsive design with horizontal scroll
 * - Action buttons per row
 * - Empty state handling
 * - Pagination integration
 * - Export functionality
 * - Consistent styling and hover effects
 * 
 * @component
 * @author PharmaTraK Development Team
 * @version 1.0.0
 */

import React, { useState, useCallback, useMemo } from 'react';
import { Table, Pagination, Badge, Spinner } from 'react-bootstrap';
import PharmaButton from './PharmaButton';
import '../../css/pharma-components.css';

const PharmaTable = ({
  // Data
  data = [],
  columns = [], // Array of column definitions
  
  // Loading and empty states
  loading = false,
  loadingRows = 5,
  emptyMessage = 'No data available',
  emptyIcon = null,
  
  // Selection
  selectable = false,
  multiSelect = false,
  selectedRows = [],
  onSelectionChange = null,
  rowIdField = 'id',
  
  // Sorting
  sortable = true,
  defaultSort = null, // { field: 'name', direction: 'asc' }
  onSort = null,
  
  // Pagination
  pagination = false,
  currentPage = 1,
  totalPages = 1,
  pageSize = 10,
  totalItems = 0,
  onPageChange = null,
  showPageInfo = true,
  
  // Row actions
  actions = [], // Array of action definitions
  actionsPosition = 'end', // 'start', 'end'
  actionsWidth = '120px',
  
  // Styling and layout
  striped = true,
  hover = true,
  bordered = false,
  responsive = true,
  size = 'sm', // 'sm', 'md', 'lg'
  
  // Advanced features
  exportable = false,
  exportFormats = ['csv', 'json'],
  onExport = null,
  
  // Events
  onRowClick = null,
  onRowDoubleClick = null,
  
  // Styling
  className = '',
  tableClassName = '',
  
  // Accessibility
  'aria-label': ariaLabel = 'Data table',
  id,
  
  ...otherProps
}) => {
  
  const [sortConfig, setSortConfig] = useState(defaultSort || null);
  
  // Handle column sorting
  const handleSort = useCallback((field) => {
    if (!sortable) return;
    
    let direction = 'asc';
    if (sortConfig && sortConfig.field === field && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    
    const newSortConfig = { field, direction };
    setSortConfig(newSortConfig);
    
    if (onSort) {
      onSort(newSortConfig);
    }
  }, [sortable, sortConfig, onSort]);
  
  // Handle row selection
  const handleRowSelect = useCallback((rowId, isSelected) => {
    if (!selectable || !onSelectionChange) return;
    
    let newSelection;
    
    if (multiSelect) {
      if (isSelected) {
        newSelection = [...selectedRows, rowId];
      } else {
        newSelection = selectedRows.filter(id => id !== rowId);
      }
    } else {
      newSelection = isSelected ? [rowId] : [];
    }
    
    onSelectionChange(newSelection);
  }, [selectable, multiSelect, selectedRows, onSelectionChange]);
  
  // Handle select all
  const handleSelectAll = useCallback((isSelected) => {
    if (!selectable || !multiSelect || !onSelectionChange) return;
    
    const newSelection = isSelected ? data.map(row => row[rowIdField]) : [];
    onSelectionChange(newSelection);
  }, [selectable, multiSelect, data, rowIdField, onSelectionChange]);
  
  // Check if all rows are selected
  const isAllSelected = useMemo(() => {
    if (!selectable || !multiSelect || data.length === 0) return false;
    return data.every(row => selectedRows.includes(row[rowIdField]));
  }, [selectable, multiSelect, data, selectedRows, rowIdField]);
  
  // Check if some rows are selected (for indeterminate state)
  const isSomeSelected = useMemo(() => {
    return selectedRows.length > 0 && !isAllSelected;
  }, [selectedRows, isAllSelected]);
  
  // Render sort indicator
  const renderSortIndicator = (field) => {
    if (!sortable || !sortConfig || sortConfig.field !== field) {
      return <span className="pharma-table-sort-indicator">⇅</span>;
    }
    
    return (
      <span className="pharma-table-sort-indicator active">
        {sortConfig.direction === 'asc' ? '↑' : '↓'}
      </span>
    );
  };
  
  // Render table header
  const renderHeader = () => {
    return (
      <thead className="pharma-table-header">
        <tr>
          {/* Selection column */}
          {selectable && (
            <th className="pharma-table-select-column">
              {multiSelect && (
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  ref={input => {
                    if (input) input.indeterminate = isSomeSelected;
                  }}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  aria-label="Select all rows"
                />
              )}
            </th>
          )}
          
          {/* Actions column at start */}
          {actions.length > 0 && actionsPosition === 'start' && (
            <th 
              className="pharma-table-actions-column"
              style={{ width: actionsWidth }}
            >
              Actions
            </th>
          )}
          
          {/* Data columns */}
          {columns.map((column, index) => (
            <th
              key={column.field || index}
              className={`pharma-table-column ${column.className || ''}`}
              style={{ 
                width: column.width,
                textAlign: column.align || 'left',
                ...column.headerStyle 
              }}
              onClick={column.sortable !== false ? () => handleSort(column.field) : undefined}
            >
              <div className="pharma-table-header-content">
                <span>{column.label || column.header}</span>
                {column.sortable !== false && renderSortIndicator(column.field)}
              </div>
            </th>
          ))}
          
          {/* Actions column at end */}
          {actions.length > 0 && actionsPosition === 'end' && (
            <th 
              className="pharma-table-actions-column"
              style={{ width: actionsWidth }}
            >
              Actions
            </th>
          )}
        </tr>
      </thead>
    );
  };
  
  // Render loading skeleton
  const renderLoadingRows = () => {
    return Array.from({ length: loadingRows }, (_, index) => (
      <tr key={`loading-${index}`} className="pharma-table-loading-row">
        {selectable && <td><div className="pharma-table-skeleton skeleton-small" /></td>}
        {actions.length > 0 && actionsPosition === 'start' && (
          <td><div className="pharma-table-skeleton skeleton-small" /></td>
        )}
        {columns.map((_, colIndex) => (
          <td key={colIndex}>
            <div 
              className="pharma-table-skeleton" 
              style={{ width: `${Math.random() * 40 + 60}%` }} 
            />
          </td>
        ))}
        {actions.length > 0 && actionsPosition === 'end' && (
          <td><div className="pharma-table-skeleton skeleton-small" /></td>
        )}
      </tr>
    ));
  };
  
  // Render empty state
  const renderEmptyState = () => {
    const totalColumns = columns.length + 
      (selectable ? 1 : 0) + 
      (actions.length > 0 ? 1 : 0);
    
    return (
      <tr className="pharma-table-empty-row">
        <td colSpan={totalColumns} className="pharma-table-empty-cell">
          <div className="pharma-table-empty-state">
            {emptyIcon && <div className="pharma-table-empty-icon">{emptyIcon}</div>}
            <div className="pharma-table-empty-message">{emptyMessage}</div>
          </div>
        </td>
      </tr>
    );
  };
  
  // Render cell content based on column configuration
  const renderCellContent = (row, column) => {
    const value = column.field ? row[column.field] : null;
    
    // Custom render function
    if (column.render) {
      return column.render(value, row);
    }
    
    // Badge rendering
    if (column.type === 'badge') {
      const badgeProps = column.badgeProps ? column.badgeProps(value, row) : {};
      return <Badge {...badgeProps}>{value}</Badge>;
    }
    
    // Date formatting
    if (column.type === 'date') {
      if (!value) return '—';
      const date = new Date(value);
      return column.dateFormat ? 
        date.toLocaleDateString(undefined, column.dateFormat) :
        date.toLocaleDateString();
    }
    
    // Number formatting
    if (column.type === 'number') {
      if (value === null || value === undefined) return '—';
      return typeof value === 'number' ? value.toLocaleString() : value;
    }
    
    // Currency formatting
    if (column.type === 'currency') {
      if (value === null || value === undefined) return '—';
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: column.currency || 'USD'
      }).format(value);
    }
    
    // Default rendering
    return value !== null && value !== undefined ? value : '—';
  };
  
  // Render action buttons for a row
  const renderRowActions = (row, rowIndex) => {
    return (
      <div className="pharma-table-row-actions">
        {actions.map((action, index) => {
          const isDisabled = action.disabled ? action.disabled(row) : false;
          const isVisible = action.visible !== undefined ? action.visible(row) : true;
          
          if (!isVisible) return null;
          
          return (
            <PharmaButton
              key={index}
              size="xs"
              variant={action.variant || 'outline-secondary'}
              className={`me-1 ${action.className || ''}`}
              onClick={() => action.onClick(row, rowIndex)}
              disabled={isDisabled}
              title={action.tooltip}
              {...action.props}
            >
              {action.icon && <span className="me-1">{action.icon}</span>}
              {action.label}
            </PharmaButton>
          );
        })}
      </div>
    );
  };
  
  // Render data rows
  const renderDataRows = () => {
    if (loading) return renderLoadingRows();
    if (data.length === 0) return renderEmptyState();
    
    return data.map((row, rowIndex) => {
      const rowId = row[rowIdField];
      const isSelected = selectedRows.includes(rowId);
      
      return (
        <tr
          key={rowId || rowIndex}
          className={`pharma-table-row ${isSelected ? 'pharma-table-row-selected' : ''}`}
          onClick={onRowClick ? () => onRowClick(row, rowIndex) : undefined}
          onDoubleClick={onRowDoubleClick ? () => onRowDoubleClick(row, rowIndex) : undefined}
        >
          {/* Selection column */}
          {selectable && (
            <td className="pharma-table-select-cell">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={(e) => handleRowSelect(rowId, e.target.checked)}
                onClick={(e) => e.stopPropagation()}
                aria-label={`Select row ${rowIndex + 1}`}
              />
            </td>
          )}
          
          {/* Actions column at start */}
          {actions.length > 0 && actionsPosition === 'start' && (
            <td className="pharma-table-actions-cell" onClick={(e) => e.stopPropagation()}>
              {renderRowActions(row, rowIndex)}
            </td>
          )}
          
          {/* Data columns */}
          {columns.map((column, colIndex) => (
            <td
              key={column.field || colIndex}
              className={`pharma-table-cell ${column.cellClassName || ''}`}
              style={{ 
                textAlign: column.align || 'left',
                ...column.cellStyle 
              }}
            >
              {renderCellContent(row, column)}
            </td>
          ))}
          
          {/* Actions column at end */}
          {actions.length > 0 && actionsPosition === 'end' && (
            <td className="pharma-table-actions-cell" onClick={(e) => e.stopPropagation()}>
              {renderRowActions(row, rowIndex)}
            </td>
          )}
        </tr>
      );
    });
  };
  
  // Render pagination
  const renderPagination = () => {
    if (!pagination || totalPages <= 1) return null;
    
    const paginationItems = [];
    const maxPages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPages / 2));
    let endPage = Math.min(totalPages, startPage + maxPages - 1);
    
    if (endPage - startPage + 1 < maxPages) {
      startPage = Math.max(1, endPage - maxPages + 1);
    }
    
    // First page
    if (startPage > 1) {
      paginationItems.push(
        <Pagination.Item key={1} onClick={() => onPageChange(1)}>
          1
        </Pagination.Item>
      );
      if (startPage > 2) {
        paginationItems.push(<Pagination.Ellipsis key="start-ellipsis" />);
      }
    }
    
    // Page numbers
    for (let page = startPage; page <= endPage; page++) {
      paginationItems.push(
        <Pagination.Item
          key={page}
          active={page === currentPage}
          onClick={() => onPageChange(page)}
        >
          {page}
        </Pagination.Item>
      );
    }
    
    // Last page
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        paginationItems.push(<Pagination.Ellipsis key="end-ellipsis" />);
      }
      paginationItems.push(
        <Pagination.Item key={totalPages} onClick={() => onPageChange(totalPages)}>
          {totalPages}
        </Pagination.Item>
      );
    }
    
    return (
      <div className="pharma-table-pagination-container">
        {showPageInfo && (
          <div className="pharma-table-page-info">
            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalItems)} of {totalItems} entries
          </div>
        )}
        
        <Pagination className="pharma-table-pagination">
          <Pagination.Prev 
            disabled={currentPage === 1}
            onClick={() => onPageChange(currentPage - 1)}
          />
          {paginationItems}
          <Pagination.Next 
            disabled={currentPage === totalPages}
            onClick={() => onPageChange(currentPage + 1)}
          />
        </Pagination>
      </div>
    );
  };
  
  // Build CSS classes
  const containerClasses = [
    'pharma-table-container',
    `pharma-table-${size}`,
    loading && 'pharma-table-loading',
    className
  ].filter(Boolean).join(' ');
  
  const tableClasses = [
    'pharma-table',
    striped && 'table-striped',
    hover && 'table-hover',
    bordered && 'table-bordered',
    tableClassName
  ].filter(Boolean).join(' ');
  
  const wrapperElement = (
    <div className={containerClasses} id={id} {...otherProps}>
      <Table 
        className={tableClasses}
        responsive={responsive}
        size={size === 'lg' ? undefined : size}
        aria-label={ariaLabel}
      >
        {renderHeader()}
        <tbody className="pharma-table-body">
          {renderDataRows()}
        </tbody>
      </Table>
      
      {renderPagination()}
    </div>
  );
  
  return wrapperElement;
};

// Pre-configured table variants for common use cases
export const DataTable = (props) => (
  <PharmaTable 
    responsive={true}
    striped={true}
    hover={true}
    {...props} 
  />
);

export const SelectableTable = (props) => (
  <PharmaTable 
    selectable={true}
    multiSelect={true}
    responsive={true}
    hover={true}
    {...props} 
  />
);

export const ActionTable = (props) => (
  <PharmaTable 
    responsive={true}
    hover={true}
    actionsPosition="end"
    {...props} 
  />
);

export const CompactTable = (props) => (
  <PharmaTable 
    size="sm"
    striped={false}
    bordered={true}
    {...props} 
  />
);

export default PharmaTable;