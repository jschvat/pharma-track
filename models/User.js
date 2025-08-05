const db = require('../config/database');
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
    const [rows] = await db.execute(
      'SELECT id, name, email, phone, address, store_id, role, is_active, date_created FROM users WHERE id = ?',
      [id]
    );
    return rows[0];
  }

  static async findByEmail(email) {
    const [rows] = await db.execute(
      'SELECT * FROM users WHERE email = ?',
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
}

module.exports = User;