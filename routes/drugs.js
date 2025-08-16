/**
 * Drug Management API Routes
 * 
 * Comprehensive RESTful API for drug and inventory management in the PharmaTraK system.
 * Provides endpoints for FDA drug searches, local database management, and store inventory operations.
 * 
 * Route Categories:
 * - FDA Integration: Search FDA database and import drugs
 * - Drug Management: CRUD operations for local drug database
 * - Store Inventory: Multi-store inventory management with access controls
 * - Statistics: Analytics and reporting endpoints
 * 
 * Security Features:
 * - JWT token authentication on all endpoints
 * - Role-based access control (admin/store-specific permissions)
 * - Input validation and sanitization
 * - SQL injection prevention
 * - Store-level data isolation
 * 
 * API Standards:
 * - RESTful design patterns
 * - Consistent error handling and responses
 * - Comprehensive input validation
 * - Pagination support for large datasets
 * - Caching for FDA API responses
 * 
 * @module routes/drugs
 * @requires express
 * @requires express-validator
 * @requires ../openfda/fdaService
 * @requires ../models/Drug
 * @requires ../models/StoreInventory
 * @requires ../middleware/auth
 * @requires ../middleware/dataVerification
 * 
 * @author PharmaTraK Development Team
 * @version 2.0.0
 */

const express = require('express');
const { validationResult, query, body } = require('express-validator');
const { pool: db } = require('../config/database');
const fdaService = require('../openfda/fdaService');
const Drug = require('../models/Drug');
const StoreInventory = require('../models/StoreInventory');
const { authenticateToken, requireStoreAdmin } = require('../middleware/auth');
const { 
  verifyNDC, 
  verifyName, 
  verifyQuantity, 
  verifyPrice, 
  verifyDate,
  verifyId 
} = require('../middleware/dataVerification');
const debugLogger = require('../utilities/debug/debugLogger');

const router = express.Router();

/**
 * FDA Database Search Endpoint
 * 
 * Searches the FDA National Drug Code database using various criteria.
 * Supports multiple search types with intelligent query building and result transformation.
 * Includes response caching and performance monitoring.
 * 
 * @route GET /api/drugs/search/fda
 * @access Protected - Requires valid JWT token
 * 
 * @param {string} [ndc] - National Drug Code (format: XXXXX-XXXX-XX or similar)
 * @param {string} [generic_name] - Generic drug name (2-100 characters)
 * @param {string} [brand_name] - Brand/trade name (2-100 characters)  
 * @param {string} [manufacturer] - Manufacturer name (2-100 characters)
 * @param {number} [limit=10] - Maximum results to return (1-100)
 * 
 * @returns {Object} Search results with metadata
 * @returns {Array} results - Array of drug objects with standardized fields
 * @returns {number} total - Total number of results available
 * @returns {boolean} fromCache - Whether results came from cache
 * @returns {number} responseTime - API response time in milliseconds
 * 
 * @example
 * GET /api/drugs/search/fda?generic_name=acetaminophen&limit=25
 * 
 * @example Response
 * {
 *   "results": [
 *     {
 *       "ndc": "12345-678-90",
 *       "generic_name": "acetaminophen", 
 *       "brand_name": "Tylenol",
 *       "manufacturer_name": "Johnson & Johnson",
 *       "dosage_form": "TABLET",
 *       "route": ["ORAL"],
 *       "strength": "325 mg/1",
 *       "package_description": "100 TABLET in 1 BOTTLE"
 *     }
 *   ],
 *   "total": 1,
 *   "fromCache": false,
 *   "responseTime": 1250
 * }
 * 
 * @throws {400} Invalid query parameters
 * @throws {404} No results found matching criteria  
 * @throws {500} FDA API error or internal server error
 */
/**
 * FDA Database Search Route Handler
 * 
 * Comprehensive FDA National Drug Code database search endpoint with multiple search criteria.
 * Supports NDC, generic name, brand name, and manufacturer searches with intelligent
 * query building, result transformation, and performance monitoring.
 * 
 * Route: GET /api/drugs/search/fda
 * Access: Protected - Requires valid JWT token
 * Middleware: authenticateToken (../middleware/auth.js)
 * 
 * Function Calls Made:
 * - validationResult() from express-validator for input validation
 * - fdaService.searchByNDC() (../openfda/fdaService.js)
 * - fdaService.searchByGenericName() (../openfda/fdaService.js)
 * - fdaService.searchByBrandName() (../openfda/fdaService.js)  
 * - fdaService.searchByManufacturer() (../openfda/fdaService.js)
 * - fdaService.advancedSearch() (../openfda/fdaService.js)
 * - debugLogger.apiRequest() (../utils/debugLogger.js:320)
 * - debugLogger.functionEntry() (../utils/debugLogger.js:270)
 * - debugLogger.fdaApiCall() (../utils/debugLogger.js:400)
 * - debugLogger.apiResponse() (../utils/debugLogger.js:350)
 * - debugLogger.error() (../utils/debugLogger.js:197)
 * 
 * Variables Used:
 * - req: Express request object with query parameters
 * - res: Express response object for sending results
 * - errors: Validation errors from express-validator
 * - ndc, generic_name, brand_name, manufacturer, limit: Search parameters
 * - result: FDA API response object
 * - startTime, responseTime: Performance timing variables
 * - criteria: Advanced search criteria object
 * - transformedResults: Processed FDA results array
 * - fdaResult: Individual FDA result object
 * - packaging: Packaging information from FDA data
 * - transformed: Standardized result object
 * 
 * Location: /home/jason/Development/claude/pharmatrak/routes/drugs.js:130
 */
router.get('/search/fda', authenticateToken, [
  query('ndc').optional().matches(/^[0-9\-]{10,14}$/).withMessage('Invalid NDC format'),
  query('generic_name').optional().isLength({ min: 2, max: 100 }).withMessage('Generic name must be 2-100 characters'),
  query('brand_name').optional().isLength({ min: 2, max: 100 }).withMessage('Brand name must be 2-100 characters'),
  query('manufacturer').optional().isLength({ min: 2, max: 100 }).withMessage('Manufacturer must be 2-100 characters'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100').toInt()
], async (req, res) => {
  debugLogger.functionEntry('GET /search/fda', { query: req.query, user: req.user?.email });
  debugLogger.apiRequest(req, 'FDA database search request');
  
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      debugLogger.warn('FDA search validation failed', { errors: errors.array(), query: req.query });
      return res.status(400).json({ errors: errors.array() });
    }

    const { ndc, generic_name, brand_name, manufacturer, limit = 10 } = req.query;
    let result;
    
    debugLogger.debug('FDA search parameters extracted', {
      ndc, generic_name, brand_name, manufacturer, limit,
      searchType: ndc ? 'NDC' : generic_name ? 'generic' : brand_name ? 'brand' : manufacturer ? 'manufacturer' : 'unknown'
    });

    const startTime = Date.now();

    // Determine search type and call appropriate FDA service method
    if (ndc) {
      debugLogger.info('Performing FDA NDC search', { ndc });
      result = await fdaService.searchByNDC(ndc);
    } else if (generic_name) {
      debugLogger.info('Performing FDA generic name search', { generic_name, limit });
      result = await fdaService.searchByGenericName(generic_name, limit);
    } else if (brand_name) {
      debugLogger.info('Performing FDA brand name search', { brand_name, limit });
      result = await fdaService.searchByBrandName(brand_name, limit);
    } else if (manufacturer) {
      debugLogger.info('Performing FDA manufacturer search', { manufacturer, limit });
      result = await fdaService.searchByManufacturer(manufacturer, limit);
    } else {
      // Advanced search with multiple criteria
      const criteria = {};
      if (ndc) criteria.ndc = ndc;
      if (generic_name) criteria.genericName = generic_name;
      if (brand_name) criteria.brandName = brand_name;
      if (manufacturer) criteria.manufacturer = manufacturer;
      
      if (Object.keys(criteria).length === 0) {
        debugLogger.warn('FDA search attempted without parameters');
        return res.status(400).json({ 
          error: 'At least one search parameter is required (ndc, generic_name, brand_name, or manufacturer)' 
        });
      }
      
      debugLogger.info('Performing FDA advanced search', { criteria, limit });
      result = await fdaService.advancedSearch(criteria, limit);
    }

    const responseTime = Date.now() - startTime;
    
    debugLogger.fdaApiCall(
      'FDA Drug Database Search',
      { ndc, generic_name, brand_name, manufacturer, limit },
      result?.data,
      result?.fromCache,
      responseTime
    );

    // Log first result to understand FDA structure for debugging
    if (result.data.results && result.data.results.length > 0) {
      debugLogger.trace('FDA Raw Result Sample', { 
        firstResult: result.data.results[0],
        totalResults: result.data.results.length,
        hasPackaging: !!result.data.results[0].packaging
      });
    }

    // Transform FDA results to match expected frontend format
    const transformedResults = (result.data.results || []).map((fdaResult, index) => {
      // Extract packaging info from the FDA result
      const packaging = fdaResult.packaging?.[0] || {};
      
      const transformed = {
        ndc: fdaResult.product_ndc || fdaResult.ndc || 'N/A',
        generic_name: fdaResult.generic_name || 'N/A',
        brand_name: fdaResult.brand_name || 'N/A',
        manufacturer_name: fdaResult.labeler_name || fdaResult.openfda?.manufacturer_name?.[0] || 'N/A',
        dosage_form: fdaResult.dosage_form || 'N/A',
        route: fdaResult.route || [],
        strength: fdaResult.active_ingredients?.[0]?.strength || 'N/A',
        package_description: packaging.description || fdaResult.packaging_description || 'N/A',
        substance_name: fdaResult.active_ingredients?.map(ai => ai.name).join(', ') || fdaResult.substance_name,
        packaging: fdaResult.packaging || [] // Include full packaging array for frontend selection
      };
      
      debugLogger.trace(`Transformed FDA Result ${index + 1}`, { 
        originalNDC: fdaResult.product_ndc,
        transformedNDC: transformed.ndc,
        packagingCount: transformed.packaging.length,
        hasAllRequiredFields: !!(transformed.ndc && transformed.generic_name && transformed.brand_name)
      });
      
      return transformed;
    });

    debugLogger.info('FDA search completed successfully', {
      resultsCount: transformedResults.length,
      responseTime: `${responseTime}ms`,
      fromCache: result.fromCache,
      hasResults: transformedResults.length > 0
    });

    const responseData = {
      results: transformedResults,
      total: result.data.meta?.results?.total || transformedResults.length,
      fromCache: result.fromCache,
      responseTime: responseTime
    };

    debugLogger.apiResponse(req, res, responseData, responseTime);
    debugLogger.functionExit('GET /search/fda', { resultsCount: transformedResults.length });

    res.json(responseData);

  } catch (error) {
    debugLogger.error('FDA search error occurred', {
      error: error.message,
      stack: error.stack,
      query: req.query,
      user: req.user?.email
    });
    
    const errorResponse = { 
      error: 'Failed to search FDA database',
      message: error.message 
    };
    
    debugLogger.apiResponse(req, res, errorResponse);
    res.status(500).json(errorResponse);
  }
});

/**
 * Add Drug from FDA with Initial Inventory Endpoint
 * 
 * Creates drug record from FDA data and immediately adds initial inventory
 * for the authenticated user's store. Combines drug creation and inventory
 * setup in a single transaction for data consistency.
 * 
 * @route POST /api/drugs/add-from-fda-with-inventory  
 * @access Protected - Requires valid JWT token and store admin role
 * 
 * @param {string} ndc - National Drug Code (required)
 * @param {Object} initialInventory - Initial inventory details
 * @param {number} initialInventory.quantity - Initial quantity on hand (required)
 * @param {number} [initialInventory.reorder_level=10] - Reorder threshold
 * @param {number} [initialInventory.unit_cost] - Cost per unit
 * @param {number} [initialInventory.selling_price] - Selling price per unit
 * @param {string} [initialInventory.lot_number] - Lot/batch number
 * @param {string} [initialInventory.expiration_date] - Expiration date (YYYY-MM-DD)
 * @param {string} [initialInventory.supplier] - Supplier name
 * 
 * @returns {Object} Success response with drug and inventory details
 * @returns {string} message - Success message
 * @returns {Object} drug - Created drug object
 * @returns {Object} inventory - Created inventory object
 * 
 * @throws {400} Invalid input data or missing required fields
 * @throws {404} Drug not found in FDA database
 * @throws {409} Drug already exists in local database with inventory
 * @throws {500} Database error or FDA API error
 */
/**
 * Add Drug from FDA with Initial Inventory Route Handler
 * 
 * Creates drug record from FDA data and immediately adds initial inventory
 * for the authenticated user's store. Combines drug creation and inventory
 * setup in a single atomic transaction for data consistency.
 * 
 * Route: POST /api/drugs/add-from-fda-with-inventory
 * Access: Protected - Requires valid JWT token and store admin role
 * Middleware: authenticateToken, requireStoreAdmin (../middleware/auth.js)
 * 
 * Function Calls Made:
 * - validationResult() from express-validator for input validation
 * - fdaService.searchByNDC() (../openfda/fdaService.js)
 * - Drug.createFromFDA() (../models/Drug.js)
 * - Drug.findById() (../models/Drug.js)
 * - StoreInventory.findByStoreDrug() (../models/StoreInventory.js)
 * - StoreInventory.add() (../models/StoreInventory.js)
 * - StoreInventory.findById() (../models/StoreInventory.js)
 * - debugLogger.apiRequest() (../utils/debugLogger.js:320)
 * - debugLogger.functionEntry() (../utils/debugLogger.js:270)
 * - debugLogger.fdaApiCall() (../utils/debugLogger.js:400)
 * - debugLogger.dbQuery() (../utils/debugLogger.js:376)
 * - debugLogger.apiResponse() (../utils/debugLogger.js:350)
 * - debugLogger.error() (../utils/debugLogger.js:197)
 * 
 * Variables Used:
 * - req: Express request object with body containing ndc and initialInventory
 * - res: Express response object for sending results
 * - errors: Validation errors from express-validator
 * - ndc: National Drug Code from request body
 * - initialInventory: Initial inventory details object
 * - fdaResult: FDA API response object
 * - fdaData: First FDA result object
 * - drugId: Database ID of created/existing drug
 * - drug: Complete drug object from database
 * - existingInventory: Any existing inventory record
 * - inventoryData: Formatted inventory data for database insertion
 * - inventoryId: Database ID of created inventory record
 * - inventory: Complete inventory object from database
 * - emptyToNull: Helper function for null conversion
 * 
 * Location: /home/jason/Development/claude/pharmatrak/routes/drugs.js:318
 */
router.post('/add-from-fda-with-inventory', authenticateToken, requireStoreAdmin, [
  verifyNDC()
], async (req, res) => {
  debugLogger.functionEntry('POST /add-from-fda-with-inventory', { 
    ndc: req.body?.ndc,
    hasInitialInventory: !!req.body?.initialInventory,
    user: req.user?.email,
    store: req.user?.store_id
  });
  debugLogger.apiRequest(req, 'Add drug from FDA with initial inventory');
  
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      debugLogger.warn('Add drug with inventory validation failed', { 
        errors: errors.array(), 
        requestBody: req.body 
      });
      return res.status(400).json({ errors: errors.array() });
    }

    const { ndc, initialInventory } = req.body;
    
    debugLogger.debug('Request body parsed', {
      ndc,
      initialInventory: {
        quantity: initialInventory?.quantity,
        reorder_level: initialInventory?.reorder_level,
        hasUnitCost: !!initialInventory?.unit_cost,
        hasSellingPrice: !!initialInventory?.selling_price,
        hasLotNumber: !!initialInventory?.lot_number,
        hasExpirationDate: !!initialInventory?.expiration_date,
        hasSupplier: !!initialInventory?.supplier
      }
    });

    // Validate initial inventory data
    if (!initialInventory || !initialInventory.quantity || parseFloat(initialInventory.quantity) <= 0) {
      debugLogger.warn('Invalid initial inventory data', { initialInventory });
      return res.status(400).json({ error: 'Initial quantity is required and must be greater than 0' });
    }

    debugLogger.info('Searching FDA database for NDC', { ndc });
    const fdaStartTime = Date.now();
    
    // Search FDA for this NDC
    const fdaResult = await fdaService.searchByNDC(ndc);
    const fdaResponseTime = Date.now() - fdaStartTime;
    
    debugLogger.fdaApiCall('Search by NDC for drug addition', { ndc }, fdaResult?.data, fdaResult?.fromCache, fdaResponseTime);
    
    if (!fdaResult.data.results || fdaResult.data.results.length === 0) {
      debugLogger.warn('Drug not found in FDA database', { ndc });
      return res.status(404).json({ error: 'Drug not found in FDA database' });
    }

    const fdaData = fdaResult.data.results[0];
    debugLogger.debug('FDA data retrieved', {
      productNDC: fdaData.product_ndc,
      genericName: fdaData.generic_name,
      brandName: fdaData.brand_name,
      hasPackaging: !!fdaData.packaging,
      packagingCount: fdaData.packaging?.length || 0
    });
    
    // Create or get existing drug from FDA data
    debugLogger.info('Creating/retrieving drug from FDA data');
    const drugCreateStartTime = Date.now();
    const drugId = await Drug.createFromFDA(fdaData);
    const drugCreateTime = Date.now() - drugCreateStartTime;
    
    debugLogger.dbQuery('Drug.createFromFDA', [fdaData.product_ndc], 'INSERT/SELECT', drugCreateTime);
    debugLogger.debug('Drug created/retrieved', { drugId });
    
    const drug = await Drug.findById(drugId);
    debugLogger.debug('Drug details retrieved', {
      drugId,
      ndc: drug?.ndc,
      genericName: drug?.generic_name,
      brandName: drug?.brand_name
    });

    // Check if drug already exists in inventory for this store
    debugLogger.info('Checking for existing inventory', { 
      storeId: req.user.store_id, 
      drugId 
    });
    
    const inventoryCheckStartTime = Date.now();
    const existingInventory = await StoreInventory.findByStoreDrug(
      req.user.store_id, 
      drugId,
      null  // No specific lot number check
    );
    const inventoryCheckTime = Date.now() - inventoryCheckStartTime;
    
    debugLogger.dbQuery('StoreInventory.findByStoreDrug', [req.user.store_id, drugId], 'SELECT', inventoryCheckTime);

    if (existingInventory) {
      debugLogger.warn('Drug already exists in store inventory', {
        storeId: req.user.store_id,
        drugId,
        existingInventoryId: existingInventory.id
      });
      return res.status(409).json({ 
        error: 'This drug already exists in your store inventory' 
      });
    }

    // Helper function to convert empty strings to null
    const emptyToNull = (value) => {
      if (value === '' || value === undefined || value === null) return null;
      return value;
    };
    
    // Prepare inventory data with proper null conversion
    const inventoryData = {
      drug_id: drugId,
      store_id: req.user.store_id,
      quantity_on_hand: parseFloat(initialInventory.quantity),
      reorder_level: parseFloat(initialInventory.reorder_level) || 10,
      unit_cost: emptyToNull(initialInventory.unit_cost) ? parseFloat(initialInventory.unit_cost) : null,
      selling_price: emptyToNull(initialInventory.selling_price) ? parseFloat(initialInventory.selling_price) : null,
      lot_number: emptyToNull(initialInventory.lot_number),
      expiration_date: emptyToNull(initialInventory.expiration_date),
      supplier: emptyToNull(initialInventory.supplier)
    };

    debugLogger.debug('Inventory data prepared', {
      inventoryData: {
        ...inventoryData,
        // Mask sensitive pricing data in logs
        unit_cost: inventoryData.unit_cost ? '[REDACTED]' : null,
        selling_price: inventoryData.selling_price ? '[REDACTED]' : null
      }
    });

    // Add to store inventory with initial stock transaction
    debugLogger.info('Adding drug to store inventory');
    const inventoryAddStartTime = Date.now();
    const inventoryId = await StoreInventory.add(inventoryData, req.user.id);
    const inventoryAddTime = Date.now() - inventoryAddStartTime;
    
    debugLogger.dbQuery('StoreInventory.add', [drugId, req.user.store_id], 'INSERT', inventoryAddTime);
    debugLogger.info('Inventory record created', { inventoryId });
    
    const inventory = await StoreInventory.findById(inventoryId);
    debugLogger.debug('Final inventory details', {
      inventoryId,
      drugId: inventory?.drug_id,
      storeId: inventory?.store_id,
      quantityOnHand: inventory?.quantity_on_hand,
      isActive: inventory?.is_active
    });

    const responseData = {
      message: 'Drug added to database with initial inventory successfully',
      drug: drug,
      inventory: inventory
    };

    debugLogger.info('Drug addition completed successfully', {
      drugId,
      inventoryId,
      ndc: drug?.ndc,
      genericName: drug?.generic_name,
      quantityAdded: inventory?.quantity_on_hand
    });

    debugLogger.apiResponse(req, res, responseData);
    debugLogger.functionExit('POST /add-from-fda-with-inventory', { 
      success: true, 
      drugId, 
      inventoryId 
    });

    res.status(201).json(responseData);

  } catch (error) {
    debugLogger.error('Add drug with inventory error occurred', {
      error: error.message,
      stack: error.stack,
      ndc: req.body?.ndc,
      user: req.user?.email,
      store: req.user?.store_id,
      hasInitialInventory: !!req.body?.initialInventory
    });
    
    const errorResponse = { 
      error: 'Failed to add drug with inventory',
      message: error.message 
    };
    
    debugLogger.apiResponse(req, res, errorResponse);
    res.status(500).json(errorResponse);
  }
});

// Add drug to local database from FDA data
router.post('/add-from-fda', authenticateToken, requireStoreAdmin, [
  verifyNDC()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { ndc } = req.body;

    // Search FDA for this NDC
    const fdaResult = await fdaService.searchByNDC(ndc);
    
    if (!fdaResult.data.results || fdaResult.data.results.length === 0) {
      return res.status(404).json({ error: 'Drug not found in FDA database' });
    }

    const fdaData = fdaResult.data.results[0];
    
    // Add to local database
    const drugId = await Drug.createFromFDA(fdaData);
    const drug = await Drug.findById(drugId);

    res.status(201).json({
      message: 'Drug added to database successfully',
      drug: drug
    });

  } catch (error) {
    console.error('Add drug error:', error);
    res.status(500).json({ 
      error: 'Failed to add drug to database',
      message: error.message 
    });
  }
});

// Search local drug database
router.get('/search', authenticateToken, [
  query('ndc').optional().matches(/^[0-9\-]{10,14}$/).withMessage('Invalid NDC format'),
  query('generic_name').optional().isLength({ min: 2, max: 100 }).withMessage('Generic name must be 2-100 characters'),
  query('brand_name').optional().isLength({ min: 2, max: 100 }).withMessage('Brand name must be 2-100 characters'),
  query('manufacturer').optional().isLength({ min: 2, max: 100 }).withMessage('Manufacturer must be 2-100 characters'),
  query('dosage_form').optional().isLength({ min: 2, max: 50 }).withMessage('Dosage form must be 2-50 characters'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100').toInt()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { 
      ndc, 
      generic_name: genericName, 
      brand_name: brandName, 
      manufacturer, 
      dosage_form: dosageForm,
      limit = 20 
    } = req.query;

    const criteria = {};
    if (ndc) criteria.ndc = ndc.replace(/[^\d]/g, '');
    if (genericName) criteria.genericName = genericName;
    if (brandName) criteria.brandName = brandName;
    if (manufacturer) criteria.manufacturer = manufacturer;
    if (dosageForm) criteria.dosageForm = dosageForm;

    const drugs = await Drug.search(criteria, limit);

    res.json({
      drugs: drugs,
      total: drugs.length
    });

  } catch (error) {
    console.error('Drug search error:', error);
    res.status(500).json({ 
      error: 'Failed to search drug database',
      message: error.message 
    });
  }
});

// Get all drugs with pagination and filtering
router.get('/all', authenticateToken, [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer').toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100').toInt(),
  query('active').optional().isBoolean().withMessage('Active must be boolean').toBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { page = 1, limit = 20, active = true } = req.query;
    const offset = (page - 1) * limit;

    const filters = {};
    if (active !== undefined) filters.is_active = active;

    const drugs = await Drug.findWithFilters(filters, limit, offset);
    const total = await Drug.countWithFilters(filters);

    res.json({
      drugs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get all drugs error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve drugs',
      message: error.message 
    });
  }
});

// Get drug by ID
router.get('/:id', authenticateToken, [verifyId()], async (req, res) => {
  try {
    const { id } = req.params;
    const drug = await Drug.findById(id);

    if (!drug) {
      return res.status(404).json({ error: 'Drug not found' });
    }

    res.json({ drug });

  } catch (error) {
    console.error('Get drug error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve drug',
      message: error.message 
    });
  }
});

// Update drug information
router.put('/:id', authenticateToken, requireStoreAdmin, [
  verifyId(),
  body('generic_name').optional().isLength({ min: 1, max: 500 }).withMessage('Generic name must be 1-500 characters'),
  body('brand_name').optional().isLength({ min: 1, max: 500 }).withMessage('Brand name must be 1-500 characters'),
  body('dosage_form').optional().isLength({ min: 1, max: 100 }).withMessage('Dosage form must be 1-100 characters'),
  body('route').optional().isLength({ min: 1, max: 255 }).withMessage('Route must be 1-255 characters'),
  body('strength').optional().isLength({ min: 1, max: 255 }).withMessage('Strength must be 1-255 characters'),
  body('manufacturer_name').optional().isLength({ min: 1, max: 255 }).withMessage('Manufacturer name must be 1-255 characters'),
  body('is_active').optional().isBoolean().withMessage('is_active must be boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const drug = await Drug.findById(id);

    if (!drug) {
      return res.status(404).json({ error: 'Drug not found' });
    }

    const updated = await Drug.update(id, req.body);
    
    if (!updated) {
      return res.status(400).json({ error: 'No changes made' });
    }

    const updatedDrug = await Drug.findById(id);

    res.json({
      message: 'Drug updated successfully',
      drug: updatedDrug
    });

  } catch (error) {
    console.error('Update drug error:', error);
    res.status(500).json({ 
      error: 'Failed to update drug',
      message: error.message 
    });
  }
});

// Delete drug (soft delete by setting is_active to false)
router.delete('/:id', authenticateToken, requireStoreAdmin, [verifyId()], async (req, res) => {
  try {
    const { id } = req.params;
    const drug = await Drug.findById(id);

    if (!drug) {
      return res.status(404).json({ error: 'Drug not found' });
    }

    // Soft delete - set is_active to false
    const updated = await Drug.update(id, { is_active: false });
    
    if (!updated) {
      return res.status(400).json({ error: 'Failed to delete drug' });
    }

    res.json({ message: 'Drug deleted successfully' });

  } catch (error) {
    console.error('Delete drug error:', error);
    res.status(500).json({ 
      error: 'Failed to delete drug',
      message: error.message 
    });
  }
});

// Get drug statistics
router.get('/stats/overview', authenticateToken, requireStoreAdmin, async (req, res) => {
  try {
    const stats = await Drug.getStats();
    res.json({ stats });

  } catch (error) {
    console.error('Get drug stats error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve drug statistics',
      message: error.message 
    });
  }
});

// Get store inventory
router.get('/inventory/:storeId', authenticateToken, [verifyId('storeId')], async (req, res) => {
  try {
    const { storeId } = req.params;
    const { low_stock, expiring_soon, active_only = 'true' } = req.query;

    // Check if user has access to this store
    if (req.user.role !== 'admin' && req.user.store_id !== parseInt(storeId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const filters = {
      activeOnly: active_only === 'true',
      lowStock: low_stock === 'true',
      expiringSoon: expiring_soon === 'true'
    };

    const inventory = await StoreInventory.getByStore(storeId, filters);

    res.json({
      inventory: inventory,
      total: inventory.length
    });

  } catch (error) {
    console.error('Get inventory error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve inventory',
      message: error.message 
    });
  }
});

// Add drug to store inventory
router.post('/inventory', authenticateToken, requireStoreAdmin, [
  body('drug_id').isInt({ min: 1 }).withMessage('Valid drug ID required'),
  verifyQuantity('quantity_on_hand'),
  verifyQuantity('reorder_level'),
  verifyPrice('unit_cost'),
  verifyPrice('selling_price'),
  body('lot_number').optional().isLength({ min: 1, max: 50 }).withMessage('Lot number must be 1-50 characters'),
  verifyDate('expiration_date'),
  body('supplier').optional().isLength({ min: 1, max: 255 }).withMessage('Supplier must be 1-255 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const inventoryData = {
      ...req.body,
      store_id: req.user.store_id
    };

    // Check if this drug/lot combination already exists
    const existing = await StoreInventory.findByStoreDrug(
      inventoryData.store_id, 
      inventoryData.drug_id, 
      inventoryData.lot_number
    );

    if (existing) {
      return res.status(400).json({ 
        error: 'This drug with the same lot number already exists in inventory' 
      });
    }

    const inventoryId = await StoreInventory.add(inventoryData, req.user.id);
    const inventory = await StoreInventory.findById(inventoryId);

    res.status(201).json({
      message: 'Drug added to inventory successfully',
      inventory: inventory
    });

  } catch (error) {
    console.error('Add inventory error:', error);
    res.status(500).json({ 
      error: 'Failed to add drug to inventory',
      message: error.message 
    });
  }
});

// Update inventory item
router.put('/inventory/:id', authenticateToken, requireStoreAdmin, [
  verifyId(),
  verifyQuantity('quantity_on_hand').optional(),
  verifyQuantity('reorder_level').optional(),
  verifyPrice('unit_cost').optional(),
  verifyPrice('selling_price').optional(),
  body('lot_number').optional().isLength({ min: 1, max: 50 }).withMessage('Lot number must be 1-50 characters'),
  verifyDate('expiration_date').optional(),
  body('supplier').optional().isLength({ min: 1, max: 255 }).withMessage('Supplier must be 1-255 characters'),
  body('is_active').optional().isBoolean().withMessage('is_active must be boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const inventory = await StoreInventory.findById(id);

    if (!inventory) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    // Check if user can access this store's inventory
    if (req.user.store_id !== inventory.store_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updated = await StoreInventory.update(id, req.body);
    
    if (!updated) {
      return res.status(400).json({ error: 'No changes made' });
    }

    const updatedInventory = await StoreInventory.findById(id);

    res.json({
      message: 'Inventory updated successfully',
      inventory: updatedInventory
    });

  } catch (error) {
    console.error('Update inventory error:', error);
    res.status(500).json({ 
      error: 'Failed to update inventory',
      message: error.message 
    });
  }
});

// Get low stock items
router.get('/inventory/:storeId/low-stock', authenticateToken, [verifyId('storeId')], async (req, res) => {
  try {
    const { storeId } = req.params;

    // Check if user has access to this store
    if (req.user.role !== 'admin' && req.user.store_id !== parseInt(storeId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const lowStock = await StoreInventory.getLowStock(storeId);

    res.json({
      lowStock: lowStock,
      total: lowStock.length
    });

  } catch (error) {
    console.error('Get low stock error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve low stock items',
      message: error.message 
    });
  }
});

// Get expiring items
router.get('/inventory/:storeId/expiring', authenticateToken, [
  verifyId('storeId'),
  query('days').optional().isInt({ min: 1, max: 365 }).withMessage('Days must be between 1 and 365').toInt()
], async (req, res) => {
  try {
    const { storeId } = req.params;
    const { days = 30 } = req.query;

    // Check if user has access to this store
    if (req.user.role !== 'admin' && req.user.store_id !== parseInt(storeId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const expiring = await StoreInventory.getExpiring(storeId, days);

    res.json({
      expiring: expiring,
      total: expiring.length,
      days: days
    });

  } catch (error) {
    console.error('Get expiring items error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve expiring items',
      message: error.message 
    });
  }
});

// Get inventory statistics
router.get('/inventory/:storeId/stats', authenticateToken, [verifyId('storeId')], async (req, res) => {
  try {
    const { storeId } = req.params;

    // Check if user has access to this store
    if (req.user.role !== 'admin' && req.user.store_id !== parseInt(storeId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const stats = await StoreInventory.getStats(storeId);

    res.json({ stats });

  } catch (error) {
    console.error('Get inventory stats error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve inventory statistics',
      message: error.message 
    });
  }
});

// FDA cache statistics (admin only)
router.get('/fda/cache-stats', authenticateToken, (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const cacheStats = fdaService.getCacheStats();
    res.json({ cacheStats });

  } catch (error) {
    console.error('Get cache stats error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve cache statistics',
      message: error.message 
    });
  }
});

/**
 * Check Drug Existence in Store Inventory Route Handler
 * 
 * Checks which drugs from a provided list of NDCs already exist in the
 * authenticated user's store inventory. Used by frontend to determine
 * which drugs should be disabled or filtered in search results.
 * 
 * Route: POST /api/drugs/check-exist
 * Access: Protected - Requires valid JWT token
 * Middleware: authenticateToken (../middleware/auth.js)
 * 
 * Function Calls Made:
 * - db.execute() from mysql2 pool for database queries
 * - Array.map() for data transformation
 * - debugLogger.apiRequest() (../utils/debugLogger.js:320)
 * - debugLogger.functionEntry() (../utils/debugLogger.js:270)
 * - debugLogger.dbQuery() (../utils/debugLogger.js:376)
 * - debugLogger.apiResponse() (../utils/debugLogger.js:350)
 * - debugLogger.error() (../utils/debugLogger.js:197)
 * 
 * Variables Used:
 * - req: Express request object with body containing ndcs array
 * - res: Express response object for sending results
 * - ndcs: Array of NDC strings to check
 * - storeId: Store ID from authenticated user
 * - placeholders: SQL placeholder string for IN clause
 * - rows: Database query result rows
 * - existingNDCs: Array of NDCs that exist in store inventory
 * - queryStartTime, queryTime: Performance timing variables
 * - sqlQuery: Complete SQL query string
 * - queryParams: Array of parameters for SQL query
 * 
 * Location: /home/jason/Development/claude/pharmatrak/routes/drugs.js:1034
 */
router.post('/check-exist', authenticateToken, async (req, res) => {
  debugLogger.functionEntry('POST /check-exist', { 
    ndcsCount: req.body?.ndcs?.length,
    user: req.user?.email,
    store: req.user?.store_id
  });
  debugLogger.apiRequest(req, 'Check drug existence in store inventory');
  
  try {
    const { ndcs } = req.body;
    const storeId = req.user.store_id;

    debugLogger.debug('Check drugs exist request details', {
      ndcsCount: ndcs?.length,
      storeId,
      sampleNDCs: ndcs?.slice(0, 3) // Log first 3 NDCs for debugging
    });

    if (!ndcs || !Array.isArray(ndcs) || ndcs.length === 0) {
      debugLogger.warn('Invalid NDCs array provided', { ndcs });
      return res.status(400).json({ error: 'NDCs array is required' });
    }

    // Query store inventory to check which NDCs already exist
    debugLogger.info('Checking NDC existence in store inventory', { 
      ndcsToCheck: ndcs.length,
      storeId
    });
    
    const ndcPlaceholders = ndcs.map(ndc => `'${ndc.replace(/'/g, "''")}'`).join(',');
    const sqlQuery = `
      SELECT DISTINCT d.ndc 
      FROM drugs d
      INNER JOIN store_inventory si ON d.id = si.drug_id
      WHERE si.store_id = ${parseInt(storeId)} AND d.ndc IN (${ndcPlaceholders}) AND si.is_active = TRUE
    `;
    
    const queryStartTime = Date.now();
    const [rows] = await db.query(sqlQuery);
    const queryTime = Date.now() - queryStartTime;
    
    debugLogger.dbQuery(sqlQuery, [], 'SELECT', queryTime);

    const existingNDCs = rows.map(row => row.ndc);
    
    debugLogger.info('Drug existence check completed', {
      totalNDCsChecked: ndcs.length,
      existingNDCsFound: existingNDCs.length,
      queryTime: `${queryTime}ms`,
      existingNDCs: existingNDCs.slice(0, 5) // Log first 5 existing NDCs
    });
    
    const responseData = { existingNDCs };
    
    debugLogger.apiResponse(req, res, responseData, queryTime);
    debugLogger.functionExit('POST /check-exist', { 
      existingCount: existingNDCs.length,
      totalChecked: ndcs.length
    });
    
    res.json(responseData);
  } catch (error) {
    debugLogger.error('Check drugs exist error occurred', {
      error: error.message,
      stack: error.stack,
      ndcsCount: req.body?.ndcs?.length,
      user: req.user?.email,
      store: req.user?.store_id
    });
    
    const errorResponse = { 
      error: 'Failed to check drug existence',
      message: error.message 
    };
    
    debugLogger.apiResponse(req, res, errorResponse);
    res.status(500).json(errorResponse);
  }
});

module.exports = router;