/**
 * Application Constants
 * 
 * Centralized constants for validation limits, timeouts, and other magic numbers
 * used throughout the PharmaTraK application.
 */

module.exports = {
  // Validation limits
  VALIDATION: {
    // Pagination limits
    MAX_PAGE_LIMIT: 100,
    MAX_REPORT_LIMIT: 1000,
    MIN_PAGE_LIMIT: 1,
    DEFAULT_PAGE_LIMIT: 20,
    
    // String length limits
    MAX_SEARCH_LENGTH: 100,
    MIN_SEARCH_LENGTH: 1,
    MAX_NAME_LENGTH: 100,
    MIN_NAME_LENGTH: 2,
    STATE_CODE_LENGTH: 2,
    
    // NDC validation
    MIN_NDC_LENGTH: 10,
    MAX_NDC_LENGTH: 13,
    
    // Reason and comment limits
    MAX_REASON_LENGTH: 500,
    MAX_COMMENT_LENGTH: 255,
    MIN_REASON_LENGTH: 1,
    
    // Prescription and reference numbers
    MAX_PRESCRIPTION_LENGTH: 100,
    MAX_REFERENCE_LENGTH: 100,
    
    // Date ranges
    MIN_EXPIRING_DAYS: 1,
    MAX_EXPIRING_DAYS: 365,
    DEFAULT_EXPIRING_DAYS: 30,
    
    // Inventory limits
    MAX_INVENTORY_LIMIT: 1000,
    DEFAULT_LOW_STOCK_LIMIT: 50
  },
  
  // Database query limits
  DATABASE: {
    MAX_QUERY_LIMIT: 1000,
    DEFAULT_LIMIT: 50,
    MIN_LIMIT: 1
  },
  
  // Transaction types
  TRANSACTION_TYPES: {
    INITIAL_INVENTORY: 'initial_inventory',
    SHIPMENT_RECEIVED: 'shipment_received',
    PRESCRIPTION_FILL: 'prescription_fill',
    RETURN_TO_STOCK: 'return_to_stock',
    EXPIRE: 'expire',
    AUDIT: 'audit'
  }
};