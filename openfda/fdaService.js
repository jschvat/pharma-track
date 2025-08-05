const axios = require('axios');
const NodeCache = require('node-cache');

class FDAService {
  constructor() {
    this.baseURL = 'https://api.fda.gov/drug/ndc.json';
    this.cache = new NodeCache({ 
      stdTTL: 3600, // 1 hour cache
      checkperiod: 600 // check for expired keys every 10 minutes
    });
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

      const response = await axios.get(this.baseURL, {
        params: {
          search: `product_ndc:"${cleanNDC}"`,
          limit: 10
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
          search: `generic_name:"${genericName}"`,
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
          search: `brand_name:"${brandName}"`,
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
          search: `openfda.manufacturer_name:"${manufacturer}"`,
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
    
    // NDC should be 10 or 11 digits
    if (digits.length < 10 || digits.length > 11) {
      throw new Error('NDC must be 10 or 11 digits');
    }
    
    return digits;
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
   * Format NDC with standard dashes
   * @param {string} ndc - Raw NDC number
   * @returns {string} Formatted NDC (e.g., 12345-678-90)
   */
  formatNDC(ndc) {
    const cleaned = this.cleanNDC(ndc);
    
    if (cleaned.length === 10) {
      // Format as 5-3-2 or 4-4-2
      return `${cleaned.slice(0, 5)}-${cleaned.slice(5, 8)}-${cleaned.slice(8)}`;
    } else if (cleaned.length === 11) {
      // Format as 5-4-2
      return `${cleaned.slice(0, 5)}-${cleaned.slice(5, 9)}-${cleaned.slice(9)}`;
    }
    
    throw new Error('Invalid NDC length');
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