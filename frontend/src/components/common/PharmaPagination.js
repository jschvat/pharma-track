/**
 * PharmaPagination - Pharmacy-Themed Pagination Component
 * 
 * Enhanced Bootstrap Pagination with pharmacy-specific styling and features.
 * Provides pill/capsule/tablet themed pagination controls optimized for
 * medical data browsing with large datasets.
 * 
 * Features:
 * - Pharmacy-themed visual styles (pill, capsule, tablet)
 * - Smart pagination for large datasets
 * - Jump-to-page functionality
 * - Items per page selection
 * - Accessibility compliant navigation
 * - Mobile-responsive design
 * 
 * @component
 * @author PharmaTraK Development Team
 * @version 1.0.0
 */

import React, { useState } from 'react';
import { Pagination, Form, ButtonGroup } from 'react-bootstrap';
import PharmaDropdown from './PharmaDropdown';
import { PharmaBadge } from './PharmaComponents';
import '../../css/pharma-components.css';

const PharmaPagination = ({
  // Pagination data
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  itemsPerPage = 20,
  
  // Visual theming
  pharmaTheme = 'pill', // 'pill', 'capsule', 'tablet'
  size = 'md', // 'sm', 'md', 'lg'
  
  // Functionality
  showInfo = true,
  showJumpTo = true,
  showItemsPerPage = true,
  itemsPerPageOptions = [10, 20, 50, 100, 200],
  maxVisiblePages = 7,
  
  // Events
  onPageChange = null,
  onItemsPerPageChange = null,
  
  // Labels
  itemLabel = 'items',
  jumpToLabel = 'Go to page',
  itemsPerPageLabel = 'Items per page',
  
  // Styling
  className = '',
  alignment = 'center', // 'start', 'center', 'end'
  
  // Loading state
  loading = false,
  
  ...otherProps
}) => {
  
  const [jumpToPage, setJumpToPage] = useState('');
  
  // Build CSS classes
  const paginationClasses = [
    'pharma-pagination',
    `pharma-pagination-${pharmaTheme}`,
    size !== 'md' ? `pharma-pagination-${size}` : '',
    `justify-content-${alignment}`,
    className
  ].filter(Boolean).join(' ');
  
  // Calculate pagination info
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);
  
  // Handle page change
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages && onPageChange) {
      onPageChange(page);
    }
  };
  
  // Handle jump to page
  const handleJumpTo = (e) => {
    e.preventDefault();
    const page = parseInt(jumpToPage);
    if (page >= 1 && page <= totalPages) {
      handlePageChange(page);
      setJumpToPage('');
    }
  };
  
  // Handle items per page change
  const handleItemsPerPageChange = (newItemsPerPage) => {
    if (onItemsPerPageChange) {
      onItemsPerPageChange(newItemsPerPage);
    }
  };
  
  // Generate visible page numbers
  const getVisiblePages = () => {
    const pages = [];
    const halfVisible = Math.floor(maxVisiblePages / 2);
    
    let startPage = Math.max(1, currentPage - halfVisible);
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    // Adjust start page if we're near the end
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  };
  
  // Render pagination info
  const renderInfo = () => {
    if (!showInfo || totalItems === 0) return null;
    
    return (
      <div className="pharma-pagination-info d-flex align-items-center">
        <span className="text-muted me-3">
          Showing {startItem.toLocaleString()} to {endItem.toLocaleString()} of{' '}
          <PharmaBadge variant="primary" pharmaType={pharmaTheme} size="sm">
            {totalItems.toLocaleString()}
          </PharmaBadge>{' '}
          {itemLabel}
        </span>
      </div>
    );
  };
  
  // Render jump to page
  const renderJumpTo = () => {
    if (!showJumpTo || totalPages <= maxVisiblePages) return null;
    
    return (
      <Form onSubmit={handleJumpTo} className="pharma-jump-to d-flex align-items-center me-3">
        <Form.Label className="me-2 mb-0 text-muted">{jumpToLabel}:</Form.Label>
        <Form.Control
          type="number"
          size="sm"
          min="1"
          max={totalPages}
          value={jumpToPage}
          onChange={(e) => setJumpToPage(e.target.value)}
          className="pharma-jump-input"
          style={{ width: '70px' }}
          placeholder={currentPage.toString()}
        />
      </Form>
    );
  };
  
  // Render items per page selector
  const renderItemsPerPage = () => {
    if (!showItemsPerPage) return null;
    
    return (
      <div className="pharma-items-per-page d-flex align-items-center">
        <span className="text-muted me-2">{itemsPerPageLabel}:</span>
        <PharmaDropdown
          variant="outline-secondary"
          size="sm"
          className="pharma-items-dropdown"
          trigger="click"
          pharmaType="pill"
          label={itemsPerPage}
        >
          {itemsPerPageOptions.map(option => (
            <button
              key={option}
              className={`dropdown-item ${option === itemsPerPage ? 'active' : ''}`}
              onClick={() => handleItemsPerPageChange(option)}
            >
              {option} {itemLabel}
            </button>
          ))}
        </PharmaDropdown>
      </div>
    );
  };
  
  // Render pagination controls
  const renderPagination = () => {
    if (totalPages <= 1) return null;
    
    const visiblePages = getVisiblePages();
    
    return (
      <Pagination className={paginationClasses} {...otherProps}>
        {/* First page */}
        <Pagination.First 
          disabled={currentPage === 1 || loading}
          onClick={() => handlePageChange(1)}
          className="pharma-page-first"
        />
        
        {/* Previous page */}
        <Pagination.Prev 
          disabled={currentPage === 1 || loading}
          onClick={() => handlePageChange(currentPage - 1)}
          className="pharma-page-prev"
        />
        
        {/* Ellipsis before visible pages */}
        {visiblePages[0] > 1 && (
          <>
            <Pagination.Item onClick={() => handlePageChange(1)}>1</Pagination.Item>
            {visiblePages[0] > 2 && <Pagination.Ellipsis />}
          </>
        )}
        
        {/* Visible page numbers */}
        {visiblePages.map(page => (
          <Pagination.Item
            key={page}
            active={page === currentPage}
            disabled={loading}
            onClick={() => handlePageChange(page)}
            className={`pharma-page-item ${page === currentPage ? 'pharma-page-active' : ''}`}
          >
            {page}
          </Pagination.Item>
        ))}
        
        {/* Ellipsis after visible pages */}
        {visiblePages[visiblePages.length - 1] < totalPages && (
          <>
            {visiblePages[visiblePages.length - 1] < totalPages - 1 && <Pagination.Ellipsis />}
            <Pagination.Item onClick={() => handlePageChange(totalPages)}>
              {totalPages}
            </Pagination.Item>
          </>
        )}
        
        {/* Next page */}
        <Pagination.Next 
          disabled={currentPage === totalPages || loading}
          onClick={() => handlePageChange(currentPage + 1)}
          className="pharma-page-next"
        />
        
        {/* Last page */}
        <Pagination.Last 
          disabled={currentPage === totalPages || loading}
          onClick={() => handlePageChange(totalPages)}
          className="pharma-page-last"
        />
      </Pagination>
    );
  };
  
  if (totalItems === 0) {
    return (
      <div className="pharma-pagination-container d-flex justify-content-center">
        <span className="text-muted">No {itemLabel} to display</span>
      </div>
    );
  }
  
  return (
    <div className="pharma-pagination-container">
      {/* Top row with info and controls */}
      <div className="pharma-pagination-header d-flex justify-content-between align-items-center mb-3">
        {renderInfo()}
        <div className="d-flex align-items-center gap-3">
          {renderJumpTo()}
          {renderItemsPerPage()}
        </div>
      </div>
      
      {/* Pagination controls */}
      <div className="d-flex justify-content-center">
        {renderPagination()}
      </div>
    </div>
  );
};

// Specialized pagination components
export const InventoryPagination = ({ ...props }) => (
  <PharmaPagination
    pharmaTheme="tablet"
    itemLabel="drugs"
    itemsPerPageOptions={[25, 50, 100, 200]}
    itemsPerPage={50}
    {...props}
  />
);

export const PrescriptionPagination = ({ ...props }) => (
  <PharmaPagination
    pharmaTheme="capsule"
    itemLabel="prescriptions"
    itemsPerPageOptions={[10, 20, 50, 100]}
    itemsPerPage={20}
    {...props}
  />
);

export const UserPagination = ({ ...props }) => (
  <PharmaPagination
    pharmaTheme="pill"
    itemLabel="users"
    itemsPerPageOptions={[10, 25, 50]}
    itemsPerPage={25}
    {...props}
  />
);

export const AuditPagination = ({ ...props }) => (
  <PharmaPagination
    pharmaTheme="tablet"
    itemLabel="transactions"
    itemsPerPageOptions={[20, 50, 100, 200]}
    itemsPerPage={50}
    showJumpTo={true}
    {...props}
  />
);

export default PharmaPagination;