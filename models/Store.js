const { pool: db } = require('../config/database');
const { handleDatabaseError } = require('./ValidationError');

class Store {
  static async create(storeData) {
    try {
      const { name, address, city, state, zipcode, phone, fax, dea_registration_number, npi, admin_user_id } = storeData;
      
      // Clean and format data
      const cleanPhone = phone.replace(/[^\d]/g, '');
      const cleanFax = fax ? fax.replace(/[^\d]/g, '') : null;
      const cleanCity = city ? city.trim() : null;
      const upperState = state.toUpperCase();
      const upperDea = dea_registration_number.toUpperCase();
      
      const [result] = await db.execute(
        'INSERT INTO stores (name, address, city, state, zipcode, phone, fax, dea_registration_number, npi, admin_user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [name.trim(), address.trim(), cleanCity, upperState, zipcode, cleanPhone, cleanFax, upperDea, npi, admin_user_id]
      );
      
      return result.insertId;
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  static async findById(id) {
    const [rows] = await db.execute(
      `SELECT s.*, u.name as admin_name, u.email as admin_email 
       FROM stores s 
       LEFT JOIN users u ON s.admin_user_id = u.id 
       WHERE s.id = ?`,
      [id]
    );
    return rows[0];
  }

  static async findAll() {
    const [rows] = await db.execute(
      `SELECT s.*, u.name as admin_name, u.email as admin_email 
       FROM stores s 
       LEFT JOIN users u ON s.admin_user_id = u.id`
    );
    return rows;
  }

  static async findWithFilters(filters = {}, limit = 20, offset = 0) {
    try {
      let query = `
        SELECT s.*, u.name as admin_name, u.email as admin_email 
        FROM stores s 
        LEFT JOIN users u ON s.admin_user_id = u.id
        WHERE 1=1
      `;
      let whereConditions = [];

      if (filters.state) {
        whereConditions.push(`s.state = '${filters.state.replace(/'/g, "''")}'`);
      }

      if (filters.search) {
        const searchTerm = filters.search.replace(/'/g, "''");
        whereConditions.push(`(s.name LIKE '%${searchTerm}%' OR s.address LIKE '%${searchTerm}%' OR s.city LIKE '%${searchTerm}%' OR s.dea_registration_number LIKE '%${searchTerm}%' OR s.npi LIKE '%${searchTerm}%')`);
      }

      if (filters.admin_user_id) {
        whereConditions.push(`s.admin_user_id = ${parseInt(filters.admin_user_id)}`);
      }

      if (whereConditions.length > 0) {
        query += ' AND ' + whereConditions.join(' AND ');
      }

      // Ensure limit and offset are proper integers  
      const limitInt = Math.max(1, Math.min(parseInt(limit) || 20, 1000)); // Sanitize: 1-1000 range
      const offsetInt = Math.max(0, parseInt(offset) || 0); // Sanitize: non-negative
      
      query += ` ORDER BY s.date_created DESC LIMIT ${limitInt} OFFSET ${offsetInt}`;

      const [rows] = await db.query(query);
      return rows;
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  static async countWithFilters(filters = {}) {
    try {
      let query = 'SELECT COUNT(*) as total FROM stores s WHERE 1=1';
      const params = [];

      if (filters.state) {
        query += ' AND s.state = ?';
        params.push(filters.state);
      }

      if (filters.search) {
        query += ' AND (s.name LIKE ? OR s.address LIKE ? OR s.city LIKE ? OR s.dea_registration_number LIKE ? OR s.npi LIKE ?)';
        params.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
      }

      if (filters.admin_user_id) {
        query += ' AND s.admin_user_id = ?';
        params.push(parseInt(filters.admin_user_id));
      }

      const [rows] = await db.execute(query, params);
      return rows[0].total;
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  static async getStats() {
    try {
      const [stats] = await db.execute(`
        SELECT 
          COUNT(*) as total_stores,
          COUNT(DISTINCT state) as unique_states,
          COUNT(admin_user_id) as stores_with_admin,
          AVG(YEAR(CURDATE()) - YEAR(date_created)) as avg_age_years
        FROM stores
      `);
      
      const [stateStats] = await db.execute(`
        SELECT state, COUNT(*) as count 
        FROM stores 
        GROUP BY state 
        ORDER BY count DESC 
        LIMIT 10
      `);

      return {
        ...stats[0],
        states: stateStats
      };
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  static async findByDeaNumber(dea_registration_number) {
    const [rows] = await db.execute(
      'SELECT * FROM stores WHERE dea_registration_number = ?',
      [dea_registration_number]
    );
    return rows[0];
  }

  static async findByNpi(npi) {
    const [rows] = await db.execute(
      'SELECT * FROM stores WHERE npi = ?',
      [npi]
    );
    return rows[0];
  }

  static async update(id, storeData) {
    try {
      const fields = [];
      const values = [];
      
      Object.keys(storeData).forEach(key => {
        if (storeData[key] !== undefined && key !== 'id') {
          let value = storeData[key];
          
          // Clean and format data based on field type
          if ((key === 'phone' || key === 'fax') && value) {
            value = value.replace(/[^\d]/g, '');
          } else if (key === 'state' && value) {
            value = value.toUpperCase();
          } else if (key === 'dea_registration_number' && value) {
            value = value.toUpperCase();
          } else if ((key === 'name' || key === 'address' || key === 'city') && value) {
            value = value.trim();
          }
          
          fields.push(`${key} = ?`);
          values.push(value);
        }
      });
      
      if (fields.length === 0) return false;
      
      values.push(id);
      const [result] = await db.execute(
        `UPDATE stores SET ${fields.join(', ')} WHERE id = ?`,
        values
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  static async delete(id) {
    try {
      const [result] = await db.execute('DELETE FROM stores WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  static async getPublicStoreList() {
    try {
      const [rows] = await db.execute(
        'SELECT id, name, city, state FROM stores ORDER BY name'
      );
      return rows;
    } catch (error) {
      handleDatabaseError(error);
    }
  }
}

module.exports = Store;