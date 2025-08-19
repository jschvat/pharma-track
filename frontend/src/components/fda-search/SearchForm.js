/**
 * SearchForm Component
 * 
 * Handles FDA database search form with multiple search types and input validation.
 * Extracted from FDASearch.js to improve maintainability and modularity.
 * 
 * Features:
 * - Search type selection (NDC, Generic, Brand, Manufacturer)
 * - Dynamic input fields based on search type
 * - Form validation and submission
 * - Results limit configuration
 * - Responsive design with Bootstrap
 * 
 * @component
 * @author PharmaTraK Development Team
 * @version 1.0.0
 */

import React from 'react';
import { Button } from 'react-bootstrap';

/**
 * SearchForm Component - FDA search form interface
 * 
 * @param {Object} props - Component props
 * @param {string} props.searchType - Current search type ('ndc', 'generic', 'brand', 'manufacturer')
 * @param {Object} props.searchParams - Search form parameters
 * @param {string} props.searchParams.ndc - NDC search parameter
 * @param {string} props.searchParams.generic_name - Generic name search parameter
 * @param {string} props.searchParams.brand_name - Brand name search parameter
 * @param {string} props.searchParams.manufacturer - Manufacturer search parameter
 * @param {number} props.searchParams.limit - Results limit (5-50)
 * @param {boolean} props.loading - Loading state indicator
 * @param {Function} props.onSearchTypeChange - Search type change handler
 * @param {Function} props.onInputChange - Input field change handler
 * @param {Function} props.onSubmit - Form submission handler
 * @returns {JSX.Element} The search form component
 */
const SearchForm = ({
  searchType,
  searchParams,
  loading,
  onSearchTypeChange,
  onInputChange,
  onSubmit
}) => {
  return (
    <div className="card mb-4">
      <div className="card-body">
        <form onSubmit={onSubmit}>
          {/* Search Type Selection */}
          <div className="mb-4">
            <label className="form-label">
              <strong>Search Type:</strong>
              <i 
                className="bi bi-info-circle ms-2 text-info" 
                title="Choose how to search the FDA database. Drugs already in your inventory will be greyed out."
              ></i>
            </label>
            <div className="btn-group d-block" role="group">
              <button
                type="button"
                className={`btn me-2 mb-2 ${searchType === 'ndc' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => onSearchTypeChange('ndc')}
              >
                NDC Number
              </button>
              <button
                type="button"
                className={`btn me-2 mb-2 ${searchType === 'generic' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => onSearchTypeChange('generic')}
              >
                Generic Name
              </button>
              <button
                type="button"
                className={`btn me-2 mb-2 ${searchType === 'brand' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => onSearchTypeChange('brand')}
              >
                Brand Name
              </button>
              <button
                type="button"
                className={`btn me-2 mb-2 ${searchType === 'manufacturer' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => onSearchTypeChange('manufacturer')}
              >
                Manufacturer
              </button>
            </div>
          </div>

          {/* Search Input Fields */}
          <div className="row">
            <div className="col-md-8">
              {searchType === 'ndc' && (
                <div className="mb-3">
                  <label htmlFor="ndc" className="form-label">NDC Number</label>
                  <input
                    type="text"
                    className="form-control"
                    id="ndc"
                    name="ndc"
                    value={searchParams.ndc}
                    onChange={onInputChange}
                    placeholder="e.g., 0069-2587-10 or 00692587010"
                    pattern="[0-9\-]+"
                  />
                  <div className="form-text">
                    Enter NDC with or without dashes (e.g., 0069-2587-10 or 00692587010)
                    <br />
                    <small className="text-info">
                      <i className="bi bi-info-circle me-1"></i>
                      Drugs already in your inventory will show "Already in Inventory" instead of "Add to Database"
                    </small>
                  </div>
                </div>
              )}

              {searchType === 'generic' && (
                <div className="mb-3">
                  <label htmlFor="generic_name" className="form-label">Generic Name</label>
                  <input
                    type="text"
                    className="form-control"
                    id="generic_name"
                    name="generic_name"
                    value={searchParams.generic_name}
                    onChange={onInputChange}
                    placeholder="e.g., acetaminophen"
                  />
                </div>
              )}

              {searchType === 'brand' && (
                <div className="mb-3">
                  <label htmlFor="brand_name" className="form-label">Brand Name</label>
                  <input
                    type="text"
                    className="form-control"
                    id="brand_name"
                    name="brand_name"
                    value={searchParams.brand_name}
                    onChange={onInputChange}
                    placeholder="e.g., Tylenol"
                  />
                </div>
              )}

              {searchType === 'manufacturer' && (
                <div className="mb-3">
                  <label htmlFor="manufacturer" className="form-label">Manufacturer</label>
                  <input
                    type="text"
                    className="form-control"
                    id="manufacturer"
                    name="manufacturer"
                    value={searchParams.manufacturer}
                    onChange={onInputChange}
                    placeholder="e.g., Johnson & Johnson"
                  />
                </div>
              )}
            </div>

            {/* Results Limit Selection */}
            <div className="col-md-4">
              <div className="mb-3">
                <label htmlFor="limit" className="form-label">Results Limit</label>
                <select
                  className="form-control"
                  id="limit"
                  name="limit"
                  value={searchParams.limit}
                  onChange={onInputChange}
                >
                  <option value={5}>5 results</option>
                  <option value={10}>10 results</option>
                  <option value={25}>25 results</option>
                  <option value={50}>50 results</option>
                </select>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                Searching FDA Database...
              </>
            ) : (
              'Search FDA Database'
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default SearchForm;