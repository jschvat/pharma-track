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
  }

  /**
   * Search for drugs by NDC number
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
        return { data: cachedResult, fromCache: true };
      }

      // Try multiple NDC formats for search
      const searchFormats = [
        ndc, // original format as provided (try first)
        cleanNDC, // clean digits only
        this.formatNDC(cleanNDC), // formatted version using our logic
        // Try specific patterns based on NDC length
        cleanNDC.length === 8 ? `${cleanNDC.slice(0, 5)}-${cleanNDC.slice(5)}` : null, // 5-3 pattern
        cleanNDC.length === 8 ? `${cleanNDC.slice(0, 4)}-${cleanNDC.slice(4, 7)}-${cleanNDC.slice(7)}` : null, // 4-3-1 pattern
        cleanNDC.length === 9 ? `${cleanNDC.slice(0, 5)}-${cleanNDC.slice(5, 8)}-${cleanNDC.slice(8)}` : null, // 5-3-1
        cleanNDC.length === 10 ? `${cleanNDC.slice(0, 5)}-${cleanNDC.slice(5, 9)}-${cleanNDC.slice(9)}` : null, // 5-4-1
        cleanNDC.length === 11 ? `${cleanNDC.slice(0, 5)}-${cleanNDC.slice(5, 9)}-${cleanNDC.slice(9)}` : null // 5-4-2
      ].filter(Boolean); // Remove null entries

      let response = null;
      let lastError = null;

      // Try each format until one works
      for (const format of searchFormats) {
        try {
          console.log(`Trying NDC format: "${format}"`);
          response = await axios.get(this.baseURL, {
            params: {
              search: `product_ndc:"${format}"`,
              limit: 10
            },
            timeout: this.timeout,
            headers: {
              'User-Agent': 'PharmaTrack/1.0 (pharmacy management system)'
            }
          });

          // If we got results, break out of the loop
          if (response.data.results && response.data.results.length > 0) {
            console.log(`Found results with NDC format: "${format}"`);
            break;
          }
        } catch (err) {
          console.log(`NDC format "${format}" failed:`, err.message);
          lastError = err;
          response = null;
        }
      }

      // If none of the formats worked, throw the last error
      if (!response || !response.data.results || response.data.results.length === 0) {
        throw lastError || new Error('No results found for any NDC format');
      }

      // Cache the result
      this.cache.set(cacheKey, response.data);
      
      return { data: response.data, fromCache: false };
    } catch (error) {
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