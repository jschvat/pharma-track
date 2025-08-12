const { pool: db } = require('../config/database');
const bcrypt = require('bcryptjs');
const { handleDatabaseError } = require('./ValidationError');

class User {
  static async create(userData) {
    try {
      const { name, email, phone, password, address, store_id, role = 'user' } = userData;
      const hashedPassword = await bcrypt.hash(password, 12);
      
      // Clean phone number (remove non-digits)
      const cleanPhone = phone.replace(/[^\d]/g, '');
      
      const [result] = await db.execute(
        'INSERT INTO users (name, email, phone, password, address, store_id, role) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [name.trim(), email.toLowerCase(), cleanPhone, hashedPassword, address.trim(), store_id, role]
      );
      
      return result.insertId;
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  static async findById(id) {
    const [rows] = await db.execute(`
      SELECT 
        u.id, u.name, u.email, u.phone, u.address, u.store_id, u.role, 
        u.is_active, u.date_created, u.active_store_id,
        s.name as store_name,
        active_s.name as active_store_name
      FROM users u 
      LEFT JOIN stores s ON u.store_id = s.id
      LEFT JOIN stores active_s ON u.active_store_id = active_s.id
      WHERE u.id = ?`,
      [id]
    );
    return rows[0];
  }

  static async findByEmail(email) {
    const [rows] = await db.execute(`
      SELECT 
        u.*, 
        s.name as store_name,
        active_s.name as active_store_name
      FROM users u 
      LEFT JOIN stores s ON u.store_id = s.id
      LEFT JOIN stores active_s ON u.active_store_id = active_s.id
      WHERE u.email = ?`,
      [email]
    );
    return rows[0];
  }

  static async findByStoreId(store_id) {
    const [rows] = await db.execute(
      'SELECT id, name, email, phone, address, role, is_active, date_created FROM users WHERE store_id = ?',
      [store_id]
    );
    return rows;
  }

  static async findWithFilters(filters = {}, limit = 20, offset = 0) {
    try {
      let query = `SELECT 
        u.id, u.name, u.email, u.phone, u.address, u.store_id, u.role, u.is_active, u.date_created,
        s.name as store_name
      FROM users u 
      LEFT JOIN stores s ON u.store_id = s.id 
      WHERE 1=1`;
      const params = [];

      if (filters.store_id) {
        query += ' AND u.store_id = ?';
        params.push(parseInt(filters.store_id));
      }

      if (filters.role) {
        query += ' AND u.role = ?';
        params.push(filters.role);
      }

      if (filters.is_active !== undefined) {
        query += ' AND u.is_active = ?';
        params.push(filters.is_active ? 1 : 0);
      }

      if (filters.search) {
        query += ' AND (u.name LIKE ? OR u.email LIKE ?)';
        params.push(`%${filters.search}%`, `%${filters.search}%`);
      }

      // Ensure limit and offset are proper integers  
      const limitInt = parseInt(limit) || 20;
      const offsetInt = parseInt(offset) || 0;
      
      // Build LIMIT clause without parameters to avoid MySQL parameter binding issues
      query += ` ORDER BY u.date_created DESC LIMIT ${offsetInt}, ${limitInt}`;

      const [rows] = await db.execute(query, params);
      return rows;
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  static async countWithFilters(filters = {}) {
    try {
      let query = 'SELECT COUNT(*) as total FROM users u WHERE 1=1';
      const params = [];

      if (filters.store_id) {
        query += ' AND u.store_id = ?';
        params.push(parseInt(filters.store_id));
      }

      if (filters.role) {
        query += ' AND u.role = ?';
        params.push(filters.role);
      }

      if (filters.is_active !== undefined) {
        query += ' AND u.is_active = ?';
        params.push(filters.is_active ? 1 : 0);
      }

      if (filters.search) {
        query += ' AND (u.name LIKE ? OR u.email LIKE ?)';
        params.push(`%${filters.search}%`, `%${filters.search}%`);
      }

      const [rows] = await db.execute(query, params);
      return rows[0].total;
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  static async update(id, userData) {
    try {
      const fields = [];
      const values = [];
      
      Object.keys(userData).forEach(key => {
        if (userData[key] !== undefined && key !== 'id') {
          let value = userData[key];
          
          // Clean and format data based on field type
          if (key === 'phone' && value) {
            value = value.replace(/[^\d]/g, '');
          } else if (key === 'email' && value) {
            value = value.toLowerCase();
          } else if ((key === 'name' || key === 'address') && value) {
            value = value.trim();
          }
          
          fields.push(`${key} = ?`);
          values.push(value);
        }
      });
      
      if (fields.length === 0) return false;
      
      values.push(id);
      const [result] = await db.execute(
        `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
        values
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  static async delete(id) {
    try {
      const [result] = await db.execute('DELETE FROM users WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  static async comparePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  static async updatePassword(id, newPassword) {
    try {
      const hashedPassword = await bcrypt.hash(newPassword, 12);
      const [result] = await db.execute(
        'UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?',
        [hashedPassword, id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      handleDatabaseError(error);
    }
  }
}

module.exports = User;