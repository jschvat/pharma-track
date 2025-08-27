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
   * Parse labeling data to extract key information
   * @param {Object} labelingData - Raw FDA labeling response
   * @returns {Object} Parsed labeling information
   */
  parseLabelingData(labelingData) {
    if (!labelingData || !labelingData.results || labelingData.results.length === 0) {
      return null;
    }

    const result = labelingData.results[0];
    
    return {
      product_id: result.id,
      set_id: result.set_id,
      version: result.version,
      effective_time: result.effective_time,
      
      // Basic product information
      product_info: {
        ndc: result.openfda?.product_ndc?.[0],
        generic_name: result.openfda?.generic_name?.[0],
        brand_name: result.openfda?.brand_name?.[0],
        manufacturer: result.openfda?.manufacturer_name?.[0],
        substance_name: result.openfda?.substance_name?.[0],
        product_type: result.openfda?.product_type?.[0],
        route: result.openfda?.route,
        dosage_form: result.openfda?.dosage_form?.[0]
      },

      // Clinical information
      indications_and_usage: result.indications_and_usage?.[0],
      contraindications: result.contraindications?.[0],
      warnings: result.warnings?.[0],
      precautions: result.precautions?.[0],
      adverse_reactions: result.adverse_reactions?.[0],
      drug_interactions: result.drug_interactions?.[0],
      
      // Dosage and administration
      dosage_and_administration: result.dosage_and_administration?.[0],
      overdosage: result.overdosage?.[0],
      
      // Physical description
      description: result.description?.[0],
      clinical_pharmacology: result.clinical_pharmacology?.[0],
      
      // Supply information
      how_supplied: result.how_supplied?.[0],
      storage_and_handling: result.storage_and_handling?.[0],
      
      // Pregnancy and nursing
      pregnancy: result.pregnancy?.[0],
      nursing_mothers: result.nursing_mothers?.[0],
      pediatric_use: result.pediatric_use?.[0],
      geriatric_use: result.geriatric_use?.[0],
      
      // Package information
      package_label_principal_display_panel: result.package_label_principal_display_panel,
      
      // Raw data for reference
      raw_data: result
    };
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