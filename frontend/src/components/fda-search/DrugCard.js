/**
 * DrugCard Component
 * 
 * Displays individual drug search result in a card format with comprehensive information.
 * Extracted from FDASearch.js to improve reusability and maintainability.
 * 
 * Features:
 * - Drug information display (NDC, names, manufacturer, etc.)
 * - Active ingredient information
 * - Package details display
 * - Add to database functionality
 * - Existing inventory detection
 * - XSS protection via input sanitization
 * 
 * @component
 * @author PharmaTraK Development Team
 * @version 1.0.0
 */

import React from 'react';
import DOMPurify from 'dompurify';

/**
 * DrugCard Component - Individual drug result display
 * 
 * @param {Object} props - Component props
 * @param {Object} props.drug - Drug data object from FDA API
 * @param {string} props.drug.ndc - National Drug Code
 * @param {string} props.drug.generic_name - Generic drug name
 * @param {string} props.drug.brand_name - Brand/trade name
 * @param {string} props.drug.manufacturer_name - Manufacturer name
 * @param {string} props.drug.dosage_form - Dosage form (tablet, capsule, etc.)
 * @param {Array} props.drug.route - Administration routes (oral, topical, etc.)
 * @param {string} props.drug.strength - Drug strength information
 * @param {string} props.drug.package_description - Packaging details
 * @param {string|Array} props.drug.substance_name - Active ingredient names
 * @param {number} props.index - Array index for React key (used externally)
 * @param {Set} props.existingNDCs - Set of NDCs that already exist in inventory
 * @param {boolean} props.addingToDatabase - State indicating if adding drug is in progress
 * @param {Function} props.onAddToDatabase - Handler for adding drug to database
 * @returns {JSX.Element} Drug information card component
 */
const DrugCard = ({
  drug,
  index,
  existingNDCs,
  addingToDatabase,
  onAddToDatabase
}) => {
  /**
   * Sanitize user input to prevent XSS attacks
   * @param {string} input - Raw input string
   * @returns {string} Sanitized string
   */
  const sanitizeInput = (input) => {
    if (!input || typeof input !== 'string') return 'N/A';
    return DOMPurify.sanitize(input, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
  };

  /**
   * Format NDC number with standard dashes for display
   * Converts raw NDC number to readable format (XXXXX-XXXX-XX)
   * Handles both 10 and 11 digit NDC codes according to FDA standards
   * 
   * @param {string} ndc - Raw NDC number (with or without dashes)
   * @returns {string} Formatted NDC string or 'N/A' if invalid
   */
  const formatNDC = (ndc) => {
    if (!ndc) return 'N/A';
    
    // Extract only numeric characters
    const cleanNDC = ndc.replace(/[^0-9]/g, '');
    
    // Format 11-digit NDC as XXXXX-XXXX-XX
    if (cleanNDC.length === 11) {
      return `${cleanNDC.slice(0, 5)}-${cleanNDC.slice(5, 9)}-${cleanNDC.slice(9, 11)}`;
    }
    
    // Return original if not standard length
    return ndc;
  };

  return (
    <div key={index} className="card mb-3">
      <div className="card-body">
        <h5 className="card-title text-primary">
          {sanitizeInput(drug.brand_name) || sanitizeInput(drug.generic_name) || 'Unknown Drug'}
        </h5>
        
        <div className="row">
          <div className="col-md-6">
            <p className="mb-1">
              <strong>NDC:</strong> <code>{formatNDC(drug.ndc)}</code>
            </p>
            <p className="mb-1">
              <strong>Generic Name:</strong> {sanitizeInput(drug.generic_name)}
            </p>
            <p className="mb-1">
              <strong>Brand Name:</strong> {sanitizeInput(drug.brand_name)}
            </p>
            <p className="mb-1">
              <strong>Manufacturer:</strong> {sanitizeInput(drug.manufacturer_name)}
            </p>
          </div>
          <div className="col-md-6">
            <p className="mb-1">
              <strong>Dosage Form:</strong> {sanitizeInput(drug.dosage_form)}
            </p>
            <p className="mb-1">
              <strong>Route:</strong> {drug.route ? drug.route.map(sanitizeInput).join(', ') : 'N/A'}
            </p>
            <p className="mb-1">
              <strong>Strength:</strong> {sanitizeInput(drug.strength)}
            </p>
            <p className="mb-1">
              <strong>Package Description:</strong> {sanitizeInput(drug.package_description)}
            </p>
          </div>
        </div>

        {/* Active Ingredients Section */}
        {drug.substance_name && (
          <p className="mb-1">
            <strong>Active Ingredients:</strong> 
            <span className="text-info ml-2">
              {Array.isArray(drug.substance_name) 
                ? drug.substance_name.map(sanitizeInput).join(', ')
                : sanitizeInput(drug.substance_name)}
            </span>
          </p>
        )}

        {/* Package Information Section */}
        {drug.package_description && (
          <div className="mt-3">
            <h6>Package Information</h6>
            <p className="mb-2 p-2 bg-light rounded border">
              <strong>Package:</strong> {sanitizeInput(drug.package_description)}
            </p>
          </div>
        )}

        {/* Action Buttons Section */}
        <div className="mt-3">
          {existingNDCs.has(drug.ndc) ? (
            <div className="d-inline-block">
              <button 
                className="btn btn-secondary me-2"
                disabled={true}
              >
                <i className="bi bi-check-circle me-1"></i>
                Already in Inventory
              </button>
              <small className="text-muted ms-1">
                This drug already exists in your store's inventory
              </small>
            </div>
          ) : (
            <button 
              className="btn btn-success me-2"
              onClick={() => onAddToDatabase(drug)}
              disabled={addingToDatabase || !drug.ndc}
            >
              Add to Database
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DrugCard;