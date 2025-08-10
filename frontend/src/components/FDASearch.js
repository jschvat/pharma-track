/**
 * FDA Drug Search Component
 * 
 * This component provides a comprehensive interface for searching the FDA drug database
 * with multiple search criteria including NDC numbers, generic names, brand names,
 * and manufacturers. It displays search results in a user-friendly card format
 * with detailed drug information and the ability to add drugs to the local database.
 * 
 * Features:
 * - Multi-criteria search (NDC, Generic Name, Brand Name, Manufacturer)
 * - Real-time search results with caching
 * - Drug information display including packaging details
 * - Add drugs directly to local inventory database
 * - Responsive design with Bootstrap components
 * 
 * @component
 * @author PharmaTraK Development Team
 * @version 1.0.0
 */

import React, { useState } from 'react';
import { Modal, Button, Form, Row, Col } from 'react-bootstrap';
import { drugAPI } from '../services/api';

/**
 * FDASearch Component - Main component for FDA drug database searches
 * 
 * @returns {JSX.Element} The FDA search interface component
 */
function FDASearch() {
  // ===== STATE MANAGEMENT =====
  
  /**
   * Search parameters state - stores all search form inputs
   * @type {Object} searchParams - Object containing search criteria
   * @property {string} ndc - National Drug Code for NDC-based searches
   * @property {string} generic_name - Generic drug name for generic searches
   * @property {string} brand_name - Brand/trade name for brand searches  
   * @property {string} manufacturer - Manufacturer name for manufacturer searches
   * @property {number} limit - Maximum number of results to return (5-50)
   */
  const [searchParams, setSearchParams] = useState({
    ndc: '',
    generic_name: '',
    brand_name: '',
    manufacturer: '',
    limit: 10
  });

  /**
   * Search results state - stores FDA API response data
   * @type {Array} results - Array of drug objects returned from FDA API
   */
  const [results, setResults] = useState([]);

  /**
   * Loading state - indicates when API request is in progress
   * @type {boolean} loading - True when search request is active
   */
  const [loading, setLoading] = useState(false);

  /**
   * Error state - stores error messages for display to user
   * @type {string} error - Error message string, empty when no error
   */
  const [error, setError] = useState('');

  /**
   * Search type state - tracks which search method is currently active
   * @type {string} searchType - One of: 'ndc', 'generic', 'brand', 'manufacturer'
   */
  const [searchType, setSearchType] = useState('ndc');

  /**
   * Database addition state - indicates when adding drug to local database
   * @type {boolean} addingToDatabase - True when add operation is in progress
   */
  const [addingToDatabase, setAddingToDatabase] = useState(false);

  /**
   * Add drug modal state - controls visibility of quantity input modal
   * @type {boolean} showAddModal - True when add drug modal is displayed
   */
  const [showAddModal, setShowAddModal] = useState(false);

  /**
   * Selected drug for addition - stores drug data for modal display
   * @type {Object|null} selectedDrugForAdd - Drug object or null
   */
  const [selectedDrugForAdd, setSelectedDrugForAdd] = useState(null);
  
  /**
   * Modal-specific error message - displayed within the add drug modal
   * @type {string} modalError - Error message for modal display
   */
  const [modalError, setModalError] = useState('');

  /**
   * Set of NDCs that already exist in the store's inventory
   * @type {Set<string>} existingNDCs - NDCs that exist in store inventory
   */
  const [existingNDCs, setExistingNDCs] = useState(new Set());

  /**
   * Selected package NDC for drug addition
   * @type {string} selectedPackageNDC - Selected package NDC in 5-4-2 format
   */
  const [selectedPackageNDC, setSelectedPackageNDC] = useState('');


  /**
   * Initial inventory form data - stores quantity and inventory details
   * @type {Object} initialInventoryForm - Form data for initial inventory
   * @property {string} quantity - Initial quantity on hand
   * @property {string} reorder_level - Reorder level threshold
   * @property {string} unit_cost - Unit cost per item
   * @property {string} selling_price - Selling price per item
   * @property {string} lot_number - Lot/batch number
   * @property {string} expiration_date - Expiration date (YYYY-MM-DD)
   * @property {string} supplier - Supplier name
   */
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
   * Updates the searchParams state with new values from form inputs
   * 
   * @param {Event} e - The input change event object
   * @param {string} e.target.name - The name attribute of the input field
   * @param {string} e.target.value - The current value of the input field
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSearchParams(prev => ({
      ...prev,
      [name]: value
    }));
  };

  /**
   * Handle search type selection (NDC, Generic, Brand, Manufacturer)
   * Resets all search parameters and results when switching search types
   * to prevent confusion and ensure clean state
   * 
   * @param {string} type - The search type to switch to ('ndc', 'generic', 'brand', 'manufacturer')
   */
  const handleSearchTypeChange = (type) => {
    setSearchType(type);
    // Reset all search parameters to default values
    setSearchParams({
      ndc: '',
      generic_name: '',
      brand_name: '',
      manufacturer: '',
      limit: 10
    });
    // Clear previous results and errors
    setResults([]);
    setError('');
    setExistingNDCs(new Set());
  };

  // ===== UTILITY FUNCTIONS =====

  /**
   * Check which drugs from FDA results already exist in store inventory
   * @param {Array} drugs - Array of drug objects from FDA search
   * @returns {Set<string>} Set of NDCs that exist in store inventory
   */
  const checkExistingDrugs = async (drugs) => {
    if (!drugs || drugs.length === 0) return new Set();

    try {
      // Extract all NDCs from the search results
      const ndcs = drugs.map(drug => drug.ndc).filter(Boolean);
      
      // Check which ones already exist in store inventory
      const response = await drugAPI.checkDrugsExist(ndcs);
      return new Set(response.existingNDCs || []);
    } catch (error) {
      console.error('Error checking existing drugs:', error);
      return new Set();
    }
  };


  // ===== SEARCH FUNCTIONS =====

  /**
   * Handle FDA database search submission
   * Performs API call to backend FDA search endpoint with appropriate parameters
   * based on currently selected search type. Includes comprehensive error handling
   * and loading state management.
   * 
   * @param {Event} e - Form submission event object
   * @async
   * @function
   * 
   * @throws {Error} When API request fails or returns invalid data
   * 
   * @example
   * // When user submits search form, this function:
   * // 1. Prevents default form submission
   * // 2. Validates search parameters
   * // 3. Makes API call to FDA service
   * // 4. Updates results or error state
   * // 5. Manages loading indicators
   */
  const handleSearch = async (e) => {
    e.preventDefault(); // Prevent default form submission behavior
    setLoading(true);   // Show loading spinner
    setError('');       // Clear any previous errors
    setResults([]);     // Clear previous results
    setExistingNDCs(new Set()); // Clear existing NDCs check

    try {
      // Build API parameters based on current search type
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
        // No valid search term provided
        setError('Please enter a search term');
        setLoading(false);
        return;
      }

      // Make API call to FDA search endpoint
      const response = await drugAPI.searchFDA(params);
      
      // Process successful response
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
      // Handle API errors with user-friendly messages
      console.error('FDA Search error:', err);
      setError(err.response?.data?.error || 'Search failed. Please try again.');
    } finally {
      // Always hide loading spinner when complete
      setLoading(false);
    }
  };

  /**
   * Open add drug modal with initial quantity form
   * Shows modal for user to enter initial inventory details before adding drug
   * 
   * @param {Object} drug - Drug object from FDA search results
   * @param {string} drug.ndc - National Drug Code (required for database addition)
   * @param {string} drug.brand_name - Brand name for display purposes
   * @param {string} drug.generic_name - Generic name for display purposes
   */
  /**
   * Check if drug already exists in local database
   * @param {string} ndc - National Drug Code to check
   * @returns {Promise<boolean>} True if drug exists
   */
  const checkDrugExists = async (ndc) => {
    try {
      const response = await drugAPI.search({ ndc: ndc.replace(/[-]/g, ''), limit: 1 });
      return response.data.drugs && response.data.drugs.length > 0;
    } catch (error) {
      console.error('Error checking if drug exists:', error);
      return false; // Assume doesn't exist on error to allow addition
    }
  };

  const handleAddToDatabase = async (drug) => {
    console.log('=== FRONTEND: handleAddToDatabase called ===');
    console.log('Drug:', drug);
    
    // Validate required NDC field
    if (!drug.ndc) {
      setError('Cannot add drug without NDC number');
      return;
    }

    // Check if drug already exists in database
    setAddingToDatabase(true); // Show loading while checking
    try {
      const drugExists = await checkDrugExists(drug.ndc);
      if (drugExists) {
        setError('This drug already exists in your database. Search your inventory to view existing stock.');
        return;
      }
    } catch (error) {
      console.error('Error checking drug existence:', error);
    }

    console.log('Opening modal for drug:', drug.ndc);
    console.log('Drug packaging:', drug.packaging);
    
    setAddingToDatabase(false);
    
    // Store selected drug
    setSelectedDrugForAdd(drug);
    setShowAddModal(true);
    setModalError(''); // Clear any previous modal errors
    setSelectedPackageNDC(''); // Reset package NDC selection
    
    // Reset form to default values
    setInitialInventoryForm({
      quantity: '',
      reorder_level: '10',
      unit_cost: '',
      selling_price: '',
      lot_number: '',
      expiration_date: '',
      supplier: ''
    });
  };

  /**
   * Handle form input changes for initial inventory form
   * Updates initialInventoryForm state with new values
   * 
   * @param {Event} e - Input change event object
   */
  const handleInventoryFormChange = (e) => {
    const { name, value } = e.target;
    setInitialInventoryForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  /**
   * Submit drug addition with initial inventory
   * Creates drug in database and adds initial inventory record
   * 
   * @async
   * @function
   */
  const handleSubmitAddDrug = async () => {
    if (!selectedDrugForAdd) return;

    // Clear previous modal errors
    setModalError('');
    
    // Validate required fields
    if (!initialInventoryForm.quantity || parseFloat(initialInventoryForm.quantity) <= 0) {
      setModalError('Please enter a valid initial quantity');
      return;
    }

    // Validate package NDC selection if packages are available
    if (selectedDrugForAdd.packaging && selectedDrugForAdd.packaging.length > 0) {
      if (!selectedPackageNDC) {
        setModalError('Please select a package from the available options');
        return;
      }
    }

    console.log('=== FRONTEND: Submitting drug with inventory ===');
    console.log('Selected drug:', selectedDrugForAdd);
    console.log('Selected package NDC:', selectedPackageNDC);
    console.log('Initial inventory form:', initialInventoryForm);

    setAddingToDatabase(true);
    try {
      // Use selected package NDC if available, otherwise use main NDC
      const ndcToUse = selectedPackageNDC || selectedDrugForAdd.ndc;
      const standardizedNDC = standardizeNDC(ndcToUse);
      
      // Add drug to database with initial inventory
      const requestData = {
        ndc: standardizedNDC,
        initialInventory: initialInventoryForm
      };
      console.log('Request data being sent:', requestData);
      
      const response = await drugAPI.addFromFDAWithInventory(requestData);
      console.log('Response from API:', response);
      
      // Show success message
      alert(`Drug "${selectedDrugForAdd.brand_name || selectedDrugForAdd.generic_name}" added to database with initial inventory!`);
      
      // Remove drug from results and close modal
      setResults(prev => prev.filter(r => r.ndc !== selectedDrugForAdd.ndc));
      setShowAddModal(false);
      setSelectedDrugForAdd(null);
      setSelectedPackageNDC(''); // Clear package NDC selection
      setModalError(''); // Clear modal errors
    } catch (err) {
      console.error('=== FULL ERROR DETAILS ===');
      console.error('Error object:', err);
      console.error('Error response:', err.response);
      console.error('Error message:', err.message);
      console.error('Error status:', err.response?.status);
      console.error('Error data:', err.response?.data);
      
      let errorMessage = 'Failed to add drug to database';
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      console.error('Setting error message:', errorMessage);
      setModalError(errorMessage);
      
      // Don't close modal on error so user can see the error and retry
    } finally {
      setAddingToDatabase(false);
    }
  };

  // ===== UTILITY FUNCTIONS =====

  /**
   * Standardize NDC to 5-4-2 format for database storage
   * @param {string} ndc - Raw NDC number (with or without dashes)
   * @returns {string} Standardized NDC in 5-4-2 format
   */
  const standardizeNDC = (ndc) => {
    if (!ndc) return '';
    // Remove all non-digits
    const cleanNDC = ndc.replace(/\D/g, '');
    // Pad with leading zeros to make it 11 digits
    const paddedNDC = cleanNDC.padStart(11, '0');
    // Format as 5-4-2
    return `${paddedNDC.slice(0, 5)}-${paddedNDC.slice(5, 9)}-${paddedNDC.slice(9, 11)}`;
  };

  /**
   * Format NDC number with standard dashes for display
   * Converts raw NDC number to readable format (XXXXX-XXXX-XX)
   * Handles both 10 and 11 digit NDC codes according to FDA standards
   * 
   * @param {string} ndc - Raw NDC number (with or without dashes)
   * @returns {string} Formatted NDC string or 'N/A' if invalid
   * 
   * @example
   * formatNDC("1234567890")     // Returns "12345-678-90" 
   * formatNDC("12345-678-90")   // Returns "12345-678-90"
   * formatNDC("")               // Returns "N/A"
   * formatNDC("invalid")        // Returns "invalid"
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

  // ===== SUB-COMPONENTS =====

  /**
   * DrugCard Component - Displays individual drug search result
   * Renders a Bootstrap card with comprehensive drug information including
   * NDC, names, manufacturer, dosage details, and packaging information.
   * Also provides "Add to Database" functionality.
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
   * @param {string} props.drug.substance_name - Active ingredient names
   * @param {number} props.index - Array index for React key (used externally)
   * @returns {JSX.Element} Drug information card component
   * 
   * @example
   * <DrugCard 
   *   drug={{
   *     ndc: "12345-678-90",
   *     generic_name: "acetaminophen",
   *     brand_name: "Tylenol",
   *     manufacturer_name: "Johnson & Johnson"
   *   }}
   *   index={0}
   * />
   */
  const DrugCard = ({ drug, index }) => (
    <div key={index} className="card mb-3">
      <div className="card-body">
        <h5 className="card-title text-primary">
          {drug.brand_name || drug.generic_name || 'Unknown Drug'}
        </h5>
        
        <div className="row">
          <div className="col-md-6">
            <p className="mb-1">
              <strong>NDC:</strong> <code>{formatNDC(drug.ndc)}</code>
            </p>
            <p className="mb-1">
              <strong>Generic Name:</strong> {drug.generic_name || 'N/A'}
            </p>
            <p className="mb-1">
              <strong>Brand Name:</strong> {drug.brand_name || 'N/A'}
            </p>
            <p className="mb-1">
              <strong>Manufacturer:</strong> {drug.manufacturer_name || 'N/A'}
            </p>
          </div>
          <div className="col-md-6">
            <p className="mb-1">
              <strong>Dosage Form:</strong> {drug.dosage_form || 'N/A'}
            </p>
            <p className="mb-1">
              <strong>Route:</strong> {drug.route ? drug.route.join(', ') : 'N/A'}
            </p>
            <p className="mb-1">
              <strong>Strength:</strong> {drug.strength || 'N/A'}
            </p>
            <p className="mb-1">
              <strong>Package Description:</strong> {drug.package_description || 'N/A'}
            </p>
          </div>
        </div>

        {drug.substance_name && (
          <p className="mb-1">
            <strong>Active Ingredients:</strong> 
            <span className="text-info ml-2">
              {Array.isArray(drug.substance_name) 
                ? drug.substance_name.join(', ')
                : drug.substance_name}
            </span>
          </p>
        )}

        {drug.package_description && (
          <div className="mt-3">
            <h6>Package Information</h6>
            <p className="mb-2 p-2 bg-light rounded border">
              <strong>Package:</strong> {drug.package_description}
            </p>
          </div>
        )}

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
              onClick={() => handleAddToDatabase(drug)}
              disabled={addingToDatabase || !drug.ndc}
            >
              Add to Database
            </button>
          )}
        </div>
      </div>
    </div>
  );

  // ===== MAIN COMPONENT RENDER =====
  /**
   * Main component render method
   * Returns the complete FDA search interface including:
   * - Search type selection buttons
   * - Dynamic search input forms based on type
   * - Results display with drug cards
   * - Error handling and loading states
   * - Responsive Bootstrap layout
   */
  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>FDA Drug Search</h2>
            <span className="text-muted">Search the FDA drug database</span>
          </div>
          

          {/* Search Form */}
          <div className="card mb-4">
            <div className="card-body">
              <form onSubmit={handleSearch}>
                {/* Search Type Selection - Simplified */}
                <div className="mb-4">
                  <label className="form-label">
                    <strong>Search Type:</strong>
                    <i className="bi bi-info-circle ms-2 text-info" title="Choose how to search the FDA database. Drugs already in your inventory will be greyed out."></i>
                  </label>
                  <div className="btn-group d-block" role="group">
                    <button
                      type="button"
                      className={`btn me-2 mb-2 ${searchType === 'ndc' ? 'btn-primary' : 'btn-outline-primary'}`}
                      onClick={() => handleSearchTypeChange('ndc')}
                    >
                      NDC Number
                    </button>
                    <button
                      type="button"
                      className={`btn me-2 mb-2 ${searchType === 'generic' ? 'btn-primary' : 'btn-outline-primary'}`}
                      onClick={() => handleSearchTypeChange('generic')}
                    >
                      Generic Name
                    </button>
                    <button
                      type="button"
                      className={`btn me-2 mb-2 ${searchType === 'brand' ? 'btn-primary' : 'btn-outline-primary'}`}
                      onClick={() => handleSearchTypeChange('brand')}
                    >
                      Brand Name
                    </button>
                    <button
                      type="button"
                      className={`btn me-2 mb-2 ${searchType === 'manufacturer' ? 'btn-primary' : 'btn-outline-primary'}`}
                      onClick={() => handleSearchTypeChange('manufacturer')}
                    >
                      Manufacturer
                    </button>
                  </div>
                </div>

                {/* Search Input */}
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
                          onChange={handleInputChange}
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
                          onChange={handleInputChange}
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
                          onChange={handleInputChange}
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
                          onChange={handleInputChange}
                          placeholder="e.g., Johnson & Johnson"
                        />
                      </div>
                    )}
                  </div>

                  <div className="col-md-4">
                    <div className="mb-3">
                      <label htmlFor="limit" className="form-label">Results Limit</label>
                      <select
                        className="form-control"
                        id="limit"
                        name="limit"
                        value={searchParams.limit}
                        onChange={handleInputChange}
                      >
                        <option value={5}>5 results</option>
                        <option value={10}>10 results</option>
                        <option value={25}>25 results</option>
                        <option value={50}>50 results</option>
                      </select>
                    </div>
                  </div>
                </div>

                <button
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
                </button>
              </form>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="alert alert-danger" role="alert">
              <i className="fas fa-exclamation-circle me-2"></i>
              {error}
            </div>
          )}

          {/* Results */}
          {results.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">
                  Search Results ({results.length} found)
                </h5>
              </div>
              <div className="card-body">
                {results.map((drug, index) => (
                  <DrugCard key={`${drug.ndc}-${index}`} drug={drug} index={index} />
                ))}
              </div>
            </div>
          )}

          {/* No Results Message */}
          {!loading && results.length === 0 && !error && (
            <div className="text-center text-muted py-5">
              <i className="fas fa-search fa-3x mb-3"></i>
              <h4>Search FDA Drug Database</h4>
              <p>Enter search criteria above to find drugs in the FDA database</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Drug with Initial Inventory Modal */}
      <Modal show={showAddModal} onHide={() => {
        setShowAddModal(false);
        setModalError('');
        setSelectedDrugForAdd(null);
        setSelectedPackageNDC('');
      }} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Add Drug to Inventory</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedDrugForAdd && (
            <>
              {/* Drug Information Display */}
              <div className="mb-4 p-3 bg-light rounded">
                <h6 className="text-primary mb-2">Drug Information</h6>
                <Row>
                  <Col md={6}>
                    <strong>Generic Name:</strong> {selectedDrugForAdd.generic_name}<br/>
                    <strong>Brand Name:</strong> {selectedDrugForAdd.brand_name || 'N/A'}<br/>
                    <strong>NDC:</strong> {formatNDC(selectedDrugForAdd.ndc)}
                  </Col>
                  <Col md={6}>
                    <strong>Manufacturer:</strong> {selectedDrugForAdd.manufacturer_name || 'N/A'}<br/>
                    <strong>Dosage Form:</strong> {selectedDrugForAdd.dosage_form || 'N/A'}<br/>
                    <strong>Strength:</strong> {selectedDrugForAdd.strength || 'N/A'}
                  </Col>
                </Row>
              </div>

              {/* Package Selection */}
              {selectedDrugForAdd.packaging && selectedDrugForAdd.packaging.length > 0 && (
                <div className="mb-4">
                  <h6 className="text-primary mb-2">Select Package Information</h6>
                  <Form.Group className="mb-3">
                    <Form.Label>
                      Package NDC and Description 
                      <span className="text-danger">*</span>
                      <i className="bi bi-info-circle ms-2 text-info" title="Select the specific package NDC from the available options. The selected NDC will be used for database entry."></i>
                    </Form.Label>
                    <Form.Control
                      as="select"
                      value={selectedPackageNDC}
                      onChange={(e) => setSelectedPackageNDC(e.target.value)}
                      required
                    >
                      <option value="">Choose a package...</option>
                      {selectedDrugForAdd.packaging.map((pkg, index) => (
                        <option key={index} value={pkg.package_ndc}>
                          NDC: {standardizeNDC(pkg.package_ndc)} - {pkg.description || 'No description'}
                        </option>
                      ))}
                    </Form.Control>
                    {selectedPackageNDC && (
                      <div className="form-text">
                        <strong>Selected Package NDC (5-4-2 format):</strong> {standardizeNDC(selectedPackageNDC)}
                      </div>
                    )}
                  </Form.Group>
                </div>
              )}

              {/* Modal Error Display */}
              {modalError && (
                <div className="alert alert-danger d-flex align-items-center mb-3">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  <div>{modalError}</div>
                </div>
              )}
              
              {/* Initial Inventory Form */}
              <h6 className="mb-3">Initial Inventory Details</h6>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Initial Quantity <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="number"
                      name="quantity"
                      value={initialInventoryForm.quantity}
                      onChange={handleInventoryFormChange}
                      min="1"
                      required
                      placeholder="Enter initial quantity"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Reorder Level</Form.Label>
                    <Form.Control
                      type="number"
                      name="reorder_level"
                      value={initialInventoryForm.reorder_level}
                      onChange={handleInventoryFormChange}
                      min="0"
                      placeholder="Minimum stock level"
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Unit Cost</Form.Label>
                    <Form.Control
                      type="number"
                      name="unit_cost"
                      value={initialInventoryForm.unit_cost}
                      onChange={handleInventoryFormChange}
                      min="0"
                      step="0.01"
                      placeholder="Cost per unit"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Selling Price</Form.Label>
                    <Form.Control
                      type="number"
                      name="selling_price"
                      value={initialInventoryForm.selling_price}
                      onChange={handleInventoryFormChange}
                      min="0"
                      step="0.01"
                      placeholder="Selling price per unit"
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Lot Number</Form.Label>
                    <Form.Control
                      type="text"
                      name="lot_number"
                      value={initialInventoryForm.lot_number}
                      onChange={handleInventoryFormChange}
                      placeholder="Batch/lot number"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Expiration Date</Form.Label>
                    <Form.Control
                      type="date"
                      name="expiration_date"
                      value={initialInventoryForm.expiration_date}
                      onChange={handleInventoryFormChange}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label>Supplier</Form.Label>
                <Form.Control
                  type="text"
                  name="supplier"
                  value={initialInventoryForm.supplier}
                  onChange={handleInventoryFormChange}
                  placeholder="Supplier name"
                />
              </Form.Group>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={() => {
              setShowAddModal(false);
              setModalError(''); // Clear modal errors when closing
              setSelectedDrugForAdd(null);
              setSelectedPackageNDC(''); // Clear package NDC selection
            }}
          >
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSubmitAddDrug}
            disabled={
              addingToDatabase || 
              !initialInventoryForm.quantity || 
              (selectedDrugForAdd?.packaging?.length > 0 && !selectedPackageNDC)
            }
          >
            {addingToDatabase ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                Adding...
              </>
            ) : (
              'Add to Inventory'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default FDASearch;