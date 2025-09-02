/**
 * Drug Shortages API Routes
 * 
 * Handles FDA OpenFDA drug shortages API integration with support for:
 * - Package NDC search
 * - Generic name search
 * - Brand/proprietary name search
 * - Advanced multi-criteria search
 * 
 * Uses OpenFDA drug/drugshortages.json endpoint
 */

const express = require('express');
const router = express.Router();
const { body, query, validationResult } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const fdaService = require('../openfda/fdaService');

// Middleware to validate request parameters
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

/**
 * @swagger
 * components:
 *   schemas:
 *     DrugShortage:
 *       type: object
 *       properties:
 *         product_info:
 *           type: object
 *           properties:
 *             generic_name:
 *               type: string
 *               description: Generic name of the drug
 *             proprietary_name:
 *               type: string
 *               description: Brand/proprietary name of the drug
 *             company_name:
 *               type: string
 *               description: Manufacturing company name
 *             package_ndc:
 *               type: string
 *               description: Package NDC code
 *             dosage_form:
 *               type: string
 *               description: Dosage form (tablet, capsule, etc.)
 *             strength:
 *               type: string
 *               description: Drug strength
 *             therapeutic_category:
 *               type: string
 *               description: Therapeutic category
 *         shortage_info:
 *           type: object
 *           properties:
 *             status:
 *               type: string
 *               description: Current shortage status
 *             availability:
 *               type: string
 *               description: Current availability information
 *             shortage_reason:
 *               type: string
 *               description: Reason for the shortage
 *             initial_posting_date:
 *               type: string
 *               description: Date when shortage was first reported
 *             update_date:
 *               type: string
 *               description: Last update date
 *         summary:
 *           type: object
 *           properties:
 *             drug_name:
 *               type: string
 *               description: Primary drug name
 *             manufacturer:
 *               type: string
 *               description: Manufacturer name
 *             current_status:
 *               type: string
 *               description: Current shortage status
 *             is_resolved:
 *               type: boolean
 *               description: Whether shortage is resolved
 */

/**
 * @swagger
 * /api/drug-shortages/package-ndc/{ndc}:
 *   get:
 *     summary: Search drug shortages by package NDC
 *     tags: [Drug Shortages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ndc
 *         required: true
 *         schema:
 *           type: string
 *         description: Package NDC number (with or without dashes)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Maximum number of results to return
 *     responses:
 *       200:
 *         description: Drug shortages found successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/DrugShortage'
 *                 fromCache:
 *                   type: boolean
 *                 searchInfo:
 *                   type: object
 *       404:
 *         description: No drug shortages found for the given NDC
 *       400:
 *         description: Invalid NDC format
 */
router.get('/package-ndc/:ndc', authenticateToken, [
  query('limit').optional().isInt({ min: 1, max: 100 })
], validateRequest, async (req, res) => {
  try {
    const { ndc } = req.params;
    const limit = parseInt(req.query.limit) || 10;

    console.log(`🔍 Drug Shortages Package NDC API Request: "${ndc}" (limit: ${limit})`);
    console.log(`👤 Requested by user: ${req.user.email} (ID: ${req.user.id})`);

    // Search for drug shortages by package NDC
    const result = await fdaService.searchShortagesByPackageNDC(ndc, limit);
    
    // Parse the results for better structure
    const parsedData = fdaService.parseShortagesData(result.data);

    console.log(`✅ Drug Shortages Package NDC API Success: Found ${parsedData?.length || 0} results`);

    res.json({
      success: true,
      data: parsedData,
      fromCache: result.fromCache,
      searchInfo: result.searchInfo,
      meta: {
        total_results: result.data.results?.length || 0,
        search_type: 'package_ndc',
        search_term: ndc,
        limit: limit
      }
    });
  } catch (error) {
    console.error('Drug Shortages Package NDC API Error:', error);
    
    if (error.message.includes('No drug shortages found')) {
      return res.status(404).json({
        success: false,
        message: `No drug shortages found for package NDC: ${req.params.ndc}`,
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error searching drug shortages by package NDC',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/drug-shortages/generic/{genericName}:
 *   get:
 *     summary: Search drug shortages by generic name
 *     tags: [Drug Shortages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: genericName
 *         required: true
 *         schema:
 *           type: string
 *         description: Generic drug name
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Maximum number of results to return
 *     responses:
 *       200:
 *         description: Drug shortages found successfully
 *       404:
 *         description: No drug shortages found for the given generic name
 */
router.get('/generic/:genericName', authenticateToken, [
  query('limit').optional().isInt({ min: 1, max: 100 })
], validateRequest, async (req, res) => {
  try {
    const { genericName } = req.params;
    const limit = parseInt(req.query.limit) || 10;

    console.log(`🔍 Drug Shortages Generic Name API Request: "${genericName}" (limit: ${limit})`);
    console.log(`👤 Requested by user: ${req.user.email} (ID: ${req.user.id})`);

    // Search for drug shortages by generic name
    const result = await fdaService.searchShortagesByGenericName(genericName, limit);
    
    // Parse the results for better structure
    const parsedData = fdaService.parseShortagesData(result.data);

    console.log(`✅ Drug Shortages Generic Name API Success: Found ${parsedData?.length || 0} results`);

    res.json({
      success: true,
      data: parsedData,
      fromCache: result.fromCache,
      searchInfo: result.searchInfo,
      meta: {
        total_results: result.data.results?.length || 0,
        search_type: 'generic_name',
        search_term: genericName,
        limit: limit
      }
    });
  } catch (error) {
    console.error('Drug Shortages Generic Name API Error:', error);
    
    if (error.message.includes('No drug shortages found')) {
      return res.status(404).json({
        success: false,
        message: `No drug shortages found for generic name: ${req.params.genericName}`,
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error searching drug shortages by generic name',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/drug-shortages/brand/{brandName}:
 *   get:
 *     summary: Search drug shortages by brand name
 *     tags: [Drug Shortages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: brandName
 *         required: true
 *         schema:
 *           type: string
 *         description: Brand/proprietary drug name
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Maximum number of results to return
 *     responses:
 *       200:
 *         description: Drug shortages found successfully
 *       404:
 *         description: No drug shortages found for the given brand name
 */
router.get('/brand/:brandName', authenticateToken, [
  query('limit').optional().isInt({ min: 1, max: 100 })
], validateRequest, async (req, res) => {
  try {
    const { brandName } = req.params;
    const limit = parseInt(req.query.limit) || 10;

    console.log(`🔍 Drug Shortages Brand Name API Request: "${brandName}" (limit: ${limit})`);
    console.log(`👤 Requested by user: ${req.user.email} (ID: ${req.user.id})`);

    // Search for drug shortages by brand name
    const result = await fdaService.searchShortagesByBrandName(brandName, limit);
    
    // Parse the results for better structure
    const parsedData = fdaService.parseShortagesData(result.data);

    console.log(`✅ Drug Shortages Brand Name API Success: Found ${parsedData?.length || 0} results`);

    res.json({
      success: true,
      data: parsedData,
      fromCache: result.fromCache,
      searchInfo: result.searchInfo,
      meta: {
        total_results: result.data.results?.length || 0,
        search_type: 'brand_name',
        search_term: brandName,
        limit: limit
      }
    });
  } catch (error) {
    console.error('Drug Shortages Brand Name API Error:', error);
    
    if (error.message.includes('No drug shortages found')) {
      return res.status(404).json({
        success: false,
        message: `No drug shortages found for brand name: ${req.params.brandName}`,
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error searching drug shortages by brand name',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/drug-shortages/search:
 *   post:
 *     summary: Advanced drug shortages search with multiple criteria
 *     tags: [Drug Shortages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               packageNDC:
 *                 type: string
 *                 description: Package NDC number
 *               genericName:
 *                 type: string
 *                 description: Generic drug name
 *               brandName:
 *                 type: string
 *                 description: Brand/proprietary drug name
 *               status:
 *                 type: string
 *                 description: Shortage status
 *               therapeuticCategory:
 *                 type: string
 *                 description: Therapeutic category
 *               limit:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 100
 *                 default: 10
 *                 description: Maximum number of results
 *     responses:
 *       200:
 *         description: Drug shortages found successfully
 *       400:
 *         description: At least one search criterion is required
 */
router.post('/search', authenticateToken, [
  body('packageNDC').optional().isString(),
  body('genericName').optional().isString(),
  body('brandName').optional().isString(),
  body('status').optional().isString(),
  body('therapeuticCategory').optional().isString(),
  body('limit').optional().isInt({ min: 1, max: 100 })
], validateRequest, async (req, res) => {
  try {
    const { packageNDC, genericName, brandName, status, therapeuticCategory, limit = 10 } = req.body;

    // At least one search criterion is required
    if (!packageNDC && !genericName && !brandName && !status && !therapeuticCategory) {
      return res.status(400).json({
        success: false,
        message: 'At least one search criterion is required',
        availableCriteria: ['packageNDC', 'genericName', 'brandName', 'status', 'therapeuticCategory']
      });
    }

    console.log(`🔍 Advanced Drug Shortages Search API Request:`);
    console.log(`   📋 Criteria:`, { packageNDC, genericName, brandName, status, therapeuticCategory, limit });
    console.log(`   👤 Requested by user: ${req.user.email} (ID: ${req.user.id})`);

    // Perform advanced search
    const criteria = { packageNDC, genericName, brandName, status, therapeuticCategory };
    const result = await fdaService.advancedShortagesSearch(criteria, limit);
    
    // Parse the results for better structure
    const parsedData = fdaService.parseShortagesData(result.data);

    console.log(`✅ Advanced Drug Shortages Search API Success: Found ${parsedData?.length || 0} results`);

    res.json({
      success: true,
      data: parsedData,
      fromCache: result.fromCache,
      searchInfo: result.searchInfo,
      meta: {
        total_results: result.data.results?.length || 0,
        search_type: 'advanced_multi_criteria',
        search_criteria: criteria,
        limit: limit
      }
    });
  } catch (error) {
    console.error('Advanced Drug Shortages Search API Error:', error);
    
    if (error.message.includes('No drug shortages found')) {
      return res.status(404).json({
        success: false,
        message: 'No drug shortages found matching the search criteria',
        searchCriteria: req.body,
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error performing advanced drug shortages search',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/drug-shortages/status:
 *   get:
 *     summary: Get drug shortages service status and statistics
 *     tags: [Drug Shortages]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Service status and statistics
 */
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const cacheStats = fdaService.getCacheStats();
    
    res.json({
      success: true,
      service: 'Drug Shortages API',
      status: 'operational',
      endpoints: {
        'package-ndc': '/api/drug-shortages/package-ndc/{ndc}',
        'generic': '/api/drug-shortages/generic/{genericName}',
        'brand': '/api/drug-shortages/brand/{brandName}',
        'search': '/api/drug-shortages/search',
      },
      features: [
        'Package NDC search with multiple format support',
        'Generic name search with fuzzy matching',
        'Brand/proprietary name search',
        'Advanced multi-criteria search',
        'Intelligent caching system',
        'Structured data parsing'
      ],
      cache_stats: cacheStats,
      api_info: {
        data_source: 'FDA OpenFDA Drug Shortages API',
        endpoint: 'https://api.fda.gov/drug/drugshortages.json',
        fields_supported: ['package_ndc', 'generic_name', 'proprietary_name', 'status', 'therapeutic_category']
      }
    });
  } catch (error) {
    console.error('Drug Shortages Status Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving drug shortages service status',
      error: error.message
    });
  }
});

module.exports = router;