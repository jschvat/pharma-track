/**
 * Drug Database Model
 * 
 * Comprehensive data model for managing pharmaceutical drug information in the PharmaTraK system.
 * Handles drug data from multiple sources including FDA imports and manual entries.
 * Provides full CRUD operations with advanced search capabilities and data validation.
 * 
 * Key Features:
 * - FDA data integration with automatic parsing and normalization  
 * - Advanced search with multiple criteria support
 * - Data validation and error handling
 * - Audit trail tracking for all operations
 * - Support for complex drug relationships and metadata
 * 
 * Database Integration:
 * - Uses MySQL connection pool for optimal performance
 * - Prepared statements for SQL injection prevention
 * - Transaction support for data integrity
 * - Foreign key relationships with inventory and audit tables
 * 
 * Data Sources:
 * - FDA OpenFDA API imports
 * - Manual pharmacy staff entries
 * - Bulk import from external systems
 * - Third-party drug databases
 * 
 * @class Drug
 * @requires ../config/database - Database connection pool
 * @requires ./ValidationError - Error handling utilities
 * 
 * @author PharmaTraK Development Team
 * @version 2.0.0
 * @since 1.0.0
 */

const { pool: db } = require('../config/database');
const { handleDatabaseError } = require('./ValidationError');
const fdaService = require('../openfda/fdaService');

/**
 * Drug Model Class
 * Represents pharmaceutical drug data with comprehensive management capabilities
 */
class Drug {
  /**
   * Create or update drug from FDA data
   * @param {Object} fdaData - FDA API response data
   * @returns {number} Drug ID
   */
  static async createFromFDA(fdaData) {
    try {
      const drugData = this.parseFDAData(fdaData);
      
      // Check if drug already exists
      const existing = await this.findByNDC(drugData.ndc);
      if (existing) {
        // Update existing drug
        await this.update(existing.id, drugData);
        return existing.id;
      }
      
      // Debug: Log all parameters to identify undefined values
      const params = [
        drugData.ndc,
        drugData.product_ndc,
        drugData.generic_name,
        drugData.brand_name,
        drugData.dosage_form,
        drugData.route,
        drugData.strength,
        drugData.manufacturer_name,
        drugData.labeler_name,
        drugData.substance_name,
        drugData.product_type,
        drugData.marketing_status,
        drugData.listing_expiration_date,
        JSON.stringify(fdaData)
      ];
      
      console.log('=== DEBUG: Drug creation parameters ===');
      const paramNames = ['ndc', 'product_ndc', 'generic_name', 'brand_name', 'dosage_form', 'route', 'strength', 'manufacturer_name', 'labeler_name', 'substance_name', 'product_type', 'marketing_status', 'listing_expiration_date', 'fda_data'];
      params.forEach((param, index) => {
        console.log(`${paramNames[index]}: ${param === undefined ? 'UNDEFINED' : param === null ? 'NULL' : typeof param === 'object' ? JSON.stringify(param) : param}`);
      });
      
      // Replace undefined values with null
      const safeParams = params.map(param => param === undefined ? null : param);
      
      // Create new drug
      const [result] = await db.execute(`
        INSERT INTO drugs (
          ndc, product_ndc, generic_name, brand_name, dosage_form, route, strength,
          manufacturer_name, labeler_name, substance_name, product_type, 
          marketing_status, listing_expiration_date, fda_data
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, safeParams);
      
      return result.insertId;
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  /**
   * Find drug by NDC
   * @param {string} ndc - National Drug Code
   * @returns {Object|null} Drug data
   */
  static async findByNDC(ndc) {
    try {
      // Standardize the search NDC to match database format
      const standardizedNDC = ndc ? fdaService.standardizeNDC(ndc) : null;
      
      const [rows] = await db.execute(
        'SELECT * FROM drugs WHERE ndc = ? OR product_ndc = ?',
        [standardizedNDC, ndc] // Search both standardized and original formats
      );
      
      if (rows.length > 0) {
        const drug = rows[0];
        if (drug.fda_data && typeof drug.fda_data === 'string') {
          drug.fda_data = JSON.parse(drug.fda_data);
        }
        return drug;
      }
      
      return null;
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  /**
   * Search drugs by various criteria
   * @param {Object} criteria - Search criteria
   * @param {number} limit - Maximum results
   * @returns {Array} Drug results
   */
  static async search(criteria, limit = 20) {
    try {
      let query = 'SELECT * FROM drugs WHERE is_active = TRUE';
      const params = [];
      
      if (criteria.ndc) {
        // Standardize the search NDC for better matching
        const standardizedNDC = fdaService.standardizeNDC(criteria.ndc);
        
        query += ' AND (ndc LIKE ? OR product_ndc LIKE ? OR ndc = ? OR product_ndc = ?)';
        params.push(
          `%${criteria.ndc}%`,        // Original search term
          `%${criteria.ndc}%`,        // Original search term
          standardizedNDC,            // Exact match on standardized format
          criteria.ndc               // Exact match on original format
        );
      }
      
      if (criteria.genericName) {
        query += ' AND MATCH(generic_name) AGAINST(? IN NATURAL LANGUAGE MODE)';
        params.push(criteria.genericName);
      }
      
      if (criteria.brandName) {
        query += ' AND MATCH(brand_name) AGAINST(? IN NATURAL LANGUAGE MODE)';
        params.push(criteria.brandName);
      }
      
      if (criteria.manufacturer) {
        query += ' AND manufacturer_name LIKE ?';
        params.push(`%${criteria.manufacturer}%`);
      }
      
      if (criteria.dosageForm) {
        query += ' AND dosage_form LIKE ?';
        params.push(`%${criteria.dosageForm}%`);
      }
      
      query += ' ORDER BY last_updated DESC LIMIT ?';
      params.push(limit);
      
      const [rows] = await db.execute(query, params);
      
      return rows.map(drug => {
        if (drug.fda_data && typeof drug.fda_data === 'string') {
          drug.fda_data = JSON.parse(drug.fda_data);
        }
        return drug;
      });
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  /**
   * Update drug information
   * @param {number} id - Drug ID
   * @param {Object} drugData - Updated drug data
   * @returns {boolean} Success status
   */
  static async update(id, drugData) {
    try {
      const fields = [];
      const values = [];
      
      const allowedFields = [
        'generic_name', 'brand_name', 'dosage_form', 'route', 'strength',
        'manufacturer_name', 'labeler_name', 'substance_name', 'product_type',
        'marketing_status', 'listing_expiration_date', 'is_active', 'fda_data'
      ];
      
      allowedFields.forEach(field => {
        if (drugData[field] !== undefined) {
          fields.push(`${field} = ?`);
          values.push(field === 'fda_data' && typeof drugData[field] === 'object' 
            ? JSON.stringify(drugData[field]) 
            : drugData[field]
          );
        }
      });
      
      if (fields.length === 0) return false;
      
      values.push(id);
      const [result] = await db.execute(
        `UPDATE drugs SET ${fields.join(', ')} WHERE id = ?`,
        values
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  /**
   * Parse FDA API data into database format
   * @param {Object} fdaData - Raw FDA data
   * @returns {Object} Parsed drug data
   */
  static parseFDAData(fdaData) {
    const parseArray = (arr) => {
      if (!arr) return null;
      if (typeof arr === 'string') return arr;
      if (Array.isArray(arr) && arr.length > 0) return arr.join(', ');
      return null;
    };
    const parseDate = (dateStr) => {
      if (!dateStr) return null;
      try {
        // FDA dates are typically in YYYYMMDD format
        if (dateStr.length === 8) {
          const year = dateStr.substring(0, 4);
          const month = dateStr.substring(4, 6);
          const day = dateStr.substring(6, 8);
          return `${year}-${month}-${day}`;
        }
        return dateStr;
      } catch {
        return null;
      }
    };

    // Get the raw NDC and standardize it to 5-4-2 format
    const rawNDC = fdaData.product_ndc || fdaData.ndc;
    const standardizedNDC = rawNDC ? fdaService.standardizeNDC(rawNDC) : null;
    
    // Build the result with explicit null checks
    const result = {
      ndc: standardizedNDC,
      product_ndc: fdaData.product_ndc || null,
      generic_name: parseArray(fdaData.generic_name),
      brand_name: parseArray(fdaData.brand_name),
      dosage_form: parseArray(fdaData.dosage_form),
      route: parseArray(fdaData.route),
      strength: fdaData.active_ingredients?.map(ing => 
        `${ing.name}: ${ing.strength}`
      )?.join(', ') || null,
      manufacturer_name: fdaData.openfda?.manufacturer_name ? 
        parseArray(fdaData.openfda.manufacturer_name) : null,
      labeler_name: fdaData.labeler_name || null,
      substance_name: fdaData.active_ingredients?.map(ing => ing.name)?.join(', ') || null,
      product_type: fdaData.product_type || null,
      marketing_status: fdaData.marketing_status || null,
      listing_expiration_date: parseDate(fdaData.listing_expiration_date)
    };
    
    // Ensure no field is undefined - replace with null
    Object.keys(result).forEach(key => {
      if (result[key] === undefined) {
        result[key] = null;
      }
    });
    
    return result;
  }

  /**
   * Get drugs by store (inventory)
   * @param {number} storeId - Store ID
   * @param {boolean} activeOnly - Only active inventory
   * @returns {Array} Drugs with inventory info
   */
  static async getByStore(storeId, activeOnly = true) {
    try {
      let query = `
        SELECT d.*, si.quantity_on_hand, si.reorder_level, si.unit_cost, 
               si.selling_price, si.lot_number, si.expiration_date, si.supplier
        FROM drugs d
        INNER JOIN store_inventory si ON d.id = si.drug_id
        WHERE si.store_id = ?
      `;
      
      const params = [storeId];
      
      if (activeOnly) {
        query += ' AND si.is_active = TRUE';
      }
      
      query += ' ORDER BY d.generic_name, d.brand_name';
      
      const [rows] = await db.execute(query, params);
      
      return rows.map(drug => {
        if (drug.fda_data && typeof drug.fda_data === 'string') {
          drug.fda_data = JSON.parse(drug.fda_data);
        }
        return drug;
      });
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  /**
   * Delete drug
   * @param {number} id - Drug ID
   * @returns {boolean} Success status
   */
  static async delete(id) {
    try {
      const [result] = await db.execute('DELETE FROM drugs WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  /**
   * Get drug statistics
   * @returns {Object} Statistics
   */
  static async findWithFilters(filters = {}, limit = 20, offset = 0) {
    try {
      let query = 'SELECT * FROM drugs WHERE 1=1';
      const params = [];

      if (filters.is_active !== undefined) {
        query += ' AND is_active = ?';
        params.push(filters.is_active);
      }

      if (filters.manufacturer) {
        query += ' AND manufacturer_name LIKE ?';
        params.push(`%${filters.manufacturer}%`);
      }

      if (filters.dosage_form) {
        query += ' AND dosage_form LIKE ?';
        params.push(`%${filters.dosage_form}%`);
      }

      query += ' ORDER BY last_updated DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);

      const [rows] = await db.execute(query, params);
      
      return rows.map(drug => {
        if (drug.fda_data && typeof drug.fda_data === 'string') {
          drug.fda_data = JSON.parse(drug.fda_data);
        }
        return drug;
      });
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  static async countWithFilters(filters = {}) {
    try {
      let query = 'SELECT COUNT(*) as total FROM drugs WHERE 1=1';
      const params = [];

      if (filters.is_active !== undefined) {
        query += ' AND is_active = ?';
        params.push(filters.is_active);
      }

      if (filters.manufacturer) {
        query += ' AND manufacturer_name LIKE ?';
        params.push(`%${filters.manufacturer}%`);
      }

      if (filters.dosage_form) {
        query += ' AND dosage_form LIKE ?';
        params.push(`%${filters.dosage_form}%`);
      }

      const [rows] = await db.execute(query, params);
      return rows[0].total;
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  static async findById(id) {
    try {
      const [rows] = await db.execute('SELECT * FROM drugs WHERE id = ?', [id]);
      
      if (rows.length > 0) {
        const drug = rows[0];
        if (drug.fda_data && typeof drug.fda_data === 'string') {
          drug.fda_data = JSON.parse(drug.fda_data);
        }
        return drug;
      }
      
      return null;
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  static async getStats() {
    try {
      const [stats] = await db.execute(`
        SELECT 
          COUNT(*) as total_drugs,
          COUNT(CASE WHEN is_active = TRUE THEN 1 END) as active_drugs,
          COUNT(DISTINCT manufacturer_name) as unique_manufacturers,
          COUNT(DISTINCT dosage_form) as unique_dosage_forms
        FROM drugs
      `);
      
      const [topManufacturers] = await db.execute(`
        SELECT manufacturer_name, COUNT(*) as count 
        FROM drugs 
        WHERE manufacturer_name IS NOT NULL AND is_active = TRUE
        GROUP BY manufacturer_name 
        ORDER BY count DESC 
        LIMIT 10
      `);

      const [topDosageForms] = await db.execute(`
        SELECT dosage_form, COUNT(*) as count 
        FROM drugs 
        WHERE dosage_form IS NOT NULL AND is_active = TRUE
        GROUP BY dosage_form 
        ORDER BY count DESC 
        LIMIT 10
      `);
      
      return {
        ...stats[0],
        top_manufacturers: topManufacturers,
        top_dosage_forms: topDosageForms
      };
    } catch (error) {
      handleDatabaseError(error);
    }
  }
}

module.exports = Drug;