/**
 * FDA Drug Search Component (Refactored)
 * 
 * This is the refactored version of FDASearch.js that uses extracted components
 * for better maintainability and separation of concerns.
 * 
 * The original monolithic component (1,070 lines) has been broken down into:
 * - SearchForm: Handles search type selection and input
 * - SearchResults: Displays results with error handling
 * - DrugCard: Individual drug result display
 * - AddDrugModal: Modal for adding drugs with inventory details
 * 
 * Key improvements:
 * - Reduced main component from 1,070 lines to ~350 lines (67% reduction)
 * - Better separation of concerns and single responsibility
 * - Improved reusability of components
 * - Easier testing and maintenance
 * - Cleaner state management
 * 
 * @component
 * @author PharmaTraK Development Team
 * @version 2.0.0 (Refactored)
 */

import React, { useState } from 'react';
import { drugAPI } from '../services/api';
import { SearchForm, SearchResults, AddDrugModal } from './fda-search';

/**
 * FDASearch Component - Main component for FDA drug database searches
 * 
 * @returns {JSX.Element} The FDA search interface component
 */
function FDASearch() {
  // ===== STATE MANAGEMENT =====
  
  // Search parameters and results
  const [searchParams, setSearchParams] = useState({
    ndc: '',
    generic_name: '',
    brand_name: '',
    manufacturer: '',
    limit: 10
  });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchType, setSearchType] = useState('ndc');
  const [existingNDCs, setExistingNDCs] = useState(new Set());

  // Add drug modal states
  const [addingToDatabase, setAddingToDatabase] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDrugForAdd, setSelectedDrugForAdd] = useState(null);
  const [modalError, setModalError] = useState('');
  const [selectedPackageNDC, setSelectedPackageNDC] = useState('');
  const [initialInventoryForm, setInitialInventoryForm] = useState({
    quantity: '',
    reorder_level: '10',
    unit_cost: '',
    selling_price: '',
    lot_number: '',
    expiration_date: '',
    supplier: ''
  });

  // ===== EVENT HANDLERS =====

  /**
   * Handle input field changes in search form
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSearchParams(prev => ({
      ...prev,
      [name]: value
    }));
  };

  /**
   * Handle search type selection
   */
  const handleSearchTypeChange = (type) => {
    setSearchType(type);
    setSearchParams({
      ndc: '',
      generic_name: '',
      brand_name: '',
      manufacturer: '',
      limit: 10
    });
    setResults([]);
    setError('');
    setExistingNDCs(new Set());
  };

  /**
   * Handle form input changes for initial inventory form
   */
  const handleInventoryFormChange = (e) => {
    const { name, value } = e.target;
    setInitialInventoryForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // ===== UTILITY FUNCTIONS =====

  /**
   * Check which drugs already exist in store inventory
   */
  const checkExistingDrugs = async (drugs) => {
    if (!drugs || drugs.length === 0) return new Set();

    try {
      const ndcs = drugs.map(drug => drug.ndc).filter(Boolean);
      const response = await drugAPI.checkDrugsExist(ndcs);
      return new Set(response.existingNDCs || []);
    } catch (error) {
      console.error('Error checking existing drugs:', error);
      return new Set();
    }
  };

  /**
   * Check if individual drug exists in database
   */
  const checkDrugExists = async (ndc) => {
    try {
      if (!ndc || typeof ndc !== 'string') return false;
      
      const cleanNDC = ndc.replace(/[-]/g, '');
      const response = await drugAPI.search({ ndc: cleanNDC, limit: 1 });
      return response.data.drugs && response.data.drugs.length > 0;
    } catch (error) {
      console.error('Error checking if drug exists:', error);
      return false;
    }
  };

  /**
   * Standardize NDC to 5-4-2 format
   */
  const standardizeNDC = (ndc) => {
    if (!ndc) return '';
    const cleanNDC = ndc.replace(/\D/g, '');
    const paddedNDC = cleanNDC.padStart(11, '0');
    return `${paddedNDC.slice(0, 5)}-${paddedNDC.slice(5, 9)}-${paddedNDC.slice(9, 11)}`;
  };

  /**
   * Format NDC for display
   */
  const formatNDC = (ndc) => {
    if (!ndc) return 'N/A';
    const cleanNDC = ndc.replace(/[^0-9]/g, '');
    if (cleanNDC.length === 11) {
      return `${cleanNDC.slice(0, 5)}-${cleanNDC.slice(5, 9)}-${cleanNDC.slice(9, 11)}`;
    }
    return ndc;
  };

  // ===== SEARCH FUNCTIONS =====

  /**
   * Handle FDA database search submission
   */
  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResults([]);
    setExistingNDCs(new Set());

    try {
      const params = { limit: searchParams.limit };
      
      // Determine search parameter based on selected search type
      if (searchType === 'ndc' && searchParams.ndc) {
        params.ndc = searchParams.ndc;
      } else if (searchType === 'generic' && searchParams.generic_name) {
        params.generic_name = searchParams.generic_name;
      } else if (searchType === 'brand' && searchParams.brand_name) {
        params.brand_name = searchParams.brand_name;
      } else if (searchType === 'manufacturer' && searchParams.manufacturer) {
        params.manufacturer = searchParams.manufacturer;
      } else {
        setError('Please enter a search term');
        setLoading(false);
        return;
      }

      const response = await drugAPI.searchFDA(params);
      
      if (response.data.results && response.data.results.length > 0) {
        const fdaResults = response.data.results;
        setResults(fdaResults);
        
        // Check which drugs already exist in store inventory
        const existing = await checkExistingDrugs(fdaResults);
        setExistingNDCs(existing);
      } else {
        setError('No results found');
      }
    } catch (err) {
      console.error('FDA Search error:', err);
      setError(err.response?.data?.error || 'Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ===== ADD DRUG FUNCTIONS =====

  /**
   * Handle adding drug to database
   */
  const handleAddToDatabase = async (drug) => {
    try {
      if (!drug?.ndc) {
        setError('Cannot add drug without NDC number');
        return;
      }

      // Check if drug already exists
      setAddingToDatabase(true);
      const drugExists = await checkDrugExists(drug.ndc);
      if (drugExists) {
        setError('This drug already exists in your database. Search your inventory to view existing stock.');
        setAddingToDatabase(false);
        return;
      }

      // Open modal for inventory details
      setSelectedDrugForAdd(drug);
      setShowAddModal(true);
      setModalError('');
      setSelectedPackageNDC('');
      setInitialInventoryForm({
        quantity: '',
        reorder_level: '10',
        unit_cost: '',
        selling_price: '',
        lot_number: '',
        expiration_date: '',
        supplier: ''
      });
      setAddingToDatabase(false);
      
    } catch (error) {
      console.error('Error in handleAddToDatabase:', error);
      setError(`Failed to add drug: ${error.message}`);
      setAddingToDatabase(false);
    }
  };

  /**
   * Submit drug addition with initial inventory
   */
  const handleSubmitAddDrug = async () => {
    if (!selectedDrugForAdd) return;

    setModalError('');
    
    // Validate required fields
    if (!initialInventoryForm.quantity || parseFloat(initialInventoryForm.quantity) <= 0) {
      setModalError('Please enter a valid initial quantity');
      return;
    }

    // Validate package NDC selection if packages are available
    if (selectedDrugForAdd.packaging?.length > 0 && !selectedPackageNDC) {
      setModalError('Please select a package from the available options');
      return;
    }

    setAddingToDatabase(true);
    try {
      const ndcToUse = selectedPackageNDC || selectedDrugForAdd.ndc;
      if (!ndcToUse) {
        throw new Error('No NDC available for database entry');
      }
      
      const standardizedNDC = standardizeNDC(ndcToUse);
      if (!standardizedNDC) {
        throw new Error('NDC standardization failed');
      }
      
      const requestData = {
        ndc: standardizedNDC,
        initialInventory: initialInventoryForm
      };
      
      await drugAPI.addFromFDAWithInventory(requestData);
      
      // Show success and cleanup
      alert(`Drug "${selectedDrugForAdd.brand_name || selectedDrugForAdd.generic_name}" added to database with initial inventory!`);
      setResults(prev => prev.filter(r => r.ndc !== selectedDrugForAdd.ndc));
      setShowAddModal(false);
      setSelectedDrugForAdd(null);
      setSelectedPackageNDC('');
      setModalError('');
    } catch (err) {
      console.error('Error adding drug:', err);
      let errorMessage = 'Failed to add drug to database';
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.message) {
        errorMessage = err.message;
      }
      setModalError(errorMessage);
    } finally {
      setAddingToDatabase(false);
    }
  };

  /**
   * Handle modal close
   */
  const handleCloseModal = () => {
    setShowAddModal(false);
    setModalError('');
    setSelectedDrugForAdd(null);
    setSelectedPackageNDC('');
  };

  // ===== MAIN COMPONENT RENDER =====
  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>FDA Drug Search</h2>
            <span className="text-muted">Search the FDA drug database</span>
          </div>
          
          {/* Search Form Component */}
          <SearchForm
            searchType={searchType}
            searchParams={searchParams}
            loading={loading}
            onSearchTypeChange={handleSearchTypeChange}
            onInputChange={handleInputChange}
            onSubmit={handleSearch}
          />

          {/* Search Results Component */}
          <SearchResults
            results={results}
            error={error}
            loading={loading}
            existingNDCs={existingNDCs}
            addingToDatabase={addingToDatabase}
            onAddToDatabase={handleAddToDatabase}
          />

          {/* Add Drug Modal Component */}
          <AddDrugModal
            show={showAddModal}
            onHide={handleCloseModal}
            selectedDrug={selectedDrugForAdd}
            selectedPackageNDC={selectedPackageNDC}
            onPackageNDCChange={setSelectedPackageNDC}
            initialInventoryForm={initialInventoryForm}
            onInventoryFormChange={handleInventoryFormChange}
            onSubmit={handleSubmitAddDrug}
            addingToDatabase={addingToDatabase}
            modalError={modalError}
            formatNDC={formatNDC}
            standardizeNDC={standardizeNDC}
          />
        </div>
      </div>
    </div>
  );
}

export default FDASearch;