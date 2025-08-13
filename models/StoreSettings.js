const { pool: db } = require('../config/database');
const { handleDatabaseError } = require('./ValidationError');

class StoreSettings {
  static async create(settingData) {
    try {
      const { 
        store_id, 
        setting_key, 
        setting_value, 
        description, 
        data_type = 'string',
        is_system = false,
        created_by,
        updated_by
      } = settingData;
      
      // Validate JSON value if data_type is json
      if (data_type === 'json' && typeof setting_value === 'string') {
        try {
          JSON.parse(setting_value);
        } catch (err) {
          throw new Error('Invalid JSON value for setting');
        }
      }
      
      const [result] = await db.execute(
        `INSERT INTO store_settings 
         (store_id, setting_key, setting_value, description, data_type, is_system, created_by, updated_by) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [store_id, setting_key, JSON.stringify(setting_value), description, data_type, is_system, created_by, updated_by]
      );
      
      return result.insertId;
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  static async findById(id) {
    try {
      const [rows] = await db.execute(
        `SELECT ss.*, 
                s.name as store_name,
                cu.name as created_by_name,
                uu.name as updated_by_name
         FROM store_settings ss
         LEFT JOIN stores s ON ss.store_id = s.id
         LEFT JOIN users cu ON ss.created_by = cu.id
         LEFT JOIN users uu ON ss.updated_by = uu.id
         WHERE ss.id = ?`,
        [id]
      );
      
      if (rows[0]) {
        rows[0].setting_value = JSON.parse(rows[0].setting_value);
      }
      
      return rows[0];
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  static async findByStoreAndKey(store_id, setting_key) {
    try {
      const [rows] = await db.execute(
        `SELECT * FROM store_settings 
         WHERE store_id = ? AND setting_key = ?`,
        [store_id, setting_key]
      );
      
      if (rows[0]) {
        rows[0].setting_value = JSON.parse(rows[0].setting_value);
      }
      
      return rows[0];
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  static async findByStore(store_id, filters = {}) {
    try {
      let query = `
        SELECT ss.*, 
               cu.name as created_by_name,
               uu.name as updated_by_name
        FROM store_settings ss
        LEFT JOIN users cu ON ss.created_by = cu.id
        LEFT JOIN users uu ON ss.updated_by = uu.id
        WHERE ss.store_id = ?
      `;
      const params = [store_id];

      if (filters.is_system !== undefined) {
        query += ' AND ss.is_system = ?';
        params.push(filters.is_system);
      }

      if (filters.setting_key) {
        query += ' AND ss.setting_key LIKE ?';
        params.push(`%${filters.setting_key}%`);
      }

      query += ' ORDER BY ss.setting_key ASC';

      const [rows] = await db.execute(query, params);
      
      return rows.map(row => ({
        ...row,
        setting_value: JSON.parse(row.setting_value)
      }));
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  static async update(id, settingData, updated_by) {
    try {
      const currentSetting = await this.findById(id);
      if (!currentSetting) {
        throw new Error('Setting not found');
      }

      const fields = [];
      const values = [];
      
      Object.keys(settingData).forEach(key => {
        if (settingData[key] !== undefined && key !== 'id' && key !== 'store_id') {
          let value = settingData[key];
          
          if (key === 'setting_value') {
            // Always store as JSON string
            value = JSON.stringify(value);
          }
          
          fields.push(`${key} = ?`);
          values.push(value);
        }
      });
      
      if (fields.length === 0) return false;
      
      // Add updated_by and timestamp
      fields.push('updated_by = ?', 'updated_at = CURRENT_TIMESTAMP');
      values.push(updated_by, id);
      
      // Log the change in history table
      await this.logSettingChange(
        id,
        currentSetting.store_id,
        currentSetting.setting_key,
        currentSetting.setting_value,
        settingData.setting_value || currentSetting.setting_value,
        updated_by
      );
      
      const [result] = await db.execute(
        `UPDATE store_settings SET ${fields.join(', ')} WHERE id = ?`,
        values
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  static async delete(id) {
    try {
      const [result] = await db.execute('DELETE FROM store_settings WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  static async logSettingChange(store_setting_id, store_id, setting_key, old_value, new_value, changed_by, change_reason = null) {
    try {
      await db.execute(
        `INSERT INTO store_settings_history 
         (store_setting_id, store_id, setting_key, old_value, new_value, changed_by, change_reason) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          store_setting_id,
          store_id,
          setting_key,
          JSON.stringify(old_value),
          JSON.stringify(new_value),
          changed_by,
          change_reason
        ]
      );
    } catch (error) {
      console.error('Failed to log setting change:', error);
      // Don't throw error - history logging is non-critical
    }
  }

  static async getSettingHistory(store_id, setting_key = null, limit = 50) {
    try {
      let query = `
        SELECT ssh.*, 
               u.name as changed_by_name,
               ss.setting_key
        FROM store_settings_history ssh
        LEFT JOIN users u ON ssh.changed_by = u.id
        LEFT JOIN store_settings ss ON ssh.store_setting_id = ss.id
        WHERE ssh.store_id = ?
      `;
      const params = [store_id];

      if (setting_key) {
        query += ' AND ssh.setting_key = ?';
        params.push(setting_key);
      }

      query += ' ORDER BY ssh.changed_at DESC LIMIT ?';
      params.push(Math.min(limit, 500)); // Cap at 500 records

      const [rows] = await db.execute(query, params);
      
      return rows.map(row => ({
        ...row,
        old_value: row.old_value ? JSON.parse(row.old_value) : null,
        new_value: JSON.parse(row.new_value)
      }));
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  static async getDefaultSettings(store_id) {
    try {
      const settings = await this.findByStore(store_id);
      
      // Convert to key-value object for easy consumption
      const settingsObj = {};
      settings.forEach(setting => {
        settingsObj[setting.setting_key] = setting.setting_value;
      });
      
      return settingsObj;
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  static async initializeDefaultSettings(store_id, admin_user_id) {
    try {
      const defaultSettings = [
        {
          setting_key: 'default_theme',
          setting_value: 'bootstrap',
          description: 'Default theme for all users in this store',
          data_type: 'string'
        },
        {
          setting_key: 'default_font_family',
          setting_value: 'system',
          description: 'Default font family for all users in this store',
          data_type: 'string'
        },
        {
          setting_key: 'default_font_size',
          setting_value: 'medium',
          description: 'Default font size for all users in this store',
          data_type: 'string'
        },
        {
          setting_key: 'session_timeout_hours',
          setting_value: 8,
          description: 'Session timeout in hours for store users',
          data_type: 'number'
        },
        {
          setting_key: 'auto_backup_enabled',
          setting_value: true,
          description: 'Enable automatic daily backups for this store',
          data_type: 'boolean'
        },
        {
          setting_key: 'low_stock_threshold',
          setting_value: 10,
          description: 'Default low stock threshold for inventory alerts',
          data_type: 'number'
        },
        {
          setting_key: 'expiration_alert_days',
          setting_value: 30,
          description: 'Days before expiration to show alerts',
          data_type: 'number'
        },
        {
          setting_key: 'require_prescription_verification',
          setting_value: true,
          description: 'Require prescription verification for controlled substances',
          data_type: 'boolean'
        }
      ];

      for (const setting of defaultSettings) {
        // Check if setting already exists
        const existing = await this.findByStoreAndKey(store_id, setting.setting_key);
        
        if (!existing) {
          await this.create({
            store_id,
            ...setting,
            is_system: false,
            created_by: admin_user_id,
            updated_by: admin_user_id
          });
        }
      }

      return true;
    } catch (error) {
      console.error('Failed to initialize default settings:', error);
      return false;
    }
  }

  static async validateStoreAdminAccess(user_id, store_id) {
    try {
      // Check if user is admin of the specific store
      const [rows] = await db.execute(
        'SELECT id FROM stores WHERE admin_user_id = ? AND id = ?',
        [user_id, store_id]
      );
      
      return rows.length > 0;
    } catch (error) {
      console.error('Failed to validate store admin access:', error);
      return false;
    }
  }
}

module.exports = StoreSettings;