const db = require('../config/database');
const { handleDatabaseError } = require('./ValidationError');

class Store {
  static async create(storeData) {
    try {
      const { name, address, state, zipcode, phone, fax, dea_registration_number, npi, admin_user_id } = storeData;
      
      // Clean and format data
      const cleanPhone = phone.replace(/[^\d]/g, '');
      const cleanFax = fax ? fax.replace(/[^\d]/g, '') : null;
      const upperState = state.toUpperCase();
      const upperDea = dea_registration_number.toUpperCase();
      
      const [result] = await db.execute(
        'INSERT INTO stores (name, address, state, zipcode, phone, fax, dea_registration_number, npi, admin_user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [name.trim(), address.trim(), upperState, zipcode, cleanPhone, cleanFax, upperDea, npi, admin_user_id]
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
}

module.exports = Store;