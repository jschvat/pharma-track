import React, { useState, useMemo } from 'react';
import { Table, Pagination, Badge, Button } from 'react-bootstrap';

/**
 * DataTable Component
 * 
 * A reusable data table component with sorting, pagination, and action buttons.
 * Handles common table patterns consistently across the application.
 * 
 * @param {Object} props - Component props
 * @param {Array} props.columns - Column definitions
 * @param {string} props.columns[].key - Column data key
 * @param {string} props.columns[].label - Column header label
 * @param {function} [props.columns[].render] - Custom render function for column
 * @param {boolean} [props.columns[].sortable=false] - Whether column is sortable
 * @param {string} [props.columns[].width] - Column width (CSS value)
 * @param {string} [props.columns[].className] - Column CSS classes
 * @param {Array} props.data - Table data array
 * @param {string} [props.keyField='id'] - Field to use as row key
 * @param {boolean} [props.striped=false] - Whether table has striped rows
 * @param {boolean} [props.hover=true] - Whether rows highlight on hover
 * @param {boolean} [props.responsive=true] - Whether table is responsive
 * @param {string} [props.size] - Table size ('sm', 'lg')
 * @param {string} [props.variant] - Table variant ('dark')
 * @param {string} [props.emptyMessage='No data available'] - Message when no data
 * @param {function} [props.onRowClick] - Row click handler
 * @param {boolean} [props.loading=false] - Whether table is loading
 * @param {React.ReactNode} [props.loadingContent] - Custom loading content
 * @param {Object} [props.pagination] - Pagination configuration
 * @param {number} [props.pagination.currentPage] - Current page number
 * @param {number} [props.pagination.totalPages] - Total number of pages
 * @param {function} [props.pagination.onPageChange] - Page change handler
 * @param {boolean} [props.pagination.showInfo=true] - Show pagination info
 * @param {Object} [props.sorting] - Sorting configuration
 * @param {string} [props.sorting.sortBy] - Current sort field
 * @param {string} [props.sorting.sortDirection='asc'] - Sort direction
 * @param {function} [props.sorting.onSort] - Sort change handler
 * @param {string} [props.className] - Additional CSS classes
 */
const DataTable = ({
  columns = [],
  data = [],
  keyField = 'id',
  striped = false,
  hover = true,
  responsive = true,
  size,
  variant,
  emptyMessage = 'No data available',
  onRowClick,
  loading = false,
  loadingContent,
  pagination,
  sorting,
  className = '',
  ...otherProps
}) => {
  const [localSortBy, setLocalSortBy] = useState(sorting?.sortBy || '');
  const [localSortDirection, setLocalSortDirection] = useState(sorting?.sortDirection || 'asc');

  // Use external sorting if provided, otherwise use local sorting
  const sortBy = sorting?.sortBy !== undefined ? sorting.sortBy : localSortBy;
  const sortDirection = sorting?.sortDirection !== undefined ? sorting.sortDirection : localSortDirection;
  const onSort = sorting?.onSort || handleLocalSort;

  function handleLocalSort(column) {
    if (!column.sortable) return;

    const newDirection = sortBy === column.key && sortDirection === 'asc' ? 'desc' : 'asc';
    setLocalSortBy(column.key);
    setLocalSortDirection(newDirection);
  }

  // Sort data locally if no external sort handler
  const sortedData = useMemo(() => {
    if (!sortBy || sorting?.onSort) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;
      
      let comparison = 0;
      if (typeof aValue === 'string') {
        comparison = aValue.localeCompare(bValue);
      } else if (typeof aValue === 'number') {
        comparison = aValue - bValue;
      } else {
        comparison = String(aValue).localeCompare(String(bValue));
      }
      
      return sortDirection === 'desc' ? -comparison : comparison;
    });
  }, [data, sortBy, sortDirection, sorting?.onSort]);

  const renderSortIcon = (column) => {
    if (!column.sortable) return null;
    
    if (sortBy !== column.key) {
      return <i className="fas fa-sort text-muted ms-1"></i>;
    }
    
    return sortDirection === 'asc' 
      ? <i className="fas fa-sort-up text-primary ms-1"></i>
      : <i className="fas fa-sort-down text-primary ms-1"></i>;
  };

  const renderCellContent = (column, row, rowIndex) => {
    if (column.render) {
      return column.render(row[column.key], row, rowIndex);
    }
    
    const value = row[column.key];
    
    // Handle null/undefined values
    if (value === null || value === undefined || value === '') {
      return <span className="text-muted">—</span>;
    }
    
    return value;
  };

  const renderEmptyState = () => (
    <tr>
      <td colSpan={columns.length} className="text-center py-4 text-muted">
        {loading ? (loadingContent || 'Loading...') : emptyMessage}
      </td>
    </tr>
  );

  const renderPagination = () => {
    if (!pagination || pagination.totalPages <= 1) return null;

    const { currentPage, totalPages, onPageChange, showInfo = true } = pagination;
    const startItem = ((currentPage - 1) * (data.length || 0)) + 1;
    const endItem = Math.min(currentPage * (data.length || 0), data.length || 0);

    return (
      <div className="d-flex justify-content-between align-items-center mt-3">
        {showInfo && (
          <small className="text-muted">
            Showing {startItem} to {endItem} of {data.length || 0} entries
          </small>
        )}
        
        <Pagination className="mb-0">
          <Pagination.Prev
            disabled={currentPage === 1}
            onClick={() => onPageChange(currentPage - 1)}
          />
          
          {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
            const pageNum = i + 1;
            return (
              <Pagination.Item
                key={pageNum}
                active={currentPage === pageNum}
                onClick={() => onPageChange(pageNum)}
              >
                {pageNum}
              </Pagination.Item>
            );
          })}
          
          {totalPages > 10 && currentPage < totalPages - 5 && (
            <>
              <Pagination.Ellipsis />
              <Pagination.Item onClick={() => onPageChange(totalPages)}>
                {totalPages}
              </Pagination.Item>
            </>
          )}
          
          <Pagination.Next
            disabled={currentPage === totalPages}
            onClick={() => onPageChange(currentPage + 1)}
          />
        </Pagination>
      </div>
    );
  };

  const tableProps = {
    striped,
    hover,
    size,
    variant,
    className: className,
    ...otherProps
  };

  const tableContent = (
    <Table {...tableProps}>
      <thead>
        <tr>
          {columns.map((column, index) => (
            <th
              key={column.key || index}
              style={column.width ? { width: column.width } : undefined}
              className={`${column.className || ''} ${column.sortable ? 'user-select-none cursor-pointer' : ''}`}
              onClick={() => onSort(column)}
            >
              {column.label}
              {renderSortIcon(column)}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {sortedData.length > 0 ? (
          sortedData.map((row, rowIndex) => (
            <tr
              key={row[keyField] || rowIndex}
              onClick={onRowClick ? () => onRowClick(row, rowIndex) : undefined}
              className={onRowClick ? 'cursor-pointer' : ''}
            >
              {columns.map((column, colIndex) => (
                <td
                  key={column.key || colIndex}
                  className={column.className || ''}
                >
                  {renderCellContent(column, row, rowIndex)}
                </td>
              ))}
            </tr>
          ))
        ) : (
          renderEmptyState()
        )}
      </tbody>
    </Table>
  );

  return (
    <div>
      {responsive ? (
        <div className="table-responsive">
          {tableContent}
        </div>
      ) : (
        tableContent
      )}
      
      {renderPagination()}
    </div>
  );
};

export default DataTable;