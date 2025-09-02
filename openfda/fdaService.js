/**
 * FDA OpenFDA API Service
 * 
 * Comprehensive service for interacting with the FDA's OpenFDA API.
 * Provides drug database search functionality with intelligent caching,
 * error handling, and data transformation capabilities.
 * 
 * Features:
 * - Multiple search methods (NDC, generic name, brand name, manufacturer)
 * - Intelligent response caching with TTL management
 * - Comprehensive error handling with user-friendly messages
 * - Request timeout protection
 * - NDC validation and formatting utilities
 * - Performance monitoring and analytics
 * 
 * API Integration:
 * - Uses FDA's OpenFDA drug/ndc.json endpoint
 * - Handles rate limiting and service availability
 * - Transforms raw FDA data to standardized format
 * - Supports complex search queries with multiple criteria
 * 
 * Caching Strategy:
 * - 1-hour TTL for search results
 * - Automatic cache cleanup every 10 minutes
 * - Cache key generation based on search parameters
 * - Memory-efficient with automatic expiration
 * 
 * @class FDAService
 * @requires axios - HTTP client for API requests
 * @requires node-cache - In-memory caching system
 * 
 * @author PharmaTraK Development Team
 * @version 2.0.0
 * @since 1.0.0
 */

const axios = require('axios');
const NodeCache = require('node-cache');

class FDAService {
  /**
   * Initialize FDA Service with configuration
   * Sets up API endpoint, caching system, and request timeouts
   * 
   * @constructor
   */
  constructor() {
    /** @type {string} Base URL for FDA OpenFDA API */
    this.baseURL = 'https://api.fda.gov/drug/ndc.json';
    
    /** @type {string} Base URL for FDA Drug Shortages API */
    this.shortagesURL = 'https://api.fda.gov/drug/drugshortages.json';
    
    /** @type {string|null} OpenFDA API key for enhanced rate limits */
    this.apiKey = process.env.OPENFDA_API_KEY || null;
    
    /** 
     * @type {NodeCache} In-memory cache for API responses
     * Configuration:
     * - stdTTL: 3600 seconds (1 hour) - How long items stay in cache
     * - checkperiod: 600 seconds (10 minutes) - How often to clean expired items
     */
    this.cache = new NodeCache({ 
      stdTTL: 3600, // 1 hour cache
      checkperiod: 600 // check for expired keys every 10 minutes
    });
    
    /** @type {number} Request timeout in milliseconds */
    this.timeout = 10000; // 10 second timeout
    
    if (this.apiKey) {
      console.log('🔑 OpenFDA API key configured - Enhanced rate limits available');
    } else {
      console.log('⚠️  No OpenFDA API key - Using default rate limits (240 requests/hour)');
    }
  }

  /**
   * Build URL with API key parameter if available
   * @param {string} baseUrl - Base API URL
   * @returns {string} URL with api_key parameter if configured
   * @private
   */
  buildApiUrl(baseUrl) {
    if (this.apiKey) {
      const separator = baseUrl.includes('?') ? '&' : '?';
      return `${baseUrl}${separator}api_key=${this.apiKey}`;
    }
    return baseUrl;
  }

  /**
   * Make authenticated request to OpenFDA API
   * @param {string} url - API endpoint URL
   * @param {Object} options - Additional axios options
   * @returns {Promise} Axios response
   * @private
   */
  async makeApiRequest(url, options = {}) {
    const fullUrl = this.buildApiUrl(url);
    
    const defaultOptions = {
      timeout: this.timeout,
      headers: {
        'User-Agent': 'PharmaTraK/2.0'
      }
    };
    
    return axios.get(fullUrl, { ...defaultOptions, ...options });
  }

  /**
   * Generate comprehensive NDC format variations for improved search success
   * @param {string} cleanNDC - Clean NDC digits only
   * @returns {Array} Array of NDC format variations
   */
  generateNDCFormats(cleanNDC, originalFormat) {
    const formats = new Set(); // Use Set to avoid duplicates
    
    // 1. Always include original format first
    formats.add(originalFormat);
    
    // 2. Clean digits only
    formats.add(cleanNDC);
    
    // 3. Standard formatted version
    formats.add(this.formatNDC(cleanNDC));
    
    // 4. Comprehensive format variations based on length and patterns
    const len = cleanNDC.length;
    
    if (len >= 8) {
      // 8-digit variations (5-3, 4-4, 4-3-1)
      formats.add(`${cleanNDC.slice(0, 5)}-${cleanNDC.slice(5, 8)}`); // 5-3
      formats.add(`${cleanNDC.slice(0, 4)}-${cleanNDC.slice(4, 8)}`); // 4-4
      formats.add(`${cleanNDC.slice(0, 4)}-${cleanNDC.slice(4, 7)}-${cleanNDC.slice(7, 8)}`); // 4-3-1
    }
    
    if (len >= 9) {
      // 9-digit variations (5-3-1, 4-4-1, 5-4)
      formats.add(`${cleanNDC.slice(0, 5)}-${cleanNDC.slice(5, 8)}-${cleanNDC.slice(8, 9)}`); // 5-3-1
      formats.add(`${cleanNDC.slice(0, 4)}-${cleanNDC.slice(4, 8)}-${cleanNDC.slice(8, 9)}`); // 4-4-1
      formats.add(`${cleanNDC.slice(0, 5)}-${cleanNDC.slice(5, 9)}`); // 5-4
    }
    
    if (len >= 10) {
      // 10-digit variations (5-4-1, 4-4-2, 5-3-2)
      formats.add(`${cleanNDC.slice(0, 5)}-${cleanNDC.slice(5, 9)}-${cleanNDC.slice(9, 10)}`); // 5-4-1
      formats.add(`${cleanNDC.slice(0, 4)}-${cleanNDC.slice(4, 8)}-${cleanNDC.slice(8, 10)}`); // 4-4-2
      formats.add(`${cleanNDC.slice(0, 5)}-${cleanNDC.slice(5, 8)}-${cleanNDC.slice(8, 10)}`); // 5-3-2
    }
    
    if (len >= 11) {
      // 11-digit variations (5-4-2, 4-4-3, 5-3-3)
      formats.add(`${cleanNDC.slice(0, 5)}-${cleanNDC.slice(5, 9)}-${cleanNDC.slice(9, 11)}`); // 5-4-2
      formats.add(`${cleanNDC.slice(0, 4)}-${cleanNDC.slice(4, 8)}-${cleanNDC.slice(8, 11)}`); // 4-4-3
      formats.add(`${cleanNDC.slice(0, 5)}-${cleanNDC.slice(5, 8)}-${cleanNDC.slice(8, 11)}`); // 5-3-3
    }
    
    // 5. Zero-padded variations (very important for FDA database)
    const paddedNDC = cleanNDC.padStart(11, '0');
    if (paddedNDC !== cleanNDC) {
      formats.add(paddedNDC);
      formats.add(`${paddedNDC.slice(0, 5)}-${paddedNDC.slice(5, 9)}-${paddedNDC.slice(9, 11)}`); // Standard 11-digit format
      formats.add(`${paddedNDC.slice(0, 4)}-${paddedNDC.slice(4, 8)}-${paddedNDC.slice(8, 11)}`); // Alternative 11-digit format
    }
    
    // 6. Package-to-Product NDC conversion (remove last segment if 3 segments)
    if (originalFormat.includes('-')) {
      const segments = originalFormat.split('-');
      if (segments.length === 3) {
        // This might be a package NDC, try product NDC format
        formats.add(`${segments[0]}-${segments[1]}`);
      }
    }
    
    return Array.from(formats).filter(format => format && format.length >= 4);
  }

  /**
   * Search for drugs by NDC number with enhanced multi-strategy approach
   * @param {string} ndc - National Drug Code (format: 12345-678-90 or 1234567890)
   * @returns {Promise} FDA API response
   */
  async searchByNDC(ndc) {
    try {
      const cleanNDC = this.cleanNDC(ndc);
      const cacheKey = `ndc_${cleanNDC}`;
      
      // Check cache first
      const cachedResult = this.cache.get(cacheKey);
      if (cachedResult) {
        console.log(`🔍 NDC Cache HIT: "${ndc}" -> Found cached result`);
        return { data: cachedResult, fromCache: true };
      }

      console.log(`🔍 NDC Search Starting: "${ndc}"`);
      console.log(`   📋 Clean NDC: "${cleanNDC}"`);

      // Generate comprehensive format variations
      const searchFormats = this.generateNDCFormats(cleanNDC, ndc);
      console.log(`   📋 Generated ${searchFormats.length} NDC format variations`);

      let response = null;
      let lastError = null;
      let workingFormat = null;
      let workingField = null;

      // Strategy 1: Search product_ndc field with all formats
      console.log(`🎯 Strategy 1: Searching product_ndc field...`);
      for (const format of searchFormats) {
        try {
          console.log(`   📍 Trying product_ndc: "${format}"`);
          const searchUrl = `${this.baseURL}?search=${encodeURIComponent(`product_ndc:"${format}"`)}&limit=10`;
          response = await this.makeApiRequest(searchUrl);

          if (response.data.results && response.data.results.length > 0) {
            workingFormat = format;
            workingField = 'product_ndc';
            console.log(`   ✅ Found results with product_ndc: "${format}"`);
            break;
          }
        } catch (err) {
          lastError = err;
        }
      }

      // Strategy 2: If no results, try package_ndc field with all formats
      if (!response || !response.data.results || response.data.results.length === 0) {
        console.log(`🎯 Strategy 2: Searching package_ndc field...`);
        for (const format of searchFormats) {
          try {
            console.log(`   📍 Trying package_ndc: "${format}"`);
            const searchUrl = `${this.baseURL}?search=${encodeURIComponent(`package_ndc:"${format}"`)}&limit=10`;
            response = await this.makeApiRequest(searchUrl);

            if (response.data.results && response.data.results.length > 0) {
              workingFormat = format;
              workingField = 'package_ndc';
              console.log(`   ✅ Found results with package_ndc: "${format}"`);
              break;
            }
          } catch (err) {
            lastError = err;
          }
        }
      }

      // Strategy 3: If still no results, try partial matching on first segment
      if (!response || !response.data.results || response.data.results.length === 0) {
        console.log(`🎯 Strategy 3: Trying partial NDC matching...`);
        const firstSegment = cleanNDC.slice(0, 5).padStart(5, '0');
        try {
          console.log(`   📍 Trying partial match: "${firstSegment}*"`);
          const searchUrl = `${this.baseURL}?search=${encodeURIComponent(`product_ndc:${firstSegment}*`)}&limit=20`;
          response = await this.makeApiRequest(searchUrl);

          if (response.data.results && response.data.results.length > 0) {
            workingFormat = `${firstSegment}*`;
            workingField = 'product_ndc (partial)';
            console.log(`   ✅ Found results with partial matching: "${firstSegment}*"`);
          }
        } catch (err) {
          lastError = err;
        }
      }

      // If no results found with any strategy
      if (!response || !response.data.results || response.data.results.length === 0) {
        console.log(`❌ NDC Search FAILED: "${ndc}" - No results found with any strategy`);
        throw lastError || new Error('No drugs found matching the search criteria');
      }

      console.log(`✅ NDC Search SUCCESS: "${ndc}"`);
      console.log(`   🎯 Working format: "${workingFormat}"`);
      console.log(`   🏷️  Working field: ${workingField}`);
      console.log(`   📊 Results found: ${response.data.results.length}`);

      // Cache the result
      this.cache.set(cacheKey, response.data);
      
      return { 
        data: response.data, 
        fromCache: false,
        searchInfo: {
          workingFormat,
          workingField,
          strategiesAttempted: 3,
          totalFormatsAttempted: searchFormats.length
        }
      };
    } catch (error) {
      console.log(`❌ NDC Search ERROR: "${ndc}" - ${error.message}`);
      throw this.handleFDAError(error);
    }
  }

  /**
   * Search for drugs by generic name
   * @param {string} genericName - Generic drug name
   * @param {number} limit - Number of results to return (default: 10, max: 100)
   * @returns {Promise} FDA API response
   */
  async searchByGenericName(genericName, limit = 10) {
    try {
      const cacheKey = `generic_${genericName.toLowerCase()}_${limit}`;
      
      // Check cache first
      const cachedResult = this.cache.get(cacheKey);
      if (cachedResult) {
        return { data: cachedResult, fromCache: true };
      }

      const response = await axios.get(this.baseURL, {
        params: {
          search: `generic_name:${genericName}*`,
          limit: Math.min(limit, 100) // FDA API limit is 100
        },
        timeout: this.timeout,
        headers: {
          'User-Agent': 'PharmaTrack/1.0 (pharmacy management system)'
        }
      });

      // Cache the result
      this.cache.set(cacheKey, response.data);
      
      return { data: response.data, fromCache: false };
    } catch (error) {
      throw this.handleFDAError(error);
    }
  }

  /**
   * Search for drugs by brand name
   * @param {string} brandName - Brand/trade name
   * @param {number} limit - Number of results to return (default: 10, max: 100)
   * @returns {Promise} FDA API response
   */
  async searchByBrandName(brandName, limit = 10) {
    try {
      const cacheKey = `brand_${brandName.toLowerCase()}_${limit}`;
      
      // Check cache first
      const cachedResult = this.cache.get(cacheKey);
      if (cachedResult) {
        return { data: cachedResult, fromCache: true };
      }

      const response = await axios.get(this.baseURL, {
        params: {
          search: `brand_name:${brandName}*`,
          limit: Math.min(limit, 100)
        },
        timeout: this.timeout,
        headers: {
          'User-Agent': 'PharmaTrack/1.0 (pharmacy management system)'
        }
      });

      // Cache the result
      this.cache.set(cacheKey, response.data);
      
      return { data: response.data, fromCache: false };
    } catch (error) {
      throw this.handleFDAError(error);
    }
  }

  /**
   * Search for drugs by manufacturer
   * @param {string} manufacturer - Manufacturer name
   * @param {number} limit - Number of results to return (default: 10, max: 100)
   * @returns {Promise} FDA API response
   */
  async searchByManufacturer(manufacturer, limit = 10) {
    try {
      const cacheKey = `manufacturer_${manufacturer.toLowerCase()}_${limit}`;
      
      // Check cache first
      const cachedResult = this.cache.get(cacheKey);
      if (cachedResult) {
        return { data: cachedResult, fromCache: true };
      }

      const response = await axios.get(this.baseURL, {
        params: {
          search: `openfda.manufacturer_name:${manufacturer}*`,
          limit: Math.min(limit, 100)
        },
        timeout: this.timeout,
        headers: {
          'User-Agent': 'PharmaTrack/1.0 (pharmacy management system)'
        }
      });

      // Cache the result
      this.cache.set(cacheKey, response.data);
      
      return { data: response.data, fromCache: false };
    } catch (error) {
      throw this.handleFDAError(error);
    }
  }

  /**
   * Advanced search with multiple criteria
   * @param {Object} criteria - Search criteria
   * @param {string} criteria.ndc - NDC number
   * @param {string} criteria.genericName - Generic name
   * @param {string} criteria.brandName - Brand name
   * @param {string} criteria.manufacturer - Manufacturer
   * @param {number} limit - Number of results
   * @returns {Promise} FDA API response
   */
  async advancedSearch(criteria, limit = 10) {
    try {
      const searchTerms = [];
      
      if (criteria.ndc) {
        searchTerms.push(`product_ndc:"${this.cleanNDC(criteria.ndc)}"`);
      }
      if (criteria.genericName) {
        searchTerms.push(`generic_name:"${criteria.genericName}"`);
      }
      if (criteria.brandName) {
        searchTerms.push(`brand_name:"${criteria.brandName}"`);
      }
      if (criteria.manufacturer) {
        searchTerms.push(`openfda.manufacturer_name:"${criteria.manufacturer}"`);
      }

      if (searchTerms.length === 0) {
        throw new Error('At least one search criterion is required');
      }

      const searchQuery = searchTerms.join(' AND ');
      const cacheKey = `advanced_${Buffer.from(searchQuery).toString('base64')}_${limit}`;
      
      // Check cache first
      const cachedResult = this.cache.get(cacheKey);
      if (cachedResult) {
        return { data: cachedResult, fromCache: true };
      }

      const response = await axios.get(this.baseURL, {
        params: {
          search: searchQuery,
          limit: Math.min(limit, 100)
        },
        timeout: this.timeout,
        headers: {
          'User-Agent': 'PharmaTrack/1.0 (pharmacy management system)'
        }
      });

      // Cache the result
      this.cache.set(cacheKey, response.data);
      
      return { data: response.data, fromCache: false };
    } catch (error) {
      throw this.handleFDAError(error);
    }
  }

  /**
   * Clean and format NDC number
   * @param {string} ndc - Raw NDC number
   * @returns {string} Cleaned NDC number
   */
  cleanNDC(ndc) {
    if (!ndc) return '';
    
    // Remove all non-numeric characters
    const digits = ndc.replace(/\D/g, '');
    
    // NDC should be 7-11 digits (some FDA NDCs are shorter)
    if (digits.length < 7 || digits.length > 11) {
      throw new Error('NDC must be 7-11 digits');
    }
    
    return digits;
  }

  /**
   * Format NDC number with dashes for FDA search
   * Attempts to format based on common NDC patterns
   * @param {string} ndc - Clean NDC digits only
   * @returns {string} Formatted NDC with dashes
   */
  formatNDC(ndc) {
    // Common NDC formats:
    // 8 digits: XXXX-XXX-X  (4-3-1)
    // 9 digits: XXXXX-XXX-X (5-3-1) or XXXX-XXXX-X (4-4-1)  
    // 10 digits: XXXXX-XXXX-X (5-4-1) or XXXXX-XXX-XX (5-3-2)
    // 11 digits: XXXXX-XXXX-XX (5-4-2)
    
    if (ndc.length === 8) {
      // Try both common 8-digit patterns
      // Pattern 1: 4-3-1 (e.g., 1234-567-8)
      // Pattern 2: 5-3 (e.g., 12345-678) - common for shorter NDCs
      return `${ndc.slice(0, 5)}-${ndc.slice(5)}`; // Try 5-3 pattern first
    } else if (ndc.length === 9) {
      // Try 5-3-1 format first
      return `${ndc.slice(0, 5)}-${ndc.slice(5, 8)}-${ndc.slice(8)}`;
    } else if (ndc.length === 10) {
      // Try 5-4-1 format
      return `${ndc.slice(0, 5)}-${ndc.slice(5, 9)}-${ndc.slice(9)}`;
    } else if (ndc.length === 11) {
      // Standard 11-digit format: 5-4-2
      return `${ndc.slice(0, 5)}-${ndc.slice(5, 9)}-${ndc.slice(9)}`;
    }
    
    // If we can't format it, return as-is
    return ndc;
  }

  /**
   * Standardize NDC to 5-4-2 format for database storage
   * Pads shorter NDCs with leading zeros to reach 11 digits, then formats as 5-4-2
   * @param {string} ndc - Raw NDC number (with or without dashes)
   * @returns {string} Standardized NDC in 5-4-2 format (e.g., 12345-6789-01)
   */
  standardizeNDC(ndc) {
    // Clean the NDC (remove all non-digits)
    const cleanNDC = this.cleanNDC(ndc);
    
    // Pad with leading zeros to make it 11 digits
    const paddedNDC = cleanNDC.padStart(11, '0');
    
    // Format as 5-4-2
    return `${paddedNDC.slice(0, 5)}-${paddedNDC.slice(5, 9)}-${paddedNDC.slice(9, 11)}`;
  }

  /**
   * Validate NDC format
   * @param {string} ndc - NDC number to validate
   * @returns {boolean} True if valid
   */
  validateNDC(ndc) {
    try {
      const cleaned = this.cleanNDC(ndc);
      return cleaned.length >= 10 && cleaned.length <= 11;
    } catch {
      return false;
    }
  }


  /**
   * Generate additional NDC format variations for FDA search
   * @param {string} cleanNDC - Clean NDC digits
   * @returns {Array} Array of NDC format variations
   */
  formatNDCVariations(cleanNDC) {
    const variations = [];
    
    // Try with different padding strategies
    const padded11 = cleanNDC.padStart(11, '0');
    const padded10 = cleanNDC.padStart(10, '0');
    
    // Common FDA patterns with leading zeros in different positions
    variations.push(
      // 5-4-2 format variations
      `${padded11.slice(0, 5)}-${padded11.slice(5, 9)}-${padded11.slice(9)}`,
      // Strip leading zeros from each segment of 5-4-2
      `${parseInt(padded11.slice(0, 5))}-${parseInt(padded11.slice(5, 9))}-${parseInt(padded11.slice(9))}`,
      
      // 4-4-2 format variations  
      `${padded10.slice(0, 4)}-${padded10.slice(4, 8)}-${padded10.slice(8)}`,
      // Strip leading zeros from each segment of 4-4-2
      `${parseInt(padded10.slice(0, 4))}-${parseInt(padded10.slice(4, 8))}-${parseInt(padded10.slice(8))}`,
      
      // Package NDC format variations (sometimes different from product NDC)
      // Try removing one leading zero (common transformation)
      cleanNDC.length > 7 ? cleanNDC.slice(1) : null,
      // Try adding leading zeros in different amounts
      cleanNDC.padStart(12, '0'),
      cleanNDC.padStart(9, '0')
    );
    
    return variations.filter(Boolean);
  }

  /**
   * Search drug labeling information by NDC
   * Uses the OpenFDA drug/label.json endpoint for FDA-approved drug labeling
   * @param {string} ndc - National Drug Code
   * @param {number} limit - Maximum number of results (default: 1)
   * @returns {Promise} FDA labeling data
   */
  async searchLabelingByNDC(ndc, limit = 1) {
    try {
      const cleanNDC = this.cleanNDC(ndc);
      const cacheKey = `labeling_ndc_${cleanNDC}`;
      
      // Check cache first
      console.log(`🔍 OpenFDA Cache Lookup for NDC: "${ndc}"`);
      console.log(`   🔑 Cache key: "${cacheKey}"`);
      const cachedResult = this.cache.get(cacheKey);
      if (cachedResult) {
        console.log(`✅ OpenFDA Cache HIT - Using cached labeling data`);
        console.log(`   📊 Cached results: ${cachedResult?.results?.length || 0}`);
        console.log(`   💾 Skipping API call - returning cached data`);
        return { data: cachedResult, fromCache: true };
      }
      console.log(`❌ OpenFDA Cache MISS - Will fetch from FDA API`);
      console.log(`   🌐 Preparing to make API calls to OpenFDA...`);

      // Try multiple NDC formats for search
      // The FDA database often uses different NDC formats than what's displayed
      const searchFormats = [
        ndc, // original format as provided (try first)
        cleanNDC, // clean digits only
        
        // Common FDA format patterns - pad to 11 digits and format as 5-4-2
        cleanNDC.padStart(11, '0'),
        `${cleanNDC.padStart(11, '0').slice(0, 5)}-${cleanNDC.padStart(11, '0').slice(5, 9)}-${cleanNDC.padStart(11, '0').slice(9)}`,
        
        // Try original 10-digit padded formats
        cleanNDC.padStart(10, '0'),
        `${cleanNDC.padStart(10, '0').slice(0, 4)}-${cleanNDC.padStart(10, '0').slice(4, 8)}-${cleanNDC.padStart(10, '0').slice(8)}`,
        
        // Common patterns based on actual length
        cleanNDC.length === 8 ? `${cleanNDC.slice(0, 4)}-${cleanNDC.slice(4, 7)}-${cleanNDC.slice(7)}` : null, // 4-3-1
        cleanNDC.length === 8 ? `${cleanNDC.slice(0, 5)}-${cleanNDC.slice(5)}` : null, // 5-3
        cleanNDC.length === 9 ? `${cleanNDC.slice(0, 4)}-${cleanNDC.slice(4, 8)}-${cleanNDC.slice(8)}` : null, // 4-4-1
        cleanNDC.length === 9 ? `${cleanNDC.slice(0, 5)}-${cleanNDC.slice(5, 8)}-${cleanNDC.slice(8)}` : null, // 5-3-1
        cleanNDC.length === 10 ? `${cleanNDC.slice(0, 4)}-${cleanNDC.slice(4, 8)}-${cleanNDC.slice(8)}` : null, // 4-4-2
        cleanNDC.length === 10 ? `${cleanNDC.slice(0, 5)}-${cleanNDC.slice(5, 9)}-${cleanNDC.slice(9)}` : null, // 5-4-1
        cleanNDC.length === 11 ? `${cleanNDC.slice(0, 5)}-${cleanNDC.slice(5, 9)}-${cleanNDC.slice(9)}` : null, // 5-4-2
        
        // Try with leading zeros stripped from segments
        this.formatNDCVariations(cleanNDC)
      ].flat().filter(Boolean); // Flatten array and remove null entries

      let response = null;
      let lastError = null;
      
      console.log(`🔍 OpenFDA API Search Starting for NDC: "${ndc}"`);
      console.log(`📋 Trying ${searchFormats.length} different NDC format variations:`, searchFormats);
      
      // Try each format with both product_ndc and package_ndc fields
      for (const format of searchFormats) {
        // Try both product_ndc and package_ndc fields for each format
        const searchFields = ['openfda.product_ndc', 'openfda.package_ndc'];
        
        for (const field of searchFields) {
          try {
            const searchQuery = `${field}:"${format}"`;
            const url = `https://api.fda.gov/drug/label.json?search=${encodeURIComponent(searchQuery)}&limit=${limit}`;
            
            console.log(`🌐 OpenFDA API Call #${searchFormats.indexOf(format) + 1}.${searchFields.indexOf(field) + 1}:`);
            console.log(`   📍 Format being tried: "${format}"`);
            console.log(`   🔍 Field being searched: ${field}`);
            console.log(`   🔗 Full API URL: ${url}`);
            console.log(`   🔎 Search Query: ${searchQuery}`);
            console.log(`   ⏱️  Timeout: ${this.timeout}ms`);
            
            const startTime = Date.now();
            response = await this.makeApiRequest(url);
            const responseTime = Date.now() - startTime;
            
            // If we get here, the request succeeded
            console.log(`✅ OpenFDA API SUCCESS!`);
            console.log(`   🎯 NDC format that worked: "${format}"`);
            console.log(`   🏷️  FDA field that worked: ${field}`);
            console.log(`   ⚡ Response time: ${responseTime}ms`);
            console.log(`   📊 Results found: ${response.data?.results?.length || 0}`);
            console.log(`   📦 Response size: ${JSON.stringify(response.data).length} characters`);
            break;
            
          } catch (error) {
            lastError = error;
            console.log(`❌ OpenFDA API Failed for format: "${format}" in field: ${field}`);
            console.log(`   🚫 Error: ${error.response?.status || error.code} - ${error.response?.statusText || error.message}`);
            if (error.response?.status === 404) {
              console.log(`   ℹ️  No labeling data found for this NDC format in ${field} field`);
            } else if (error.response?.status === 429) {
              console.log(`   ⏰ Rate limit exceeded - may need to wait before retrying`);
            }
            continue;
          }
        }
        
        // If we found a successful response, break out of the format loop
        if (response) {
          break;
        }
      }
      
      // If no format worked, throw the last error
      if (!response) {
        console.log(`❌ OpenFDA API Search FAILED - No results found for any NDC format`);
        console.log(`   🔍 Original NDC: "${ndc}"`);
        console.log(`   📋 Formats tried: ${searchFormats.length}`);
        console.log(`   🚫 Final error: ${lastError?.response?.status || lastError?.code} - ${lastError?.response?.statusText || lastError?.message}`);
        throw lastError || new Error('No labeling data found for any NDC format');
      }

      // Cache the result
      console.log(`💾 Caching OpenFDA labeling data for NDC: "${ndc}"`);
      console.log(`   🔑 Cache key: "${cacheKey}"`);
      this.cache.set(cacheKey, response.data);
      console.log(`   ✅ Data cached successfully`);
      
      return { data: response.data, fromCache: false };
    } catch (error) {
      console.error('FDA Labeling API Error:', error.message);
      throw this.handleFDAError(error);
    }
  }

  /**
   * Search drug labeling by generic name
   * @param {string} genericName - Generic drug name
   * @param {number} limit - Maximum number of results (default: 5)
   * @returns {Promise} FDA labeling data
   */
  async searchLabelingByGenericName(genericName, limit = 5) {
    try {
      const cleanName = genericName.toLowerCase().trim();
      const cacheKey = `labeling_generic_${cleanName}_${limit}`;
      
      // Check cache first
      console.log(`🔍 OpenFDA Generic Name Cache Lookup: "${genericName}"`);
      console.log(`   🔑 Cache key: "${cacheKey}"`);
      const cachedResult = this.cache.get(cacheKey);
      if (cachedResult) {
        console.log(`✅ OpenFDA Generic Name Cache HIT - Using cached labeling data`);
        console.log(`   📊 Cached results: ${cachedResult?.results?.length || 0}`);
        console.log(`   💾 Skipping API call - returning cached data`);
        return { data: cachedResult, fromCache: true };
      }
      console.log(`❌ OpenFDA Generic Name Cache MISS - Will fetch from FDA API`);
      console.log(`   🌐 Preparing to make API call to OpenFDA...`);

      // Try multiple search variations for better results
      const searchVariations = [
        `openfda.generic_name:"${genericName}"`, // exact match
        `openfda.generic_name:${genericName}*`, // starts with
        `openfda.generic_name:*${genericName}*`, // contains
        `openfda.brand_name:"${genericName}"`, // also search brand names
        `(openfda.generic_name:"${genericName}" OR openfda.brand_name:"${genericName}")` // combined search
      ];

      let response = null;
      let lastError = null;
      
      console.log(`🔍 OpenFDA Generic Name Search Starting: "${genericName}"`);
      console.log(`📋 Trying ${searchVariations.length} different search variations`);
      
      for (const searchQuery of searchVariations) {
        try {
          const url = `https://api.fda.gov/drug/label.json?search=${encodeURIComponent(searchQuery)}&limit=${limit}`;
          
          console.log(`🌐 OpenFDA Generic Name API Call #${searchVariations.indexOf(searchQuery) + 1}:`);
          console.log(`   🔍 Search variation: ${searchQuery}`);
          console.log(`   🔗 Full API URL: ${url}`);
          console.log(`   ⏱️  Timeout: ${this.timeout}ms`);
          
          const startTime = Date.now();
          response = await this.makeApiRequest(url);
          const responseTime = Date.now() - startTime;
          
          // If we get here, the request succeeded
          console.log(`✅ OpenFDA Generic Name API SUCCESS!`);
          console.log(`   🎯 Search variation that worked: ${searchQuery}`);
          console.log(`   ⚡ Response time: ${responseTime}ms`);
          console.log(`   📊 Results found: ${response.data?.results?.length || 0}`);
          console.log(`   📦 Response size: ${JSON.stringify(response.data).length} characters`);
          break;
          
        } catch (error) {
          lastError = error;
          console.log(`❌ OpenFDA Generic Name API Failed for: ${searchQuery}`);
          console.log(`   🚫 Error: ${error.response?.status || error.code} - ${error.response?.statusText || error.message}`);
          if (error.response?.status === 404) {
            console.log(`   ℹ️  No labeling data found for this search variation`);
          } else if (error.response?.status === 429) {
            console.log(`   ⏰ Rate limit exceeded - may need to wait before retrying`);
          }
          continue;
        }
      }
      
      // If no search worked, throw the last error
      if (!response) {
        console.log(`❌ OpenFDA Generic Name Search FAILED - No results found for any search variation`);
        console.log(`   🔍 Original generic name: "${genericName}"`);
        console.log(`   📋 Variations tried: ${searchVariations.length}`);
        console.log(`   🚫 Final error: ${lastError?.response?.status || lastError?.code} - ${lastError?.response?.statusText || lastError?.message}`);
        throw lastError || new Error('No labeling data found for any search variation');
      }

      // Cache the result
      console.log(`💾 Caching OpenFDA generic name labeling data: "${genericName}"`);
      console.log(`   🔑 Cache key: "${cacheKey}"`);
      this.cache.set(cacheKey, response.data);
      console.log(`   ✅ Data cached successfully`);
      
      return { data: response.data, fromCache: false };
    } catch (error) {
      console.error('FDA Generic Name Labeling API Error:', error.message);
      throw this.handleFDAError(error);
    }
  }

  /**
   * Search drug labeling by brand name
   * @param {string} brandName - Brand drug name
   * @param {number} limit - Maximum number of results (default: 5)
   * @returns {Promise} FDA labeling data
   */
  async searchLabelingByBrandName(brandName, limit = 5) {
    try {
      const cacheKey = `labeling_brand_${brandName.toLowerCase()}_${limit}`;
      
      // Check cache first
      const cachedResult = this.cache.get(cacheKey);
      if (cachedResult) {
        return { data: cachedResult, fromCache: true };
      }

      const searchQuery = `openfda.brand_name:"${brandName}"`;
      const url = `https://api.fda.gov/drug/label.json?search=${encodeURIComponent(searchQuery)}&limit=${limit}`;
      
      console.log('FDA Labeling API request:', url);
      
      const response = await this.makeApiRequest(url);

      // Cache the result
      this.cache.set(cacheKey, response.data);
      
      return { data: response.data, fromCache: false };
    } catch (error) {
      console.error('FDA Labeling API Error:', error.message);
      throw this.handleFDAError(error);
    }
  }

  /**
   * Advanced labeling search with multiple criteria
   * @param {Object} criteria - Search criteria object
   * @param {string} [criteria.ndc] - NDC number
   * @param {string} [criteria.genericName] - Generic name
   * @param {string} [criteria.brandName] - Brand name
   * @param {string} [criteria.manufacturer] - Manufacturer name
   * @param {number} limit - Maximum number of results (default: 10)
   * @returns {Promise} FDA labeling data
   */
  async advancedLabelingSearch(criteria, limit = 10) {
    try {
      const cacheKey = `labeling_advanced_${JSON.stringify(criteria)}_${limit}`;
      
      // Check cache first
      const cachedResult = this.cache.get(cacheKey);
      if (cachedResult) {
        return { data: cachedResult, fromCache: true };
      }

      // Build search query from criteria
      const searchParts = [];
      
      if (criteria.ndc) {
        searchParts.push(`openfda.product_ndc:"${criteria.ndc}"`);
      }
      if (criteria.genericName) {
        searchParts.push(`openfda.generic_name:"${criteria.genericName}"`);
      }
      if (criteria.brandName) {
        searchParts.push(`openfda.brand_name:"${criteria.brandName}"`);
      }
      if (criteria.manufacturer) {
        searchParts.push(`openfda.manufacturer_name:"${criteria.manufacturer}"`);
      }

      if (searchParts.length === 0) {
        throw new Error('At least one search criterion must be provided');
      }

      const searchQuery = searchParts.join(' AND ');
      const url = `https://api.fda.gov/drug/label.json?search=${encodeURIComponent(searchQuery)}&limit=${limit}`;
      
      console.log('FDA Labeling API request:', url);
      
      const response = await this.makeApiRequest(url);

      // Cache the result
      this.cache.set(cacheKey, response.data);
      
      return { data: response.data, fromCache: false };
    } catch (error) {
      console.error('FDA Labeling API Error:', error.message);
      throw this.handleFDAError(error);
    }
  }

  /**
   * Parse labeling data to extract key information with enhanced readability
   * @param {Object} labelingData - Raw FDA labeling response
   * @returns {Object} Enhanced parsed labeling information
   */
  parseLabelingData(labelingData) {
    if (!labelingData || !labelingData.results || labelingData.results.length === 0) {
      return null;
    }

    const result = labelingData.results[0];
    
    // Helper function to clean and format text
    const cleanText = (text) => {
      if (!text) return '';
      if (Array.isArray(text)) {
        text = text.join(' ');
      }
      
      return text
        .replace(/\s+/g, ' ')
        .replace(/[\r\n]+/g, '\n')
        .replace(/\n\s*\n/g, '\n\n')
        .trim();
    };

    // Helper function to extract bullet points or numbered lists
    const extractList = (text) => {
      if (!text) return [];
      const cleanedText = cleanText(text);
      
      // Try to extract numbered items (1., 2., etc.)
      const numberedItems = cleanedText.match(/^\d+\.\s*[^\n]+$/gm);
      if (numberedItems && numberedItems.length > 1) {
        return numberedItems.map(item => item.replace(/^\d+\.\s*/, '').trim());
      }
      
      // Try to extract bullet points
      const bulletItems = cleanedText.match(/^[•·\-\*]\s*[^\n]+$/gm);
      if (bulletItems && bulletItems.length > 1) {
        return bulletItems.map(item => item.replace(/^[•·\-\*]\s*/, '').trim());
      }
      
      // Try to extract sentences separated by periods
      const sentences = cleanedText.split(/\.\s+/).filter(s => s.trim().length > 20);
      if (sentences.length > 1) {
        return sentences.map(s => s.trim());
      }
      
      return [cleanedText];
    };

    // Helper function to format dosage information
    const formatDosage = (text) => {
      if (!text) return '';
      const cleaned = cleanText(text);
      
      // Extract common dosage patterns
      const dosagePatterns = {
        tablets: cleaned.match(/\d+\s*mg\s+tablet[s]?/gi) || [],
        capsules: cleaned.match(/\d+\s*mg\s+capsule[s]?/gi) || [],
        frequency: cleaned.match(/(once|twice|three times|four times)\s+(daily|per day|a day)/gi) || [],
        timing: cleaned.match(/(with|without)\s+food/gi) || [],
        duration: cleaned.match(/for\s+\d+\s+(day[s]?|week[s]?|month[s]?)/gi) || []
      };
      
      return {
        full_text: cleaned,
        patterns: dosagePatterns
      };
    };

    return {
      // Document metadata
      metadata: {
        product_id: result.id,
        set_id: result.set_id,
        version: result.version,
        effective_time: result.effective_time ? new Date(result.effective_time).toLocaleDateString() : 'Not specified',
        last_updated: new Date().toLocaleDateString()
      },
      
      // Enhanced product information
      product_info: {
        brand_name: result.openfda?.brand_name?.[0] || 'Not specified',
        generic_name: result.openfda?.generic_name?.[0] || 'Not specified',
        manufacturer: result.openfda?.manufacturer_name?.[0] || 'Not specified',
        ndc_codes: result.openfda?.product_ndc || [],
        package_ndc: result.openfda?.package_ndc || [],
        substance_names: result.openfda?.substance_name || [],
        product_type: result.openfda?.product_type?.[0] || 'Not specified',
        dosage_form: result.openfda?.dosage_form?.[0] || 'Not specified',
        routes: result.openfda?.route || [],
        strength: result.openfda?.strength || [],
        application_number: result.openfda?.application_number || []
      },

      // Clinical information with enhanced formatting
      clinical_info: {
        indications_and_usage: {
          full_text: cleanText(result.indications_and_usage?.[0]),
          key_uses: extractList(result.indications_and_usage?.[0]),
          outline: this.parseToOutline(result.indications_and_usage?.[0])
        },
        contraindications: {
          full_text: cleanText(result.contraindications?.[0]),
          key_points: extractList(result.contraindications?.[0]),
          outline: this.parseToOutline(result.contraindications?.[0])
        },
        warnings_and_precautions: {
          warnings: {
            full_text: cleanText(result.warnings?.[0]),
            key_warnings: extractList(result.warnings?.[0]),
            outline: this.parseToOutline(result.warnings?.[0])
          },
          precautions: {
            full_text: cleanText(result.precautions?.[0]),
            key_precautions: extractList(result.precautions?.[0]),
            outline: this.parseToOutline(result.precautions?.[0])
          },
          boxed_warning: cleanText(result.boxed_warning?.[0]),
          boxed_warning_outline: this.parseToOutline(result.boxed_warning?.[0])
        },
        adverse_reactions: {
          full_text: cleanText(result.adverse_reactions?.[0]),
          common_reactions: extractList(result.adverse_reactions?.[0]),
          outline: this.parseToOutline(result.adverse_reactions?.[0])
        },
        drug_interactions: {
          full_text: cleanText(result.drug_interactions?.[0]),
          key_interactions: extractList(result.drug_interactions?.[0]),
          outline: this.parseToOutline(result.drug_interactions?.[0])
        }
      },
      
      // Dosage and administration with smart parsing
      dosage_info: {
        administration: formatDosage(result.dosage_and_administration?.[0]),
        administration_outline: this.parseToOutline(result.dosage_and_administration?.[0]),
        overdosage: {
          full_text: cleanText(result.overdosage?.[0]),
          symptoms: extractList(result.overdosage?.[0]),
          outline: this.parseToOutline(result.overdosage?.[0])
        }
      },

      // Physical and chemical description
      description_info: {
        description: cleanText(result.description?.[0]),
        clinical_pharmacology: cleanText(result.clinical_pharmacology?.[0]),
        mechanism_of_action: cleanText(result.mechanism_of_action?.[0]),
        pharmacokinetics: cleanText(result.pharmacokinetics?.[0])
      },

      // Supply and storage
      supply_info: {
        how_supplied: cleanText(result.how_supplied?.[0]),
        storage_and_handling: cleanText(result.storage_and_handling?.[0])
      },

      // Special populations
      special_populations: {
        pregnancy: cleanText(result.pregnancy?.[0]),
        nursing_mothers: cleanText(result.nursing_mothers?.[0]),
        pediatric_use: cleanText(result.pediatric_use?.[0]),
        geriatric_use: cleanText(result.geriatric_use?.[0])
      },

      // Package labeling (if available)
      package_info: {
        principal_display_panel: result.package_label_principal_display_panel || [],
        spl_patient_package_insert: result.spl_patient_package_insert || []
      },

      // Summary for quick reference
      summary: {
        drug_name: `${result.openfda?.brand_name?.[0] || 'Unknown'} (${result.openfda?.generic_name?.[0] || 'Unknown'})`,
        manufacturer: result.openfda?.manufacturer_name?.[0] || 'Not specified',
        strength: (result.openfda?.strength || []).join(', ') || 'Not specified',
        dosage_form: result.openfda?.dosage_form?.[0] || 'Not specified',
        primary_indication: result.indications_and_usage?.[0] ? 
          cleanText(result.indications_and_usage[0]).split('.')[0] + '.' : 'Not specified',
        has_boxed_warning: !!(result.boxed_warning?.[0])
      },

      // Raw data for advanced users
      raw_data: result
    };
  }

  /**
   * Parse FDA labeling section into structured outline format following FDA numbering conventions
   * @param {string} text - Raw text from FDA labeling section
   * @param {Object} options - Parsing options
   * @returns {Object} Structured outline with FDA-compliant numbering (1, 1.1, 1.2, (1.1), (1.2), etc.)
   */
  parseToOutline(text, options = {}) {
    if (!text || typeof text !== 'string') {
      return { outline: [], raw_text: text || '' };
    }

    const defaultOptions = {
      maxDepth: 5,
      minSentenceLength: 10,
      preserveFDANumbering: true,
      detectSections: true,
      createHierarchy: true
    };
    
    const opts = { ...defaultOptions, ...options };
    
    // Clean and normalize the text
    let cleanText = text
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n\n')
      .trim();

    // Parse using FDA-specific section detection
    const fdaStructure = this.parseFDAStructure(cleanText, opts);
    
    return {
      outline: fdaStructure.outline,
      raw_text: text,
      structure_detected: fdaStructure.structure_info,
      fda_sections: fdaStructure.sections,
      parsing_metadata: {
        paragraph_count: fdaStructure.paragraph_count,
        total_items: this.countOutlineItems(fdaStructure.outline),
        has_fda_numbering: fdaStructure.has_fda_numbering,
        section_count: fdaStructure.sections.length,
        deepest_level: fdaStructure.max_depth
      }
    };
  }

  /**
   * Parse FDA labeling text using official FDA section numbering patterns
   * Recognizes: 1 SECTION, 1.1 Subsection, 1.1.1 Sub-subsection, (1.1) parenthetical
   * @param {string} text - Raw FDA labeling text
   * @param {Object} options - Parsing options
   * @returns {Object} FDA-structured outline
   * @private
   */
  parseFDAStructure(text, options = {}) {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const outline = [];
    const sections = [];
    let currentSection = null;
    let maxDepth = 0;
    let hasFDANumbering = false;

    // FDA section patterns
    const fdaPatterns = {
      // Main sections: "1 INDICATIONS AND USAGE", "2 DOSAGE AND ADMINISTRATION"
      mainSection: /^(\d+)\s+([A-Z\s]+[A-Z])\.?\s*$/,
      
      // Subsections: "1.1 Important Dosing Information", "2.1 General Dosing"
      subsection: /^(\d+\.\d+)\s+(.+)$/,
      
      // Sub-subsections: "1.1.1 Adult Patients", "2.1.1 Initial Dose"
      subSubsection: /^(\d+\.\d+\.\d+)\s+(.+)$/,
      
      // Parenthetical subsections: "(1.1)", "(2.1)", often for references
      parenthetical: /^\((\d+(?:\.\d+)*)\)\s*(.*)$/,
      
      // Lettered subsections: "(a)", "(b)", "a.", "b."
      lettered: /^(\(?[a-z]\)?\.?)\s+(.+)$/i,
      
      // Numbered lists within sections: "(1)", "(2)", "1.", "2."
      numberedList: /^(\(?[0-9]+\)?\.?)\s+(.+)$/,
      
      // Bullet points
      bullet: /^[•·\-\*\+]\s+(.+)$/
    };

    lines.forEach((line, lineIndex) => {
      let matched = false;
      let fdaItem = null;

      // Check for main FDA sections (1 INDICATIONS AND USAGE)
      const mainSectionMatch = line.match(fdaPatterns.mainSection);
      if (mainSectionMatch) {
        hasFDANumbering = true;
        currentSection = {
          number: mainSectionMatch[1],
          title: mainSectionMatch[2].trim(),
          level: 0,
          type: 'main_section'
        };
        sections.push(currentSection);

        fdaItem = {
          type: 'fda_main_section',
          level: 0,
          section_number: mainSectionMatch[1],
          section_title: mainSectionMatch[2].trim(),
          content: line,
          full_number: mainSectionMatch[1],
          key_phrases: this.extractKeyPhrases(mainSectionMatch[2]),
          line_index: lineIndex
        };
        matched = true;
      }
      
      // Check for subsections (1.1 Important Information)
      else if (!mainSectionMatch) {
        const subsectionMatch = line.match(fdaPatterns.subsection);
        if (subsectionMatch) {
          hasFDANumbering = true;
          maxDepth = Math.max(maxDepth, 1);
          
          fdaItem = {
            type: 'fda_subsection',
            level: 1,
            section_number: subsectionMatch[1],
            section_title: subsectionMatch[2].trim(),
            content: line,
            full_number: subsectionMatch[1],
            parent_section: subsectionMatch[1].split('.')[0],
            key_phrases: this.extractKeyPhrases(subsectionMatch[2]),
            line_index: lineIndex
          };
          matched = true;
        }
      }

      // Check for sub-subsections (1.1.1 Specific Instructions)
      if (!matched) {
        const subSubsectionMatch = line.match(fdaPatterns.subSubsection);
        if (subSubsectionMatch) {
          hasFDANumbering = true;
          maxDepth = Math.max(maxDepth, 2);
          
          fdaItem = {
            type: 'fda_sub_subsection',
            level: 2,
            section_number: subSubsectionMatch[1],
            section_title: subSubsectionMatch[2].trim(),
            content: line,
            full_number: subSubsectionMatch[1],
            parent_section: subSubsectionMatch[1].split('.').slice(0, -1).join('.'),
            key_phrases: this.extractKeyPhrases(subSubsectionMatch[2]),
            line_index: lineIndex
          };
          matched = true;
        }
      }

      // Check for parenthetical sections ((1.1) Reference information)
      if (!matched) {
        const parentheticalMatch = line.match(fdaPatterns.parenthetical);
        if (parentheticalMatch) {
          hasFDANumbering = true;
          const depth = parentheticalMatch[1].split('.').length;
          maxDepth = Math.max(maxDepth, depth);
          
          fdaItem = {
            type: 'fda_parenthetical',
            level: depth,
            section_number: parentheticalMatch[1],
            section_title: parentheticalMatch[2].trim() || 'Reference',
            content: line,
            full_number: `(${parentheticalMatch[1]})`,
            parent_section: parentheticalMatch[1].split('.').slice(0, -1).join('.') || parentheticalMatch[1].split('.')[0],
            key_phrases: this.extractKeyPhrases(parentheticalMatch[2] || ''),
            line_index: lineIndex
          };
          matched = true;
        }
      }

      // Check for lettered subsections (a. Patient Selection, (b) Monitoring)
      if (!matched) {
        const letteredMatch = line.match(fdaPatterns.lettered);
        if (letteredMatch) {
          maxDepth = Math.max(maxDepth, 3);
          
          fdaItem = {
            type: 'fda_lettered',
            level: 3,
            section_number: letteredMatch[1],
            section_title: letteredMatch[2].trim(),
            content: line,
            full_number: letteredMatch[1],
            parent_section: currentSection ? currentSection.number : null,
            key_phrases: this.extractKeyPhrases(letteredMatch[2]),
            technical_terms: this.extractTechnicalTerms(letteredMatch[2]),
            line_index: lineIndex
          };
          matched = true;
        }
      }

      // Check for numbered lists within sections ((1) First item, (2) Second item)
      if (!matched) {
        const numberedListMatch = line.match(fdaPatterns.numberedList);
        if (numberedListMatch) {
          maxDepth = Math.max(maxDepth, 4);
          
          fdaItem = {
            type: 'fda_numbered_list',
            level: 4,
            section_number: numberedListMatch[1],
            section_title: numberedListMatch[2].trim(),
            content: line,
            full_number: numberedListMatch[1],
            parent_section: currentSection ? currentSection.number : null,
            key_phrases: this.extractKeyPhrases(numberedListMatch[2]),
            technical_terms: this.extractTechnicalTerms(numberedListMatch[2]),
            line_index: lineIndex
          };
          matched = true;
        }
      }

      // Check for bullet points
      if (!matched) {
        const bulletMatch = line.match(fdaPatterns.bullet);
        if (bulletMatch) {
          maxDepth = Math.max(maxDepth, 4);
          
          fdaItem = {
            type: 'fda_bullet',
            level: 4,
            section_number: null,
            section_title: bulletMatch[1].trim(),
            content: line,
            full_number: '•',
            parent_section: currentSection ? currentSection.number : null,
            key_phrases: this.extractKeyPhrases(bulletMatch[1]),
            technical_terms: this.extractTechnicalTerms(bulletMatch[1]),
            line_index: lineIndex
          };
          matched = true;
        }
      }

      // If no specific pattern matched, treat as regular paragraph
      if (!matched && line.length >= options.minSentenceLength) {
        fdaItem = {
          type: 'fda_paragraph',
          level: currentSection ? 1 : 0,
          section_number: null,
          section_title: null,
          content: line,
          full_number: null,
          parent_section: currentSection ? currentSection.number : null,
          key_phrases: this.extractKeyPhrases(line),
          technical_terms: this.extractTechnicalTerms(line),
          line_index: lineIndex
        };
      }

      if (fdaItem) {
        outline.push(fdaItem);
      }
    });

    return {
      outline: outline,
      sections: sections,
      structure_info: {
        has_main_sections: sections.length > 0,
        has_subsections: outline.some(item => item.type === 'fda_subsection'),
        has_parenthetical: outline.some(item => item.type === 'fda_parenthetical'),
        has_numbered_lists: outline.some(item => item.type === 'fda_numbered_list'),
        has_bullets: outline.some(item => item.type === 'fda_bullet'),
        structure_complexity: maxDepth
      },
      has_fda_numbering: hasFDANumbering,
      max_depth: maxDepth,
      paragraph_count: lines.length
    };
  }

  /**
   * Extract key phrases from FDA text for enhanced indexing
   * @param {string} text - Text to analyze
   * @returns {Array} Array of key phrases
   * @private
   */
  extractKeyPhrases(text) {
    if (!text) return [];
    
    // Common medical/pharmaceutical key phrases
    const medicalPhrases = [
      // Conditions
      'atrial fibrillation', 'deep vein thrombosis', 'pulmonary embolism', 'stroke prevention',
      'heart failure', 'myocardial infarction', 'acute coronary syndrome', 'hypertension',
      'diabetes', 'kidney disease', 'liver disease', 'bleeding disorder',
      
      // Drug actions
      'anticoagulant', 'antiplatelet', 'antihypertensive', 'antidiabetic', 'analgesic',
      'anti-inflammatory', 'antibiotic', 'antiviral', 'antifungal', 'immunosuppressive',
      
      // Administration
      'once daily', 'twice daily', 'three times daily', 'with food', 'without food',
      'before meals', 'after meals', 'at bedtime', 'as needed', 'continuous infusion',
      
      // Monitoring
      'blood pressure', 'heart rate', 'kidney function', 'liver function', 'blood glucose',
      'platelet count', 'bleeding time', 'therapeutic range', 'drug level',
      
      // Side effects
      'bleeding risk', 'allergic reaction', 'severe hypotension', 'respiratory depression',
      'cardiac arrest', 'anaphylaxis', 'stevens-johnson syndrome'
    ];
    
    const foundPhrases = [];
    const lowerText = text.toLowerCase();
    
    // Check for predefined medical phrases
    medicalPhrases.forEach(phrase => {
      if (lowerText.includes(phrase)) {
        foundPhrases.push(phrase);
      }
    });
    
    // Extract dosage information
    const dosageMatches = text.match(/\d+\s*(mg|mcg|g|ml|units?|iu|mEq)\b/gi);
    if (dosageMatches) {
      foundPhrases.push(...dosageMatches.slice(0, 3)); // Limit to 3 dosages
    }
    
    // Extract timing information
    const timingMatches = text.match(/(once|twice|three times|four times)\s+(daily|per day|a day)/gi);
    if (timingMatches) {
      foundPhrases.push(...timingMatches);
    }
    
    return [...new Set(foundPhrases)]; // Remove duplicates
  }

  /**
   * Extract technical medical terms from text
   * @param {string} text - Text to analyze
   * @returns {Array} Array of technical terms
   * @private
   */
  extractTechnicalTerms(text) {
    if (!text) return [];
    
    const technicalTerms = [];
    
    // Medical terminology patterns
    const patterns = {
      // Drug names (typically capitalized or ending in common suffixes)
      drugNames: /\b[A-Z][a-z]*(?:ine|ate|ide|ium|ole|ase|cin|mycin|pril|sartan|olol|pine)\b/g,
      
      // Medical conditions (often multiple words, capitalized)
      conditions: /\b(?:[A-Z][a-z]+\s+){0,2}[A-Z][a-z]*(?:itis|osis|emia|uria|pathy|plasia|trophy)\b/g,
      
      // Anatomical terms
      anatomy: /\b(?:cardio|hepato|nephro|neuro|gastro|pulmon|dermat|ophthalm|oto)[a-z]*\b/gi,
      
      // Clinical measurements
      measurements: /\b(?:mg\/dL|mmol\/L|mEq\/L|IU\/L|ng\/mL|mcg\/mL|units\/mL)\b/g,
      
      // Pharmacological terms
      pharma: /\b(?:bioavailability|pharmacokinetic|metabolism|clearance|half-life|steady state)\b/gi
    };
    
    Object.values(patterns).forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        technicalTerms.push(...matches.slice(0, 5)); // Limit to prevent overflow
      }
    });
    
    return [...new Set(technicalTerms)]; // Remove duplicates
  }

  /**
   * Search for drug shortages by package NDC
   * @param {string} packageNDC - Package NDC number
   * @param {number} limit - Maximum number of results (default: 10, max: 100)
   * @returns {Promise} FDA drug shortages API response
   */
  async searchShortagesByPackageNDC(packageNDC, limit = 10) {
    try {
      const cleanNDC = this.cleanNDC(packageNDC);
      const cacheKey = `shortages_package_ndc_${cleanNDC}_${limit}`;
      
      // Check cache first
      const cachedResult = this.cache.get(cacheKey);
      if (cachedResult) {
        console.log(`🔍 Shortages Package NDC Cache HIT: "${packageNDC}" -> Found cached result`);
        return { data: cachedResult, fromCache: true };
      }

      console.log(`🔍 Shortages Package NDC Search Starting: "${packageNDC}"`);

      // Generate NDC format variations for drug shortages search
      const searchFormats = this.generateNDCFormats(cleanNDC, packageNDC);
      console.log(`📋 Generated ${searchFormats.length} NDC format variations for shortages search`);

      let response = null;
      let lastError = null;
      let workingFormat = null;

      // Try each NDC format with the package_ndc field
      for (const format of searchFormats) {
        try {
          console.log(`📍 Trying shortages package_ndc: "${format}"`);
          const searchUrl = `${this.shortagesURL}?search=${encodeURIComponent(`package_ndc:"${format}"`)}&limit=${Math.min(limit, 100)}`;
          response = await this.makeApiRequest(searchUrl);

          if (response.data.results && response.data.results.length > 0) {
            workingFormat = format;
            console.log(`✅ Found shortages results with package_ndc: "${format}"`);
            break;
          }
        } catch (err) {
          lastError = err;
          console.log(`❌ Shortages package_ndc failed for: "${format}" - ${err.response?.status || err.code}`);
        }
      }

      // If no results found with any format
      if (!response || !response.data.results || response.data.results.length === 0) {
        console.log(`❌ Shortages Package NDC Search FAILED: "${packageNDC}" - No results found`);
        throw lastError || new Error('No drug shortages found matching the package NDC');
      }

      console.log(`✅ Shortages Package NDC Search SUCCESS: "${packageNDC}"`);
      console.log(`🎯 Working format: "${workingFormat}"`);
      console.log(`📊 Results found: ${response.data.results.length}`);

      // Cache the result
      this.cache.set(cacheKey, response.data);
      
      return { 
        data: response.data, 
        fromCache: false,
        searchInfo: {
          workingFormat,
          searchField: 'package_ndc',
          totalFormatsAttempted: searchFormats.length
        }
      };
    } catch (error) {
      console.log(`❌ Shortages Package NDC Search ERROR: "${packageNDC}" - ${error.message}`);
      throw this.handleFDAError(error);
    }
  }

  /**
   * Search for drug shortages by generic name
   * @param {string} genericName - Generic drug name
   * @param {number} limit - Maximum number of results (default: 10, max: 100)
   * @returns {Promise} FDA drug shortages API response
   */
  async searchShortagesByGenericName(genericName, limit = 10) {
    try {
      const cacheKey = `shortages_generic_${genericName.toLowerCase()}_${limit}`;
      
      // Check cache first
      const cachedResult = this.cache.get(cacheKey);
      if (cachedResult) {
        console.log(`🔍 Shortages Generic Name Cache HIT: "${genericName}" -> Found cached result`);
        return { data: cachedResult, fromCache: true };
      }

      console.log(`🔍 Shortages Generic Name Search Starting: "${genericName}"`);

      // Try multiple search variations for better results
      const searchVariations = [
        `generic_name:"${genericName}"`, // exact match
        `generic_name:${genericName}*`, // starts with
        `generic_name:*${genericName}*`, // contains
      ];

      let response = null;
      let lastError = null;
      let workingQuery = null;
      
      console.log(`📋 Trying ${searchVariations.length} different search variations`);
      
      for (const searchQuery of searchVariations) {
        try {
          console.log(`📍 Trying shortages generic search: ${searchQuery}`);
          const searchUrl = `${this.shortagesURL}?search=${encodeURIComponent(searchQuery)}&limit=${Math.min(limit, 100)}`;
          response = await this.makeApiRequest(searchUrl);

          if (response.data.results && response.data.results.length > 0) {
            workingQuery = searchQuery;
            console.log(`✅ Found shortages results with generic search: ${searchQuery}`);
            break;
          }
        } catch (err) {
          lastError = err;
          console.log(`❌ Shortages generic search failed for: ${searchQuery} - ${err.response?.status || err.code}`);
        }
      }
      
      // If no search worked, throw the last error
      if (!response || !response.data.results || response.data.results.length === 0) {
        console.log(`❌ Shortages Generic Name Search FAILED: "${genericName}" - No results found`);
        throw lastError || new Error('No drug shortages found matching the generic name');
      }

      console.log(`✅ Shortages Generic Name Search SUCCESS: "${genericName}"`);
      console.log(`🎯 Working query: ${workingQuery}`);
      console.log(`📊 Results found: ${response.data.results.length}`);

      // Cache the result
      this.cache.set(cacheKey, response.data);
      
      return { 
        data: response.data, 
        fromCache: false,
        searchInfo: {
          workingQuery,
          searchField: 'generic_name',
          totalVariationsAttempted: searchVariations.length
        }
      };
    } catch (error) {
      console.log(`❌ Shortages Generic Name Search ERROR: "${genericName}" - ${error.message}`);
      throw this.handleFDAError(error);
    }
  }

  /**
   * Search for drug shortages by brand/proprietary name
   * Note: OpenFDA drug shortages API uses 'proprietary_name' instead of 'brand_name'
   * @param {string} brandName - Brand/proprietary drug name
   * @param {number} limit - Maximum number of results (default: 10, max: 100)
   * @returns {Promise} FDA drug shortages API response
   */
  async searchShortagesByBrandName(brandName, limit = 10) {
    try {
      const cacheKey = `shortages_brand_${brandName.toLowerCase()}_${limit}`;
      
      // Check cache first
      const cachedResult = this.cache.get(cacheKey);
      if (cachedResult) {
        console.log(`🔍 Shortages Brand Name Cache HIT: "${brandName}" -> Found cached result`);
        return { data: cachedResult, fromCache: true };
      }

      console.log(`🔍 Shortages Brand Name Search Starting: "${brandName}"`);

      // Try multiple search variations - drug shortages uses 'proprietary_name'
      const searchVariations = [
        `proprietary_name:"${brandName}"`, // exact match with proprietary_name
        `proprietary_name:${brandName}*`, // starts with proprietary_name
        `proprietary_name:*${brandName}*`, // contains proprietary_name
        // Also try generic_name in case brand name is stored there
        `generic_name:"${brandName}"`, // exact match with generic_name
        `generic_name:${brandName}*`, // starts with generic_name
      ];

      let response = null;
      let lastError = null;
      let workingQuery = null;
      
      console.log(`📋 Trying ${searchVariations.length} different search variations for brand name`);
      
      for (const searchQuery of searchVariations) {
        try {
          console.log(`📍 Trying shortages brand search: ${searchQuery}`);
          const searchUrl = `${this.shortagesURL}?search=${encodeURIComponent(searchQuery)}&limit=${Math.min(limit, 100)}`;
          response = await this.makeApiRequest(searchUrl);

          if (response.data.results && response.data.results.length > 0) {
            workingQuery = searchQuery;
            console.log(`✅ Found shortages results with brand search: ${searchQuery}`);
            break;
          }
        } catch (err) {
          lastError = err;
          console.log(`❌ Shortages brand search failed for: ${searchQuery} - ${err.response?.status || err.code}`);
        }
      }
      
      // If no search worked, throw the last error
      if (!response || !response.data.results || response.data.results.length === 0) {
        console.log(`❌ Shortages Brand Name Search FAILED: "${brandName}" - No results found`);
        throw lastError || new Error('No drug shortages found matching the brand name');
      }

      console.log(`✅ Shortages Brand Name Search SUCCESS: "${brandName}"`);
      console.log(`🎯 Working query: ${workingQuery}`);
      console.log(`📊 Results found: ${response.data.results.length}`);

      // Cache the result
      this.cache.set(cacheKey, response.data);
      
      return { 
        data: response.data, 
        fromCache: false,
        searchInfo: {
          workingQuery,
          searchField: 'proprietary_name/generic_name',
          totalVariationsAttempted: searchVariations.length
        }
      };
    } catch (error) {
      console.log(`❌ Shortages Brand Name Search ERROR: "${brandName}" - ${error.message}`);
      throw this.handleFDAError(error);
    }
  }

  /**
   * Advanced drug shortages search with multiple criteria
   * @param {Object} criteria - Search criteria
   * @param {string} [criteria.packageNDC] - Package NDC number
   * @param {string} [criteria.genericName] - Generic name
   * @param {string} [criteria.brandName] - Brand/proprietary name
   * @param {string} [criteria.status] - Shortage status
   * @param {string} [criteria.therapeuticCategory] - Therapeutic category
   * @param {number} limit - Number of results
   * @returns {Promise} FDA drug shortages API response
   */
  async advancedShortagesSearch(criteria, limit = 10) {
    try {
      const searchTerms = [];
      
      if (criteria.packageNDC) {
        const cleanNDC = this.cleanNDC(criteria.packageNDC);
        searchTerms.push(`package_ndc:"${cleanNDC}"`);
      }
      if (criteria.genericName) {
        searchTerms.push(`generic_name:"${criteria.genericName}"`);
      }
      if (criteria.brandName) {
        searchTerms.push(`proprietary_name:"${criteria.brandName}"`);
      }
      if (criteria.status) {
        searchTerms.push(`status:"${criteria.status}"`);
      }
      if (criteria.therapeuticCategory) {
        searchTerms.push(`therapeutic_category:"${criteria.therapeuticCategory}"`);
      }

      if (searchTerms.length === 0) {
        throw new Error('At least one search criterion is required for drug shortages search');
      }

      const searchQuery = searchTerms.join(' AND ');
      const cacheKey = `shortages_advanced_${Buffer.from(searchQuery).toString('base64')}_${limit}`;
      
      // Check cache first
      const cachedResult = this.cache.get(cacheKey);
      if (cachedResult) {
        console.log(`🔍 Advanced Shortages Cache HIT: Found cached result`);
        return { data: cachedResult, fromCache: true };
      }

      console.log(`🔍 Advanced Shortages Search Starting with query: ${searchQuery}`);

      const searchUrl = `${this.shortagesURL}?search=${encodeURIComponent(searchQuery)}&limit=${Math.min(limit, 100)}`;
      const response = await this.makeApiRequest(searchUrl);

      console.log(`✅ Advanced Shortages Search SUCCESS`);
      console.log(`📊 Results found: ${response.data.results?.length || 0}`);

      // Cache the result
      this.cache.set(cacheKey, response.data);
      
      return { 
        data: response.data, 
        fromCache: false,
        searchInfo: {
          searchQuery,
          criteriaUsed: Object.keys(criteria).filter(key => criteria[key]),
          searchTerms: searchTerms.length
        }
      };
    } catch (error) {
      console.log(`❌ Advanced Shortages Search ERROR: ${error.message}`);
      throw this.handleFDAError(error);
    }
  }

  /**
   * Parse drug shortages data to extract key information
   * @param {Object} shortagesData - Raw FDA drug shortages response
   * @returns {Object} Parsed shortages information
   */
  parseShortagesData(shortagesData) {
    if (!shortagesData || !shortagesData.results || shortagesData.results.length === 0) {
      return null;
    }

    return shortagesData.results.map(shortage => ({
      // Basic identification
      product_info: {
        generic_name: shortage.generic_name || 'Not specified',
        proprietary_name: shortage.proprietary_name || 'Not specified',
        company_name: shortage.company_name || 'Not specified',
        package_ndc: shortage.package_ndc || 'Not specified',
        dosage_form: shortage.dosage_form || 'Not specified',
        strength: Array.isArray(shortage.strength) ? shortage.strength.join(', ') : (shortage.strength || 'Not specified'),
        therapeutic_category: Array.isArray(shortage.therapeutic_category) 
          ? shortage.therapeutic_category.join(', ') 
          : (shortage.therapeutic_category || 'Not specified')
      },

      // Shortage status and timeline
      shortage_info: {
        status: shortage.status || 'Unknown',
        availability: shortage.availability || 'Not specified',
        shortage_reason: shortage.shortage_reason || 'Not specified',
        initial_posting_date: shortage.initial_posting_date 
          ? new Date(shortage.initial_posting_date).toLocaleDateString() 
          : 'Not specified',
        update_date: shortage.update_date 
          ? new Date(shortage.update_date).toLocaleDateString() 
          : 'Not specified',
        change_date: shortage.change_date 
          ? new Date(shortage.change_date).toLocaleDateString() 
          : 'Not specified',
        discontinued_date: shortage.discontinued_date 
          ? new Date(shortage.discontinued_date).toLocaleDateString() 
          : null
      },

      // Additional information
      additional_info: {
        presentation: shortage.presentation || 'Not specified',
        related_info: shortage.related_info || null,
        related_info_link: shortage.related_info_link || null,
        resolved_note: shortage.resolved_note || null,
        contact_info: shortage.contact_info || null,
        update_type: shortage.update_type || 'Not specified'
      },

      // Summary for quick reference
      summary: {
        drug_name: `${shortage.proprietary_name || shortage.generic_name || 'Unknown Drug'}`,
        manufacturer: shortage.company_name || 'Unknown',
        current_status: shortage.status || 'Unknown',
        is_resolved: shortage.status && shortage.status.toLowerCase().includes('resolved'),
        has_alternatives: !!(shortage.related_info || shortage.related_info_link),
        shortage_duration: this.calculateShortageDuration(shortage.initial_posting_date, shortage.discontinued_date)
      },

      // Raw data for advanced users
      raw_data: shortage
    }));
  }

  /**
   * Calculate shortage duration
   * @param {string} startDate - Initial posting date
   * @param {string} endDate - Discontinued/resolved date
   * @returns {string} Human readable duration
   * @private
   */
  calculateShortageDuration(startDate, endDate) {
    if (!startDate) return 'Unknown';
    
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) !== 1 ? 's' : ''}`;
    return `${Math.floor(diffDays / 365)} year${Math.floor(diffDays / 365) !== 1 ? 's' : ''}`;
  }

  /**
   * Count total items in outline structure
   * @param {Array} outline - Outline array
   * @returns {number} Total item count
   * @private
   */
  countOutlineItems(outline) {
    return outline.length;
  }

  /**
   * Process individual paragraph into outline structure
   * @private
   */
  processParagraphToOutline(paragraph, index, options) {
    const trimmed = paragraph.trim();
    if (trimmed.length < options.minSentenceLength) return null;

    // Check for different paragraph types
    const paragraphType = this.identifyParagraphType(trimmed);
    
    switch (paragraphType) {
      case 'numbered_list':
        return this.parseNumberedList(trimmed, index);
      case 'bulleted_list':
        return this.parseBulletedList(trimmed, index);
      case 'heading':
        return this.parseHeading(trimmed, index);
      case 'subsection':
        return this.parseSubsection(trimmed, index);
      default:
        return this.parseRegularParagraph(trimmed, index, options);
    }
  }

  /**
   * Identify the type of paragraph structure
   * @private
   */
  identifyParagraphType(text) {
    // Check for numbered items (1., 2., (1), etc.)
    if (/^\s*(\d+\.|\(\d+\)|[a-z]\)|[A-Z]\.)\s/.test(text)) {
      return 'numbered_list';
    }
    
    // Check for bullet points
    if (/^\s*[•·\-\*\+]\s/.test(text)) {
      return 'bulleted_list';
    }
    
    // Check for headings (all caps, or ends with colon)
    if (/^[A-Z\s]{3,}:?\s*$/.test(text) || text.endsWith(':')) {
      return 'heading';
    }
    
    // Check for subsections (starts with capitalized phrase followed by colon or period)
    if (/^[A-Z][a-z\s]+[:.]/.test(text)) {
      return 'subsection';
    }
    
    return 'paragraph';
  }

  /**
   * Parse numbered list items
   * @private
   */
  parseNumberedList(text, index) {
    const items = [];
    const lines = text.split('\n');
    
    lines.forEach(line => {
      const match = line.match(/^\s*(\d+\.|\(\d+\)|[a-z]\)|[A-Z]\.)\s*(.+)$/);
      if (match) {
        const [, number, content] = match;
        items.push({
          type: 'numbered_item',
          number: number,
          content: content.trim(),
          level: 1,
          bullet_style: 'number'
        });
      } else if (line.trim()) {
        // Continuation of previous item
        if (items.length > 0) {
          items[items.length - 1].content += ' ' + line.trim();
        }
      }
    });

    return {
      type: 'numbered_list',
      paragraph_index: index,
      items: items,
      total_items: items.length
    };
  }

  /**
   * Parse bulleted list items
   * @private
   */
  parseBulletedList(text, index) {
    const items = [];
    const lines = text.split('\n');
    
    lines.forEach(line => {
      const match = line.match(/^\s*([•·\-\*\+])\s*(.+)$/);
      if (match) {
        const [, bullet, content] = match;
        const level = this.calculateIndentLevel(line);
        items.push({
          type: 'bullet_item',
          bullet: bullet,
          content: content.trim(),
          level: level,
          bullet_style: this.getBulletStyle(bullet)
        });
      } else if (line.trim()) {
        // Continuation of previous item
        if (items.length > 0) {
          items[items.length - 1].content += ' ' + line.trim();
        }
      }
    });

    return {
      type: 'bulleted_list',
      paragraph_index: index,
      items: items,
      total_items: items.length
    };
  }

  /**
   * Parse heading text
   * @private
   */
  parseHeading(text, index) {
    return {
      type: 'heading',
      paragraph_index: index,
      content: text.replace(/:$/, '').trim(),
      level: text === text.toUpperCase() ? 1 : 2,
      is_major: text === text.toUpperCase()
    };
  }

  /**
   * Parse subsection text
   * @private
   */
  parseSubsection(text, index) {
    const colonMatch = text.match(/^(.+?):\s*(.*)$/);
    if (colonMatch) {
      const [, title, content] = colonMatch;
      return {
        type: 'subsection',
        paragraph_index: index,
        title: title.trim(),
        content: content.trim(),
        level: 2,
        has_content: content.length > 0
      };
    }
    
    return this.parseRegularParagraph(text, index);
  }

  /**
   * Parse regular paragraph with sentence extraction
   * @private
   */
  parseRegularParagraph(text, index, options) {
    const sentences = this.extractSentences(text);
    const keyPhrases = this.extractKeyPhrases(text);
    
    return {
      type: 'paragraph',
      paragraph_index: index,
      content: text,
      sentences: sentences,
      key_phrases: keyPhrases,
      word_count: text.split(/\s+/).length,
      has_technical_terms: this.containsTechnicalTerms(text)
    };
  }

  /**
   * Extract sentences from text
   * @private
   */
  extractSentences(text) {
    return text
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 10)
      .map((sentence, index) => ({
        index: index + 1,
        content: sentence,
        is_important: this.isImportantSentence(sentence),
        contains_dosage: /\d+\s*(mg|mcg|g|ml|units?|tablet|capsule)/i.test(sentence),
        contains_warning: /(warning|caution|contraindication|adverse|side effect)/i.test(sentence)
      }));
  }

  /**
   * Extract key phrases from text
   * @private
   */
  extractKeyPhrases(text) {
    const phrases = [];
    
    // Medical condition patterns
    const conditions = text.match(/(?:treatment of|indicated for|used to treat)\s+([^.]+)/gi);
    if (conditions) {
      phrases.push(...conditions.map(c => ({ type: 'indication', phrase: c })));
    }
    
    // Dosage patterns
    const dosages = text.match(/\d+\s*(?:mg|mcg|g|ml|units?)\s*(?:once|twice|daily|per day)/gi);
    if (dosages) {
      phrases.push(...dosages.map(d => ({ type: 'dosage', phrase: d })));
    }
    
    // Warning patterns
    const warnings = text.match(/(?:do not|avoid|contraindicated|warning)[^.]+/gi);
    if (warnings) {
      phrases.push(...warnings.map(w => ({ type: 'warning', phrase: w })));
    }
    
    return phrases;
  }

  /**
   * Helper methods for text analysis
   * @private
   */
  calculateIndentLevel(line) {
    const leadingSpaces = line.match(/^\s*/)[0].length;
    return Math.floor(leadingSpaces / 2) + 1;
  }

  getBulletStyle(bullet) {
    const styles = {
      '•': 'bullet',
      '·': 'middle_dot',
      '-': 'dash',
      '*': 'asterisk',
      '+': 'plus'
    };
    return styles[bullet] || 'bullet';
  }

  isImportantSentence(sentence) {
    const importantWords = /\b(important|warning|caution|contraindicated|serious|severe|fatal|death|emergency)\b/i;
    return importantWords.test(sentence);
  }

  containsTechnicalTerms(text) {
    const technicalTerms = /\b(pharmacokinetic|bioavailability|metabolism|clearance|half-life|protein binding|cytochrome|enzyme)\b/i;
    return technicalTerms.test(text);
  }

  detectTextStructure(text) {
    return {
      has_numbered_lists: /^\s*\d+\./m.test(text),
      has_bullet_points: /^\s*[•·\-\*]/m.test(text),
      has_subsections: /^[A-Z][a-z\s]+:/m.test(text),
      has_all_caps_headings: /^[A-Z\s]{5,}$/m.test(text),
      estimated_complexity: this.estimateTextComplexity(text)
    };
  }

  estimateTextComplexity(text) {
    const wordCount = text.split(/\s+/).length;
    const sentenceCount = text.split(/[.!?]+/).length;
    const avgWordsPerSentence = wordCount / sentenceCount;
    
    if (avgWordsPerSentence > 25 || wordCount > 1000) return 'high';
    if (avgWordsPerSentence > 15 || wordCount > 500) return 'medium';
    return 'low';
  }

  countOutlineItems(outline) {
    return outline.reduce((total, section) => {
      if (section.items) return total + section.items.length;
      return total + 1;
    }, 0);
  }

  hasNumberedItems(text) {
    return /^\s*\d+\./m.test(text);
  }

  hasBulletItems(text) {
    return /^\s*[•·\-\*]/m.test(text);
  }

  /**
   * Handle FDA API errors
   * @param {Error} error - Axios error
   * @returns {Error} Formatted error
   */
  handleFDAError(error) {
    if (error.response) {
      // FDA API returned an error response
      const status = error.response.status;
      const message = error.response.data?.error?.message || 'FDA API error';
      
      if (status === 404) {
        return new Error('No drugs found matching the search criteria');
      } else if (status === 429) {
        return new Error('Too many requests to FDA API. Please try again later.');
      } else if (status >= 500) {
        return new Error('FDA API is currently unavailable. Please try again later.');
      }
      
      return new Error(`FDA API error: ${message}`);
    } else if (error.request) {
      // Network error
      return new Error('Unable to connect to FDA API. Please check your internet connection.');
    } else if (error.message.includes('timeout')) {
      return new Error('FDA API request timed out. Please try again.');
    } else {
      // Other error
      return new Error(error.message || 'Unknown error occurred while searching FDA database');
    }
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  getCacheStats() {
    return {
      keys: this.cache.keys().length,
      hits: this.cache.getStats().hits,
      misses: this.cache.getStats().misses,
      ksize: this.cache.getStats().ksize,
      vsize: this.cache.getStats().vsize
    };
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.flushAll();
  }
}

module.exports = new FDAService();