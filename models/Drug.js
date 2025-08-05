const db = require('../config/database');
const { handleDatabaseError } = require('./ValidationError');

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
      
      // Create new drug
      const [result] = await db.execute(`
        INSERT INTO drugs (
          ndc, product_ndc, generic_name, brand_name, dosage_form, route, strength,
          manufacturer_name, labeler_name, substance_name, product_type, 
          marketing_status, listing_expiration_date, fda_data
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
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
      ]);
      
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
      const [rows] = await db.execute(
        'SELECT * FROM drugs WHERE ndc = ? OR product_ndc = ?',
        [ndc, ndc]
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
        query += ' AND (ndc LIKE ? OR product_ndc LIKE ?)';
        params.push(`%${criteria.ndc}%`, `%${criteria.ndc}%`);
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
    const parseArray = (arr) => arr && arr.length > 0 ? arr.join(', ') : null;
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

    return {
      ndc: fdaData.product_ndc || fdaData.ndc,
      product_ndc: fdaData.product_ndc,
      generic_name: parseArray(fdaData.generic_name),
      brand_name: parseArray(fdaData.brand_name),
      dosage_form: parseArray(fdaData.dosage_form),
      route: parseArray(fdaData.route),
      strength: parseArray(fdaData.active_ingredients?.map(ing => 
        `${ing.name}: ${ing.strength}`
      )),
      manufacturer_name: fdaData.openfda?.manufacturer_name ? 
        parseArray(fdaData.openfda.manufacturer_name) : null,
      labeler_name: fdaData.labeler_name,
      substance_name: fdaData.active_ingredients?.map(ing => ing.name).join(', '),
      product_type: fdaData.product_type,
      marketing_status: fdaData.marketing_status,
      listing_expiration_date: parseDate(fdaData.listing_expiration_date)
    };
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
      
      return stats[0];
    } catch (error) {
      handleDatabaseError(error);
    }
  }
}

module.exports = Drug;