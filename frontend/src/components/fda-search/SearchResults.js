/**
 * SearchResults Component
 * 
 * Displays FDA search results in a structured format with error handling.
 * Extracted from FDASearch.js to improve maintainability and separation of concerns.
 * 
 * Features:
 * - Search results display with count
 * - Error message handling
 * - Empty state messaging
 * - Loading state awareness
 * - DrugCard integration for individual results
 * 
 * @component
 * @author PharmaTraK Development Team
 * @version 1.0.0
 */

import React from 'react';
import DrugCard from './DrugCard';

/**
 * SearchResults Component - Displays FDA search results
 * 
 * @param {Object} props - Component props
 * @param {Array} props.results - Array of drug objects from FDA search
 * @param {string} props.error - Error message to display (empty string if no error)
 * @param {boolean} props.loading - Loading state indicator
 * @param {Set} props.existingNDCs - Set of NDCs that already exist in inventory
 * @param {boolean} props.addingToDatabase - State indicating if adding drug is in progress
 * @param {Function} props.onAddToDatabase - Handler for adding drug to database
 * @returns {JSX.Element} The search results display component
 */
const SearchResults = ({
  results,
  error,
  loading,
  existingNDCs,
  addingToDatabase,
  onAddToDatabase
}) => {
  // Error Display
  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        <i className="fas fa-exclamation-circle me-2"></i>
        {error}
      </div>
    );
  }

  // Results Display
  if (results.length > 0) {
    return (
      <div className="card">
        <div className="card-header">
          <h5 className="mb-0">
            Search Results ({results.length} found)
          </h5>
        </div>
        <div className="card-body">
          {results.map((drug, index) => (
            <DrugCard
              key={`${drug.ndc}-${index}`}
              drug={drug}
              index={index}
              existingNDCs={existingNDCs}
              addingToDatabase={addingToDatabase}
              onAddToDatabase={onAddToDatabase}
            />
          ))}
        </div>
      </div>
    );
  }

  // Empty State - only show when not loading and no error
  if (!loading) {
    return (
      <div className="text-center text-muted py-5">
        <i className="fas fa-search fa-3x mb-3"></i>
        <h4>Search FDA Drug Database</h4>
        <p>Enter search criteria above to find drugs in the FDA database</p>
      </div>
    );
  }

  // Return null when loading (parent will handle loading state)
  return null;
};

export default SearchResults;