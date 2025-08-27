/**
 * PharmaDataGrid - Advanced Data Grid Component
 * 
 * A comprehensive data grid built specifically for pharmacy data management,
 * providing advanced filtering, sorting, pagination, and data manipulation
 * capabilities. Optimized for large datasets and complex pharmacy workflows.
 * 
 * Features:
 * - Advanced filtering with multiple operators
 * - Multi-column sorting
 * - Virtual scrolling for performance
 * - Column customization and resizing
 * - Row selection and bulk actions
 * - Export functionality (CSV, Excel, PDF)
 * - Real-time search and filtering
 * - Pharmacy-specific data types
 * - Accessibility and keyboard navigation
 * 
 * @component
 * @author PharmaTraK Development Team
 * @version 1.0.0
 */

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Form, InputGroup, Badge, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { PharmaButton, PharmaCard } from './PharmaComponents';
import PharmaDropdown from './PharmaDropdown';
import '../../css/pharma-components.css';


const PharmaDataGrid = ({
  // Core data props
  data = [],
  columns = [],
  keyField = 'id',
  
  // Filtering and search
  searchable = true,
  filterable = true,
  globalSearch = true,
  searchPlaceholder = 'Search...',
  filterOperators = ['equals', 'contains', 'starts_with', 'ends_with', 'greater_than', 'less_than', 'between', 'in', 'not_in'],
  
  // Sorting
  sortable = true,
  defaultSort = null, // { field: 'name', direction: 'asc' }
  multiSort = false,
  
  // Pagination
  paginated = true,
  pageSize = 25,
  pageSizeOptions = [10, 25, 50, 100, 200],
  
  // Selection
  selectable = false,
  multiSelect = true,
  selectedRows = [],
  onSelectionChange = null,
  
  // Actions
  bulkActions = [],
  rowActions = [],
  
  // Export
  exportable = false,
  exportFormats = ['csv', 'excel', 'pdf'],
  
  // Performance
  virtualScroll = false,
  rowHeight = 40,
  
  // Layout and appearance
  striped = true,
  bordered = false,
  hover = true,
  size = 'sm',
  responsive = true,
  resizable = true,
  fillContainer = true, // Make columns expand to fill container width
  
  // Column autofill
  showAutofillToggle = false, // Show button to toggle autofill columns
  defaultAutofill = true, // Default autofill state
  
  // Loading and empty states
  loading = false,
  loadingRows = 5,
  emptyMessage = 'No data available',
  emptyIcon = '📊',
  
  // Events
  onRowClick = null,
  onRowDoubleClick = null,
  onColumnResize = null,
  onFilter = null,
  onSort = null,
  onExport = null,
  
  // Styling
  className = '',
  tableClassName = '',
  headerClassName = '',
  rowClassName = '',
  
  // Accessibility
  'aria-label': ariaLabel = 'Data grid',
  
  ...otherProps
}) => {
  
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');
  const [columnFilters, setColumnFilters] = useState({});
  const [sortConfig, setSortConfig] = useState(defaultSort ? [defaultSort] : []);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentPageSize, setCurrentPageSize] = useState(pageSize);
  const [internalSelection, setInternalSelection] = useState(selectedRows);
  const [columnWidths, setColumnWidths] = useState({});
  const [isResizing, setIsResizing] = useState(false);
  const [resizingColumn, setResizingColumn] = useState(null);
  const [autofillColumns, setAutofillColumns] = useState(defaultAutofill);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);
  const startMouseXRef = useRef(0);
  const gridRef = useRef(null);
  const headerRef = useRef(null);
  const resizeHandleRefs = useRef({});
  const prevSelectedRowsRef = useRef(selectedRows);
  
  // Update selection when prop changes (prevents infinite loops)
  useEffect(() => {
    // Only update if selectedRows prop actually changed
    const currentSelection = JSON.stringify([...selectedRows].sort());
    const prevSelection = JSON.stringify([...prevSelectedRowsRef.current].sort());
    
    if (currentSelection !== prevSelection) {
      setInternalSelection(selectedRows);
      prevSelectedRowsRef.current = selectedRows;
    }
  }, [selectedRows]);
  
  // Filter operators with labels and functions
  const operators = useMemo(() => ({
    equals: {
      label: 'Equals',
      icon: '=',
      filter: (value, filterValue) => String(value).toLowerCase() === String(filterValue).toLowerCase()
    },
    contains: {
      label: 'Contains',
      icon: '⊃',
      filter: (value, filterValue) => String(value).toLowerCase().includes(String(filterValue).toLowerCase())
    },
    starts_with: {
      label: 'Starts with',
      icon: '⌐',
      filter: (value, filterValue) => String(value).toLowerCase().startsWith(String(filterValue).toLowerCase())
    },
    ends_with: {
      label: 'Ends with',
      icon: '⌙',
      filter: (value, filterValue) => String(value).toLowerCase().endsWith(String(filterValue).toLowerCase())
    },
    greater_than: {
      label: 'Greater than',
      icon: '>',
      filter: (value, filterValue) => parseFloat(value) > parseFloat(filterValue)
    },
    less_than: {
      label: 'Less than',
      icon: '<',
      filter: (value, filterValue) => parseFloat(value) < parseFloat(filterValue)
    },
    between: {
      label: 'Between',
      icon: '⟷',
      filter: (value, filterValue) => {
        const [min, max] = filterValue.split(',').map(v => parseFloat(v.trim()));
        const numValue = parseFloat(value);
        return numValue >= min && numValue <= max;
      }
    },
    in: {
      label: 'In list',
      icon: '∈',
      filter: (value, filterValue) => {
        const list = filterValue.split(',').map(v => v.trim().toLowerCase());
        return list.includes(String(value).toLowerCase());
      }
    },
    not_in: {
      label: 'Not in list',
      icon: '∉',
      filter: (value, filterValue) => {
        const list = filterValue.split(',').map(v => v.trim().toLowerCase());
        return !list.includes(String(value).toLowerCase());
      }
    }
  }), []);
  
  // Get column value
  const getColumnValue = useCallback((row, column) => {
    if (column.field) {
      return row[column.field];
    }
    if (column.render) {
      return column.render(row, row[keyField]);
    }
    return '';
  }, [keyField]);
  
  // Apply filters
  const filteredData = useMemo(() => {
    let filtered = [...data];
    
    // Global search
    if (globalSearch && globalSearchTerm) {
      filtered = filtered.filter(row => {
        return columns.some(column => {
          const value = getColumnValue(row, column);
          return String(value).toLowerCase().includes(globalSearchTerm.toLowerCase());
        });
      });
    }
    
    // Column filters
    Object.entries(columnFilters).forEach(([field, filter]) => {
      if (filter.value && filter.operator) {
        const operator = operators[filter.operator];
        if (operator) {
          filtered = filtered.filter(row => {
            const value = getColumnValue(row, columns.find(col => col.field === field));
            return operator.filter(value, filter.value);
          });
        }
      }
    });
    
    return filtered;
  }, [data, globalSearchTerm, columnFilters, columns, getColumnValue, operators, globalSearch]);
  
  // Apply sorting
  const sortedData = useMemo(() => {
    if (sortConfig.length === 0) return filteredData;
    
    return [...filteredData].sort((a, b) => {
      for (const sort of sortConfig) {
        const column = columns.find(col => col.field === sort.field);
        if (!column) continue;
        
        const aValue = getColumnValue(a, column);
        const bValue = getColumnValue(b, column);
        
        let comparison = 0;
        
        // Handle different data types
        if (column.type === 'number' || column.type === 'currency') {
          comparison = parseFloat(aValue || 0) - parseFloat(bValue || 0);
        } else if (column.type === 'date') {
          comparison = new Date(aValue || 0) - new Date(bValue || 0);
        } else {
          comparison = String(aValue || '').localeCompare(String(bValue || ''));
        }
        
        if (comparison !== 0) {
          return sort.direction === 'desc' ? -comparison : comparison;
        }
      }
      return 0;
    });
  }, [filteredData, sortConfig, columns, getColumnValue]);
  
  // Apply pagination
  const paginatedData = useMemo(() => {
    if (!paginated) return sortedData;
    
    const startIndex = (currentPage - 1) * currentPageSize;
    const endIndex = startIndex + currentPageSize;
    return sortedData.slice(startIndex, endIndex);
  }, [sortedData, paginated, currentPage, currentPageSize]);
  
  // Handle global search
  const handleGlobalSearch = useCallback((value) => {
    setGlobalSearchTerm(value);
    setCurrentPage(1);
  }, []);
  
  // Handle column filter
  const handleColumnFilter = useCallback((field, operator, value) => {
    setColumnFilters(prev => ({
      ...prev,
      [field]: { operator, value }
    }));
    setCurrentPage(1);
    
    if (onFilter) {
      onFilter(field, operator, value);
    }
  }, [onFilter]);
  
  // Handle sort
  const handleSort = useCallback((field) => {
    setSortConfig(prev => {
      const existing = prev.find(sort => sort.field === field);
      
      if (multiSort) {
        if (existing) {
          // Toggle direction or remove
          if (existing.direction === 'asc') {
            return prev.map(sort => 
              sort.field === field ? { ...sort, direction: 'desc' } : sort
            );
          } else {
            return prev.filter(sort => sort.field !== field);
          }
        } else {
          // Add new sort
          return [...prev, { field, direction: 'asc' }];
        }
      } else {
        // Single sort mode
        if (existing) {
          if (existing.direction === 'asc') {
            return [{ field, direction: 'desc' }];
          } else {
            return [];
          }
        } else {
          return [{ field, direction: 'asc' }];
        }
      }
    });
    
    if (onSort) {
      onSort(field);
    }
  }, [multiSort, onSort]);
  
  // Handle row selection
  const handleRowSelection = useCallback((rowId, selected) => {
    let newSelection;
    
    if (multiSelect) {
      if (selected) {
        newSelection = [...internalSelection, rowId];
      } else {
        newSelection = internalSelection.filter(id => id !== rowId);
      }
    } else {
      newSelection = selected ? [rowId] : [];
    }
    
    setInternalSelection(newSelection);
    
    if (onSelectionChange) {
      onSelectionChange(newSelection);
    }
  }, [internalSelection, multiSelect, onSelectionChange]);
  
  // Handle select all
  const handleSelectAll = useCallback((selected) => {
    const newSelection = selected ? paginatedData.map(row => row[keyField]) : [];
    setInternalSelection(newSelection);
    
    if (onSelectionChange) {
      onSelectionChange(newSelection);
    }
  }, [paginatedData, keyField, onSelectionChange]);
  
  // Handle column resize start for CSS Grid
  const handleResizeStart = useCallback((e, columnField) => {
    if (!resizable) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    // For CSS Grid, find the header div instead of th
    const headerElement = e.target.closest('.pharma-grid-header');
    if (!headerElement) return;
    
    const headerRect = headerElement.getBoundingClientRect();
    
    setIsResizing(true);
    setResizingColumn(columnField);
    
    // Store the column's left edge as reference point for width calculation
    startXRef.current = Math.round(headerRect.left);
    startMouseXRef.current = Math.round(e.clientX);
    startWidthRef.current = Math.round(headerRect.width);
    
    
    // Add resize cursor
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    
  }, [resizable]);

  // Calculate proportional widths when fillContainer is enabled
  const calculateFillWidths = useCallback((currentColumnWidths) => {
    if (!fillContainer || !headerRef.current) return {};
    
    // Get container width
    const containerWidth = headerRef.current.offsetWidth;
    
    // Account for selection and actions columns
    let fixedWidth = 0;
    if (selectable) fixedWidth += 50;
    if (rowActions.length > 0) fixedWidth += 120;
    
    // Calculate available width for content columns  
    const availableWidth = Math.max(400, containerWidth - fixedWidth - 20); // 20px buffer
    
    // Get current column widths - use parameter instead of state to avoid recursion
    const currentWidths = columns.map(column => {
      return parseInt((currentColumnWidths[column.field] || column.width || '150px').replace('px', ''), 10);
    });
    
    const totalCurrentWidth = currentWidths.reduce((sum, width) => sum + width, 0);
    
    // Calculate scaling factor to fill available width
    const scaleFactor = availableWidth / totalCurrentWidth;
    
    // Apply scaling to each column, maintaining minimum widths
    const newWidths = {};
    columns.forEach((column, index) => {
      const currentWidth = currentWidths[index];
      const scaledWidth = Math.max(50, Math.round(currentWidth * scaleFactor));
      newWidths[column.field] = `${scaledWidth}px`;
    });
    
    return newWidths;
  }, [fillContainer, columns, selectable, rowActions]);

  // Update column widths when fillContainer changes or data length changes
  useEffect(() => {
    if (fillContainer) {
      // Use a timeout to avoid immediate re-renders during state updates
      const timeoutId = setTimeout(() => {
        setColumnWidths(prevWidths => {
          const newWidths = calculateFillWidths(prevWidths);
          if (Object.keys(newWidths).length > 0) {
            return { ...prevWidths, ...newWidths };
          }
          return prevWidths;
        });
      }, 0);
      
      return () => clearTimeout(timeoutId);
    }
  }, [fillContainer, data.length]); // Remove calculateFillWidths from dependencies

  // Add resize observer to handle container resizing without recursion
  useEffect(() => {
    if (!fillContainer || !headerRef.current) return;
    
    let resizeTimeoutId;
    const handleResize = () => {
      // Debounce resize events to prevent excessive recalculations
      clearTimeout(resizeTimeoutId);
      resizeTimeoutId = setTimeout(() => {
        setColumnWidths(prevWidths => {
          const newWidths = calculateFillWidths(prevWidths);
          if (Object.keys(newWidths).length > 0) {
            return { ...prevWidths, ...newWidths };
          }
          return prevWidths;
        });
      }, 150);
    };

    // Use ResizeObserver if available, fallback to window resize
    if (window.ResizeObserver) {
      const resizeObserver = new ResizeObserver(handleResize);
      resizeObserver.observe(headerRef.current);
      
      return () => {
        clearTimeout(resizeTimeoutId);
        resizeObserver.disconnect();
      };
    } else {
      window.addEventListener('resize', handleResize);
      return () => {
        clearTimeout(resizeTimeoutId);
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [fillContainer]); // Remove calculateFillWidths from dependencies
  
  // Build CSS Grid columns string
  const buildGridColumns = useCallback(() => {
    const gridColumns = [];
    
    if (selectable) {
      gridColumns.push('50px'); // Selection column - always fixed
    }
    
    // Use autofill or explicit widths based on toggle state
    if (autofillColumns) {
      // Auto-fit columns to available space
      columns.forEach(column => {
        const minWidth = column.minWidth || '100px';
        const maxWidth = column.maxWidth || '1fr';
        gridColumns.push(`minmax(${minWidth}, ${maxWidth})`);
      });
    } else {
      // Use explicit pixel widths
      columns.forEach(column => {
        const width = columnWidths[column.field] || column.width || '150px';
        gridColumns.push(width);
      });
    }
    
    if (rowActions.length > 0) {
      gridColumns.push('120px'); // Actions column - always fixed
    }
    
    return gridColumns.join(' ');
  }, [columns, columnWidths, selectable, rowActions, autofillColumns]);

  // Handle column resize move with CSS Grid
  const handleResizeMove = useCallback((e) => {
    if (!isResizing || !resizingColumn) return;
    
    e.preventDefault();
    
    // Calculate new width based on cursor position
    const cursorX = Math.round(e.clientX);
    const columnLeft = startXRef.current;
    const newWidth = Math.max(50, cursorX - columnLeft);
    
    // Update column width state
    if (fillContainer) {
      // For fill container mode, store the desired pixel width
      // buildGridColumns will convert it to fr units
      setColumnWidths(prev => ({
        ...prev,
        [resizingColumn]: `${newWidth}px`
      }));
    } else {
      // For fixed width mode, use pixel values directly
      setColumnWidths(prev => ({
        ...prev,
        [resizingColumn]: `${newWidth}px`
      }));
    }
    
    
  }, [isResizing, resizingColumn, fillContainer]);
  
  // Handle column resize end
  const handleResizeEnd = useCallback((e) => {
    if (!isResizing) return;
    
    e?.preventDefault?.();
    
    const currentColumn = resizingColumn;
    const finalWidth = columnWidths[currentColumn];
    
    setIsResizing(false);
    setResizingColumn(null);
    startXRef.current = 0;
    startWidthRef.current = 0;
    startMouseXRef.current = 0;
    
    
    // Remove cursor styles
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    
    
    // Notify parent of column resize if callback provided
    if (onColumnResize && currentColumn) {
      onColumnResize(currentColumn, finalWidth);
    }
  }, [isResizing, resizingColumn, columnWidths, onColumnResize]);
  
  
  // Add mouse event listeners when resizing starts
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);
      
      return () => {
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeEnd);
      };
    }
  }, [isResizing, handleResizeMove, handleResizeEnd]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, []);
  
  // Render CSS Grid column header
  const renderGridColumnHeader = (column, index) => {
    const sortInfo = sortConfig.find(sort => sort.field === column.field);
    const isSortable = sortable && column.sortable !== false;
    const isFilterable = filterable && column.filterable !== false;
    const isResizableColumn = resizable && column.resizable !== false;
    const currentFilter = columnFilters[column.field];
    
    return (
      <div
        key={column.field || index}
        data-field={column.field}
        className={`pharma-grid-header pharma-grid-header-container ${isSortable ? 'sortable' : ''} ${isResizableColumn ? 'resizable' : ''} ${sortInfo ? 'sorted' : ''} ${headerClassName}`}
      >
        <div 
          className={`pharma-grid-header-label ${isSortable ? 'pharma-grid-header-label-sortable' : 'pharma-grid-header-label-default'} ${!isFilterable ? 'pharma-grid-header-label-no-margin' : ''}`}
          onClick={isSortable ? () => handleSort(column.field) : undefined}
        >
          {column.label}
          {isSortable && (
            <span className="pharma-grid-sort-indicator ms-1">
              {sortInfo ? (
                <>
                  {sortInfo.direction === 'asc' ? '↑' : '↓'}
                  {multiSort && sortConfig.length > 1 && (
                    <small className="ms-1 text-muted">
                      {sortConfig.findIndex(s => s.field === column.field) + 1}
                    </small>
                  )}
                </>
              ) : (
                '⇅'
              )}
            </span>
          )}
        </div>
        
        {isFilterable && (
          <div className="pharma-grid-filter pharma-grid-filter-container">
            <Form.Control
              size="sm"
              placeholder={`Filter ${column.label}`}
              value={currentFilter?.value || ''}
              onChange={(e) => {
                handleColumnFilter(column.field, 'contains', e.target.value);
              }}
            />
          </div>
        )}
        
        {/* Resize Handle */}
        {isResizableColumn && (
          <div
            ref={el => resizeHandleRefs.current[column.field] = el}
            className={`pharma-grid-resize-handle ${isResizing && resizingColumn === column.field ? 'active' : ''}`}
            onMouseDown={(e) => handleResizeStart(e, column.field)}
            title={`Resize ${column.label} column - drag to adjust width`}
            aria-label={`Resize ${column.label} column`}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                // Keyboard resize not yet implemented
              }
            }}
          />
        )}
      </div>
    );
  };

  
  // Render cell content
  const renderCellContent = (row, column) => {
    const value = getColumnValue(row, column);
    
    if (column.render) {
      return column.render(value, row, row[keyField]);
    }
    
    // Handle different data types
    switch (column.type) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(parseFloat(value || 0));
        
      case 'number':
        return parseFloat(value || 0).toLocaleString();
        
      case 'percentage':
        return `${parseFloat(value || 0).toFixed(1)}%`;
        
      case 'date':
        return value ? new Date(value).toLocaleDateString() : '';
        
      case 'datetime':
        return value ? new Date(value).toLocaleString() : '';
        
      case 'boolean':
        return (
          <Badge bg={value ? 'success' : 'secondary'}>
            {value ? '✓' : '✗'}
          </Badge>
        );
        
      case 'badge':
        const badgeVariant = column.badgeVariant || 'primary';
        return <Badge bg={badgeVariant}>{value}</Badge>;
        
      case 'ndc':
        return <code className="small">{value}</code>;
        
      default:
        return String(value || '');
    }
  };
  
  // Render pagination
  const renderPagination = () => {
    if (!paginated) return null;
    
    const totalPages = Math.ceil(sortedData.length / currentPageSize);
    const startRecord = (currentPage - 1) * currentPageSize + 1;
    const endRecord = Math.min(currentPage * currentPageSize, sortedData.length);
    
    return (
      <div className="pharma-grid-pagination d-flex justify-content-between align-items-center mt-3">
        <div className="pharma-grid-pagination-info">
          <small className="text-muted">
            Showing {startRecord} to {endRecord} of {sortedData.length} entries
            {data.length !== sortedData.length && ` (filtered from ${data.length})`}
          </small>
        </div>
        
        <div className="d-flex align-items-center gap-2">
          <Form.Select
            size="sm"
            value={currentPageSize}
            onChange={(e) => {
              setCurrentPageSize(parseInt(e.target.value));
              setCurrentPage(1);
            }}
            className="pharma-grid-auto-width"
          >
            {pageSizeOptions.map(size => (
              <option key={size} value={size}>{size} per page</option>
            ))}
          </Form.Select>
          
          <div className="pharma-grid-pagination-controls">
            <PharmaButton
              variant="outline-secondary"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(1)}
            >
              First
            </PharmaButton>
            
            <PharmaButton
              variant="outline-secondary"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
            >
              Previous
            </PharmaButton>
            
            <span className="mx-2 small text-muted">
              Page {currentPage} of {totalPages}
            </span>
            
            <PharmaButton
              variant="outline-secondary"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => prev + 1)}
            >
              Next
            </PharmaButton>
            
            <PharmaButton
              variant="outline-secondary"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(totalPages)}
            >
              Last
            </PharmaButton>
          </div>
        </div>
      </div>
    );
  };
  
  // Loading state
  if (loading) {
    return (
      <PharmaCard
        title="Loading Data..."
        subtitle="Please wait"
        loading={true}
        loadingRows={loadingRows}
        className={`pharma-data-grid ${className}`}
      />
    );
  }
  
  // Empty state
  if (data.length === 0) {
    return (
      <PharmaCard
        title="No Data Available"
        subtitle={emptyMessage}
        className={`pharma-data-grid ${className}`}
      >
        <div className="text-center py-4 text-muted">
          <div className="pharma-grid-empty-icon">{emptyIcon}</div>
          <div className="mt-2">{emptyMessage}</div>
        </div>
      </PharmaCard>
    );
  }
  
  const isAllSelected = internalSelection.length === paginatedData.length && paginatedData.length > 0;
  const isIndeterminate = internalSelection.length > 0 && internalSelection.length < paginatedData.length;
  
  return (
    <div 
      className={`pharma-data-grid ${isResizing ? 'resizing' : ''} ${className}`} 
      ref={gridRef} 
      className="pharma-grid-container"
      style={{ ...otherProps.style }}
      {...otherProps}
    >
      {/* Toolbar */}
      <div className="pharma-grid-toolbar mb-3">
        <div className="row align-items-center">
          <div className="col-md-6">
            {globalSearch && (
              <InputGroup>
                <InputGroup.Text>🔍</InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder={searchPlaceholder}
                  value={globalSearchTerm}
                  onChange={(e) => handleGlobalSearch(e.target.value)}
                />
                {globalSearchTerm && (
                  <PharmaButton
                    variant="outline-secondary"
                    onClick={() => handleGlobalSearch('')}
                  >
                    ×
                  </PharmaButton>
                )}
              </InputGroup>
            )}
          </div>
          
          <div className="col-md-6 text-end">
            {bulkActions.length > 0 && internalSelection.length > 0 && (
              <div className="me-2 d-inline-block">
                <PharmaDropdown
                  variant="primary"
                  size="sm"
                  trigger="click"
                  align="start"
                  pharmaType="pill"
                  label={`Bulk Actions (${internalSelection.length})`}
                >
                  {bulkActions.map((action, index) => (
                    <button
                      key={index}
                      className="dropdown-item"
                      onClick={() => action.onClick(internalSelection)}
                    >
                      {action.icon && <span className="me-1">{action.icon}</span>}
                      {action.label}
                    </button>
                  ))}
                </PharmaDropdown>
              </div>
            )}
            
            {exportable && (
              <PharmaDropdown
                variant="outline-secondary"
                size="sm"
                trigger="click"
                align="start"
                pharmaType="capsule"
                label="Export"
              >
                {exportFormats.map(format => (
                  <button
                    key={format}
                    className="dropdown-item"
                    onClick={() => {
                      if (onExport) {
                        onExport(format, sortedData);
                      }
                    }}
                  >
                    {format.toUpperCase()}
                  </button>
                ))}
              </PharmaDropdown>
            )}
            
            {showAutofillToggle && (
              <PharmaButton
                variant={autofillColumns ? "primary" : "outline-secondary"}
                size="sm"
                className="ms-2"
                onClick={() => setAutofillColumns(!autofillColumns)}
                title={autofillColumns ? "Disable column autofill" : "Enable column autofill"}
              >
                <i className={`fas ${autofillColumns ? 'fa-compress-alt' : 'fa-expand-alt'}`}></i>
                <span className="d-none d-md-inline ms-1">
                  {autofillColumns ? 'Fit Columns' : 'Fill Width'}
                </span>
              </PharmaButton>
            )}
          </div>
        </div>
      </div>
      
      {/* CSS Grid-based Data Table */}
      <div className={`pharma-grid-table-container ${responsive ? 'table-responsive' : ''}`}>
        <div
          className={`pharma-grid-table pharma-table-grid table ${striped ? 'table-striped' : ''} ${bordered ? 'table-bordered' : ''} ${hover ? 'table-hover' : ''} ${size ? `table-${size}` : ''} ${tableClassName}`}
          aria-label={ariaLabel}
          style={{
            '--grid-columns': buildGridColumns()
          }}
          ref={headerRef}
        >
          {/* Header Row */}
          <div className="pharma-grid-header-row">
            {selectable && (
              <div className="pharma-grid-header pharma-grid-select-header">
                <Form.Check
                  type="checkbox"
                  checked={isAllSelected}
                  ref={checkbox => {
                    if (checkbox) checkbox.indeterminate = isIndeterminate;
                  }}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  aria-label="Select all rows"
                />
              </div>
            )}
            
            {columns.map((column, index) => renderGridColumnHeader(column, index))}
            
            {rowActions.length > 0 && (
              <div className="pharma-grid-header pharma-grid-actions-header">Actions</div>
            )}
          </div>
          
          {/* Data Rows */}
          {paginatedData.map((row, rowIndex) => {
            const rowId = row[keyField];
            const isSelected = internalSelection.includes(rowId);
            
            return (
              <div
                key={rowId}
                className={`pharma-grid-body-row ${isSelected ? 'selected' : ''} ${onRowClick ? 'clickable' : ''} ${rowClassName}`}
                onClick={onRowClick ? () => onRowClick(row, rowIndex) : undefined}
                onDoubleClick={onRowDoubleClick ? () => onRowDoubleClick(row, rowIndex) : undefined}
              >
                {selectable && (
                  <div className="pharma-grid-cell pharma-grid-select-cell">
                    <Form.Check
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => handleRowSelection(rowId, e.target.checked)}
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`Select row ${rowIndex + 1}`}
                    />
                  </div>
                )}
                
                {columns.map((column, colIndex) => (
                  <div
                    key={column.field || colIndex}
                    className={`pharma-grid-cell ${column.cellClassName || ''}`}
                    style={column.cellStyle}
                  >
                    {renderCellContent(row, column)}
                  </div>
                ))}
                
                {rowActions.length > 0 && (
                  <div className="pharma-grid-cell pharma-grid-actions-cell">
                    <div className="pharma-grid-row-actions">
                      {rowActions.map((action, index) => (
                        <OverlayTrigger
                          key={index}
                          placement="top"
                          overlay={<Tooltip>{action.tooltip || action.label}</Tooltip>}
                        >
                          <PharmaButton
                            variant={action.variant || 'outline-primary'}
                            size="sm"
                            className="me-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              action.onClick(row, rowIndex);
                            }}
                            disabled={action.disabled && action.disabled(row)}
                          >
                            {action.icon || action.label}
                          </PharmaButton>
                        </OverlayTrigger>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      {renderPagination()}
    </div>
  );
};

// Pre-configured data grids for common pharmacy use cases
export const InventoryDataGrid = (props) => (
  <PharmaDataGrid
    searchable={true}
    filterable={true}
    sortable={true}
    paginated={true}
    exportable={true}
    selectable={true}
    columns={[
      { field: 'ndc', label: 'NDC', type: 'ndc', sortable: true },
      { field: 'generic_name', label: 'Drug Name', sortable: true },
      { field: 'brand_name', label: 'Brand', sortable: true },
      { field: 'strength', label: 'Strength', sortable: true },
      { field: 'dosage_form', label: 'Form', sortable: true },
      { field: 'quantity_on_hand', label: 'Stock', type: 'number', sortable: true },
      { field: 'unit_cost', label: 'Unit Cost', type: 'currency', sortable: true },
      { field: 'expiration_date', label: 'Expires', type: 'date', sortable: true }
    ]}
    {...props}
  />
);

export const UserDataGrid = (props) => (
  <PharmaDataGrid
    searchable={true}
    filterable={true}
    sortable={true}
    paginated={true}
    exportable={true}
    selectable={true}
    columns={[
      { field: 'name', label: 'Name', sortable: true },
      { field: 'email', label: 'Email', sortable: true },
      { field: 'role', label: 'Role', type: 'badge', sortable: true },
      { field: 'store_name', label: 'Store', sortable: true },
      { field: 'is_active', label: 'Status', type: 'boolean', sortable: true },
      { field: 'created_at', label: 'Created', type: 'date', sortable: true }
    ]}
    {...props}
  />
);

export const AuditDataGrid = (props) => (
  <PharmaDataGrid
    searchable={true}
    filterable={true}
    sortable={true}
    paginated={true}
    exportable={true}
    defaultSort={{ field: 'transaction_date', direction: 'desc' }}
    columns={[
      { field: 'transaction_date', label: 'Date', type: 'datetime', sortable: true },
      { field: 'transaction_type', label: 'Type', type: 'badge', sortable: true },
      { field: 'generic_name', label: 'Drug', sortable: true },
      { field: 'quantity_change', label: 'Change', type: 'number', sortable: true },
      { field: 'quantity_after', label: 'New Stock', type: 'number', sortable: true },
      { field: 'user_name', label: 'User', sortable: true },
      { field: 'reason', label: 'Reason', sortable: false }
    ]}
    {...props}
  />
);

export default PharmaDataGrid;