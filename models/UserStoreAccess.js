const { pool: db } = require('../config/database');
const { handleDatabaseError } = require('./ValidationError');

class UserStoreAccess {
  /**
   * Get all stores a user has access to
   * @param {number} userId - User ID
   * @returns {Array} List of accessible stores
   */
  static async getUserStores(userId) {
    try {
      const [rows] = await db.execute(`
        SELECT 
          s.*,
          usa.access_level,
          usa.granted_at,
          usa.is_active as access_active
        FROM user_store_access usa
        INNER JOIN stores s ON usa.store_id = s.id
        WHERE usa.user_id = ? AND usa.is_active = 1
        ORDER BY s.name
      `, [userId]);
      
      return rows;
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  /**
   * Check if user has access to a specific store
   * @param {number} userId - User ID
   * @param {number} storeId - Store ID
   * @param {string} requiredLevel - Required access level ('admin' or 'user')
   * @returns {boolean} Whether user has access
   */
  static async hasStoreAccess(userId, storeId, requiredLevel = 'user') {
    try {
      const [rows] = await db.execute(`
        SELECT access_level
        FROM user_store_access
        WHERE user_id = ? AND store_id = ? AND is_active = 1
      `, [userId, storeId]);
      
      if (rows.length === 0) return false;
      
      const userLevel = rows[0].access_level;
      
      // Admin level includes user level access
      if (requiredLevel === 'user') {
        return ['admin', 'user'].includes(userLevel);
      }
      
      return userLevel === 'admin';
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  /**
   * Grant store access to a user
   * @param {number} userId - User ID
   * @param {number} storeId - Store ID
   * @param {string} accessLevel - Access level ('admin' or 'user')
   * @param {number} grantedBy - ID of user granting access
   * @returns {boolean} Success status
   */
  static async grantStoreAccess(userId, storeId, accessLevel = 'user', grantedBy) {
    try {
      await db.execute(`
        INSERT INTO user_store_access (user_id, store_id, access_level, granted_by)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
          access_level = VALUES(access_level),
          granted_by = VALUES(granted_by),
          granted_at = CURRENT_TIMESTAMP,
          is_active = 1
      `, [userId, storeId, accessLevel, grantedBy]);
      
      return true;
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  /**
   * Revoke store access from a user
   * @param {number} userId - User ID
   * @param {number} storeId - Store ID
   * @returns {boolean} Success status
   */
  static async revokeStoreAccess(userId, storeId) {
    try {
      const [result] = await db.execute(`
        UPDATE user_store_access
        SET is_active = 0
        WHERE user_id = ? AND store_id = ?
      `, [userId, storeId]);
      
      return result.affectedRows > 0;
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  /**
   * Get all users with access to a specific store
   * @param {number} storeId - Store ID
   * @returns {Array} List of users with store access
   */
  static async getStoreUsers(storeId) {
    try {
      const [rows] = await db.execute(`
        SELECT 
          u.id,
          u.name,
          u.email,
          u.role,
          usa.access_level,
          usa.granted_at,
          granter.name as granted_by_name
        FROM user_store_access usa
        INNER JOIN users u ON usa.user_id = u.id
        LEFT JOIN users granter ON usa.granted_by = granter.id
        WHERE usa.store_id = ? AND usa.is_active = 1
        ORDER BY usa.access_level DESC, u.name
      `, [storeId]);
      
      return rows;
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  /**
   * Update user's active store
   * @param {number} userId - User ID
   * @param {number} storeId - Store ID to set as active
   * @returns {boolean} Success status
   */
  static async setActiveStore(userId, storeId) {
    try {
      // Verify user has access to this store
      const hasAccess = await this.hasStoreAccess(userId, storeId);
      if (!hasAccess) {
        throw new Error('User does not have access to this store');
      }

      const [result] = await db.execute(`
        UPDATE users
        SET active_store_id = ?
        WHERE id = ?
      `, [storeId, userId]);
      
      return result.affectedRows > 0;
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  /**
   * Get user's current active store
   * @param {number} userId - User ID
   * @returns {Object|null} Active store information
   */
  static async getActiveStore(userId) {
    try {
      const [rows] = await db.execute(`
        SELECT s.*, usa.access_level
        FROM users u
        INNER JOIN stores s ON u.active_store_id = s.id
        INNER JOIN user_store_access usa ON (usa.user_id = u.id AND usa.store_id = s.id AND usa.is_active = 1)
        WHERE u.id = ?
      `, [userId]);
      
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      handleDatabaseError(error);
    }
  }
}

module.exports = UserStoreAccess;