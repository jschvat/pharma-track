/**
 * Product Labeling Cache Model
 * 
 * Database model for managing FDA product labeling data cache.
 * Provides intelligent caching, automatic expiration, and comprehensive
 * labeling data management indexed by NDC.
 * 
 * Features:
 * - NDC-based cache lookup with automatic FDA API fallback
 * - 90-day cache expiration with automatic cleanup
 * - Structured labeling data storage and retrieval
 * - Performance-optimized database operations
 * - Comprehensive error handling
 * 
 * @class ProductLabelingCache
 * @requires ../config/database
 * @requires ../openfda/fdaService
 * 
 * @author PharmaTraK Development Team
 * @version 2.0.0
 */

const { pool: db } = require('../config/database');
const fdaService = require('../openfda/fdaService');
const debugLogger = require('../utilities/debug/debugLogger');

class ProductLabelingCache {
  
  /**
   * Get or fetch product labeling data by NDC
   * 
   * Intelligent cache-first lookup that:
   * 1. Checks local cache for valid (non-expired) data
   * 2. Falls back to FDA API if cache miss or expired
   * 3. Stores FDA response in cache for future lookups
   * 4. Returns structured labeling data
   * 
   * @param {string} ndc - National Drug Code
   * @returns {Promise<Object|null>} Labeling data or null if not found
   */
  static async getByNDC(ndc) {
    try {
      debugLogger.functionEntry('ProductLabelingCache.getByNDC', { ndc });
      
      // Clean NDC format
      const cleanNDC = this.cleanNDC(ndc);
      
      // Step 1: Check cache first
      debugLogger.info('Checking labeling cache for NDC', { ndc: cleanNDC });
      const cached = await this.getCachedByNDC(cleanNDC);
      
      if (cached && !this.isCacheExpired(cached)) {
        debugLogger.info('Found valid cached labeling data', { 
          ndc: cleanNDC,
          cachedAt: cached.cached_at,
          expiresAt: cached.cache_expires_at
        });
        return this.formatLabelingData(cached);
      }
      
      // Step 2: Cache miss or expired - fetch from FDA
      debugLogger.info('Cache miss or expired - fetching from FDA API', { ndc: cleanNDC });
      
      const fdaResult = await fdaService.searchLabelingByNDC(cleanNDC, 1);
      
      if (!fdaResult.data.results || fdaResult.data.results.length === 0) {
        debugLogger.warn('No FDA labeling data found for NDC', { ndc: cleanNDC });
        return null;
      }
      
      // Step 3: Parse and cache FDA data
      const fdaData = fdaResult.data.results[0];
      const parsedData = fdaService.parseLabelingData(fdaResult.data);
      
      debugLogger.info('Caching FDA labeling data', { 
        ndc: cleanNDC,
        setId: parsedData?.set_id,
        hasWarnings: !!parsedData?.warnings
      });
      
      await this.cacheLabeling(cleanNDC, fdaData, parsedData);
      
      // Step 4: Return formatted data
      return this.formatLabelingData({
        ndc: cleanNDC,
        labeling_data: fdaData,
        ...parsedData,
        cached_at: new Date(),
        from_cache: false
      });
      
    } catch (error) {
      debugLogger.error('Error in ProductLabelingCache.getByNDC', {
        error: error.message,
        ndc: ndc
      });
      throw error;
    }
  }
  
  /**
   * Get cached labeling data by NDC (internal method)
   * @param {string} ndc - Cleaned NDC
   * @returns {Promise<Object|null>} Cached data or null
   */
  static async getCachedByNDC(ndc) {
    try {
      const [rows] = await db.execute(
        'SELECT * FROM product_labeling_cache WHERE ndc = ? AND is_active = TRUE',
        [ndc]
      );
      
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      debugLogger.error('Error fetching cached labeling data', { error: error.message, ndc });
      throw error;
    }
  }
  
  /**
   * Cache labeling data in database
   * @param {string} ndc - NDC number
   * @param {Object} fdaData - Raw FDA labeling data
   * @param {Object} parsedData - Parsed labeling data
   */
  static async cacheLabeling(ndc, fdaData, parsedData) {
    try {
      const insertQuery = `
        INSERT INTO product_labeling_cache (
          ndc, generic_name, brand_name, manufacturer_name,
          product_type, dosage_form, route, labeling_data,
          indications_and_usage, warnings, contraindications,
          dosage_and_administration, storage_and_handling,
          fda_set_id, fda_product_id, effective_time, version
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          generic_name = VALUES(generic_name),
          brand_name = VALUES(brand_name),
          manufacturer_name = VALUES(manufacturer_name),
          product_type = VALUES(product_type),
          dosage_form = VALUES(dosage_form),
          route = VALUES(route),
          labeling_data = VALUES(labeling_data),
          indications_and_usage = VALUES(indications_and_usage),
          warnings = VALUES(warnings),
          contraindications = VALUES(contraindications),
          dosage_and_administration = VALUES(dosage_and_administration),
          storage_and_handling = VALUES(storage_and_handling),
          fda_set_id = VALUES(fda_set_id),
          fda_product_id = VALUES(fda_product_id),
          effective_time = VALUES(effective_time),
          version = VALUES(version),
          cached_at = CURRENT_TIMESTAMP,
          cache_expires_at = DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 90 DAY),
          is_active = TRUE
      `;
      
      const values = [
        ndc,
        parsedData?.product_info?.generic_name || null,
        parsedData?.product_info?.brand_name || null,
        parsedData?.product_info?.manufacturer || null,
        parsedData?.product_info?.product_type || null,
        parsedData?.product_info?.dosage_form || null,
        JSON.stringify(parsedData?.product_info?.route || []),
        JSON.stringify(fdaData),
        this.truncateText(parsedData?.indications_and_usage, 65535),
        this.truncateText(parsedData?.warnings, 65535),
        this.truncateText(parsedData?.contraindications, 65535),
        this.truncateText(parsedData?.dosage_and_administration, 65535),
        this.truncateText(parsedData?.storage_and_handling, 65535),
        parsedData?.set_id || null,
        parsedData?.product_id || null,
        this.parseEffectiveTime(parsedData?.effective_time),
        parsedData?.version || null
      ];
      
      await db.execute(insertQuery, values);
      
      debugLogger.info('Labeling data cached successfully', { ndc });
      
    } catch (error) {
      debugLogger.error('Error caching labeling data', { 
        error: error.message, 
        ndc,
        stack: error.stack
      });
      throw error;
    }
  }
  
  /**
   * Check if cache entry is expired
   * @param {Object} cached - Cached data row
   * @returns {boolean} True if expired
   */
  static isCacheExpired(cached) {
    if (!cached.cache_expires_at) return true;
    return new Date() > new Date(cached.cache_expires_at);
  }
  
  /**
   * Format labeling data for API response
   * @param {Object} data - Database or FDA data
   * @returns {Object} Formatted labeling data
   */
  static formatLabelingData(data) {
    return {
      ndc: data.ndc,
      
      // Product information
      product_info: {
        generic_name: data.generic_name,
        brand_name: data.brand_name,
        manufacturer: data.manufacturer_name,
        product_type: data.product_type,
        dosage_form: data.dosage_form,
        route: typeof data.route === 'string' ? JSON.parse(data.route) : data.route
      },
      
      // Clinical information
      indications_and_usage: data.indications_and_usage,
      warnings: data.warnings,
      contraindications: data.contraindications,
      dosage_and_administration: data.dosage_and_administration,
      storage_and_handling: data.storage_and_handling,
      
      // FDA metadata
      fda_metadata: {
        set_id: data.fda_set_id,
        product_id: data.fda_product_id,
        effective_time: data.effective_time,
        version: data.version
      },
      
      // Cache information
      cache_info: {
        cached_at: data.cached_at,
        expires_at: data.cache_expires_at,
        from_cache: data.from_cache !== false
      },
      
      // Full FDA data for detailed display
      raw_fda_data: typeof data.labeling_data === 'string' 
        ? JSON.parse(data.labeling_data) 
        : data.labeling_data
    };
  }
  
  /**
   * Search cached labeling data
   * @param {Object} criteria - Search criteria
   * @param {number} limit - Result limit
   * @param {number} offset - Result offset
   * @returns {Promise<Array>} Array of labeling data
   */
  static async search(criteria = {}, limit = 20, offset = 0) {
    try {
      let whereClause = 'WHERE is_active = TRUE AND cache_expires_at > NOW()';
      const params = [];
      
      if (criteria.ndc) {
        whereClause += ' AND ndc LIKE ?';
        params.push(`%${criteria.ndc}%`);
      }
      
      if (criteria.genericName) {
        whereClause += ' AND generic_name LIKE ?';
        params.push(`%${criteria.genericName}%`);
      }
      
      if (criteria.brandName) {
        whereClause += ' AND brand_name LIKE ?';
        params.push(`%${criteria.brandName}%`);
      }
      
      if (criteria.manufacturer) {
        whereClause += ' AND manufacturer_name LIKE ?';
        params.push(`%${criteria.manufacturer}%`);
      }
      
      const sql = `
        SELECT * FROM product_labeling_cache 
        ${whereClause}
        ORDER BY cached_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
      
      const [rows] = await db.execute(sql, params);
      
      return rows.map(row => this.formatLabelingData(row));
      
    } catch (error) {
      debugLogger.error('Error searching cached labeling data', { 
        error: error.message,
        criteria
      });
      throw error;
    }
  }
  
  /**
   * Get cache statistics
   * @returns {Promise<Object>} Cache statistics
   */
  static async getCacheStats() {
    try {
      const [totalRows] = await db.execute(
        'SELECT COUNT(*) as total FROM product_labeling_cache WHERE is_active = TRUE'
      );
      
      const [validRows] = await db.execute(
        'SELECT COUNT(*) as valid FROM product_labeling_cache WHERE is_active = TRUE AND cache_expires_at > NOW()'
      );
      
      const [expiredRows] = await db.execute(
        'SELECT COUNT(*) as expired FROM product_labeling_cache WHERE is_active = TRUE AND cache_expires_at <= NOW()'
      );
      
      return {
        total_entries: totalRows[0].total,
        valid_entries: validRows[0].valid,
        expired_entries: expiredRows[0].expired,
        cache_hit_ratio: validRows[0].valid / Math.max(totalRows[0].total, 1)
      };
      
    } catch (error) {
      debugLogger.error('Error getting cache statistics', { error: error.message });
      throw error;
    }
  }
  
  /**
   * Clean expired cache entries
   * @returns {Promise<number>} Number of entries cleaned
   */
  static async cleanExpiredCache() {
    try {
      const [result] = await db.execute(
        'UPDATE product_labeling_cache SET is_active = FALSE WHERE cache_expires_at <= NOW() AND is_active = TRUE'
      );
      
      debugLogger.info('Cleaned expired cache entries', { 
        entriesCleaned: result.affectedRows 
      });
      
      return result.affectedRows;
      
    } catch (error) {
      debugLogger.error('Error cleaning expired cache', { error: error.message });
      throw error;
    }
  }
  
  /**
   * Invalidate cache for specific NDC
   * @param {string} ndc - NDC to invalidate
   * @returns {Promise<boolean>} Success status
   */
  static async invalidateCache(ndc) {
    try {
      const cleanNDC = this.cleanNDC(ndc);
      
      const [result] = await db.execute(
        'UPDATE product_labeling_cache SET is_active = FALSE WHERE ndc = ?',
        [cleanNDC]
      );
      
      debugLogger.info('Cache invalidated for NDC', { 
        ndc: cleanNDC,
        rowsAffected: result.affectedRows
      });
      
      return result.affectedRows > 0;
      
    } catch (error) {
      debugLogger.error('Error invalidating cache', { error: error.message, ndc });
      throw error;
    }
  }
  
  /**
   * Utility Methods
   */
  
  /**
   * Clean NDC format
   * @param {string} ndc - Raw NDC
   * @returns {string} Cleaned NDC
   */
  static cleanNDC(ndc) {
    if (!ndc) return '';
    return ndc.replace(/[^\d-]/g, '').trim();
  }
  
  /**
   * Truncate text to fit database field limits
   * @param {string} text - Text to truncate
   * @param {number} maxLength - Maximum length
   * @returns {string|null} Truncated text or null
   */
  static truncateText(text, maxLength) {
    if (!text) return null;
    return text.length > maxLength ? text.substring(0, maxLength - 3) + '...' : text;
  }
  
  /**
   * Parse FDA effective time to MySQL date format
   * @param {string} effectiveTime - FDA effective time (YYYYMMDD)
   * @returns {string|null} MySQL date format or null
   */
  static parseEffectiveTime(effectiveTime) {
    if (!effectiveTime || effectiveTime.length !== 8) return null;
    
    try {
      const year = effectiveTime.substring(0, 4);
      const month = effectiveTime.substring(4, 6);
      const day = effectiveTime.substring(6, 8);
      return `${year}-${month}-${day}`;
    } catch (error) {
      return null;
    }
  }
}

module.exports = ProductLabelingCache;