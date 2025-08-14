/**
 * God Mode User Model
 * 
 * Provides super administrator capabilities including:
 * - Store switching and multi-store access
 * - Cross-store user, drug, and transaction management
 * - Permission management and role changes
 * - Comprehensive audit logging
 * 
 * @author PharmaTraK Development Team
 * @version 1.0.0
 */

const { pool } = require('../config/database');
const bcrypt = require('bcrypt');

class GodModeUser {
    
    /**
     * Check if user has god mode privileges
     * @param {number} userId - User ID to check
     * @returns {Promise<boolean>} True if user has god mode
     */
    static async isGodModeUser(userId) {
        try {
            const [rows] = await pool.execute(
                'SELECT role FROM users WHERE id = ? AND is_active = TRUE',
                [userId]
            );
            return rows.length > 0 && rows[0].role === 'god_mode';
        } catch (error) {
            console.error('Error checking god mode status:', error);
            return false;
        }
    }
    
    /**
     * Get all accessible stores for a god mode user
     * @param {number} userId - God mode user ID
     * @returns {Promise<Array>} List of accessible stores
     */
    static async getAccessibleStores(userId) {
        try {
            const query = `
                SELECT 
                    s.*,
                    sa.access_level,
                    sa.granted_at,
                    sa.expires_at,
                    CASE WHEN sa.expires_at IS NULL OR sa.expires_at > NOW() THEN TRUE ELSE FALSE END as is_access_active,
                    COUNT(u.id) as user_count,
                    COUNT(DISTINCT si.drug_id) as drug_count
                FROM stores s
                LEFT JOIN store_access sa ON s.id = sa.store_id AND sa.user_id = ? AND sa.is_active = TRUE
                LEFT JOIN users u ON s.id = u.store_id AND u.is_active = TRUE
                LEFT JOIN store_inventory si ON s.id = si.store_id AND si.is_active = TRUE
                WHERE sa.store_id IS NOT NULL OR EXISTS (
                    SELECT 1 FROM users WHERE id = ? AND role = 'god_mode'
                )
                GROUP BY s.id, s.name, s.address, s.state, s.zipcode, s.phone, s.fax, 
                         s.dea_registration_number, s.npi, s.admin_user_id, s.date_created, s.updated_at,
                         sa.access_level, sa.granted_at, sa.expires_at
                ORDER BY s.name ASC
            `;
            
            const [rows] = await pool.execute(query, [userId, userId]);
            return rows;
            
        } catch (error) {
            console.error('Error fetching accessible stores:', error);
            throw new Error('Failed to fetch accessible stores');
        }
    }
    
    /**
     * Switch current store context for god mode user
     * @param {number} userId - God mode user ID
     * @param {number} targetStoreId - Store to switch to
     * @param {string} sessionToken - Current session token
     * @param {Object} metadata - Additional metadata (IP, user agent)
     * @returns {Promise<Object>} Switch result
     */
    static async switchStore(userId, targetStoreId, sessionToken, metadata = {}) {
        const connection = await pool.getConnection();
        
        try {
            await connection.beginTransaction();
            
            // Verify user has god mode and access to target store
            const [userCheck] = await connection.execute(
                'SELECT role, store_id FROM users WHERE id = ? AND is_active = TRUE',
                [userId]
            );
            
            if (userCheck.length === 0 || userCheck[0].role !== 'god_mode') {
                throw new Error('User does not have god mode privileges');
            }
            
            // Verify store exists and user has access
            const [storeCheck] = await connection.execute(`
                SELECT s.id, s.name 
                FROM stores s
                LEFT JOIN store_access sa ON s.id = sa.store_id AND sa.user_id = ? AND sa.is_active = TRUE
                WHERE s.id = ? AND (sa.store_id IS NOT NULL OR ? IN (
                    SELECT id FROM users WHERE role = 'god_mode'
                ))
            `, [userId, targetStoreId, userId]);
            
            if (storeCheck.length === 0) {
                throw new Error('Target store not found or access denied');
            }
            
            // Update session with new store context
            await connection.execute(`
                UPDATE user_sessions 
                SET current_store_id = ?, 
                    last_activity = NOW(),
                    is_god_mode_session = TRUE
                WHERE user_id = ? AND session_token = ? AND expires_at > NOW()
            `, [targetStoreId, userId, sessionToken]);
            
            // Log the store switch action
            await connection.execute(`
                INSERT INTO god_mode_audit (
                    user_id, action_type, target_type, target_id, target_store_id,
                    old_value, new_value, ip_address, user_agent
                ) VALUES (?, 'store_switch', 'store', ?, ?, ?, ?, ?, ?)
            `, [
                userId, targetStoreId, targetStoreId,
                JSON.stringify({ previous_store: userCheck[0].store_id }),
                JSON.stringify({ new_store: targetStoreId, store_name: storeCheck[0].name }),
                metadata.ip_address || null,
                metadata.user_agent || null
            ]);
            
            await connection.commit();
            
            return {
                success: true,
                message: `Successfully switched to store: ${storeCheck[0].name}`,
                store_id: targetStoreId,
                store_name: storeCheck[0].name
            };
            
        } catch (error) {
            await connection.rollback();
            console.error('Error switching store:', error);
            throw new Error(`Store switch failed: ${error.message}`);
        } finally {
            connection.release();
        }
    }
    
    /**
     * Get current store context for god mode user
     * @param {number} userId - God mode user ID
     * @param {string} sessionToken - Session token
     * @returns {Promise<Object>} Current store context
     */
    static async getCurrentStoreContext(userId, sessionToken) {
        try {
            const query = `
                SELECT 
                    us.current_store_id,
                    us.original_store_id,
                    cs.name as current_store_name,
                    os.name as original_store_name,
                    us.last_activity,
                    us.is_god_mode_session
                FROM user_sessions us
                LEFT JOIN stores cs ON us.current_store_id = cs.id
                LEFT JOIN stores os ON us.original_store_id = os.id
                WHERE us.user_id = ? AND us.session_token = ? AND us.expires_at > NOW()
            `;
            
            const [rows] = await pool.execute(query, [userId, sessionToken]);
            
            if (rows.length === 0) {
                throw new Error('Invalid or expired session');
            }
            
            return {
                current_store_id: rows[0].current_store_id || rows[0].original_store_id,
                current_store_name: rows[0].current_store_name || rows[0].original_store_name,
                original_store_id: rows[0].original_store_id,
                original_store_name: rows[0].original_store_name,
                is_god_mode_session: rows[0].is_god_mode_session
            };
            
        } catch (error) {
            console.error('Error getting store context:', error);
            throw new Error('Failed to get current store context');
        }
    }
    
    /**
     * Edit any user across any store (god mode privilege)
     * @param {number} godUserId - God mode user performing the action
     * @param {number} targetUserId - User to edit
     * @param {Object} updates - Fields to update
     * @param {Object} metadata - Action metadata
     * @returns {Promise<Object>} Update result
     */
    static async editUser(godUserId, targetUserId, updates, metadata = {}) {
        const connection = await pool.getConnection();
        
        try {
            await connection.beginTransaction();
            
            // Verify god mode privileges
            if (!(await this.isGodModeUser(godUserId))) {
                throw new Error('Insufficient privileges for this action');
            }
            
            // Get current user data for audit log
            const [currentUser] = await connection.execute(
                'SELECT * FROM users WHERE id = ?',
                [targetUserId]
            );
            
            if (currentUser.length === 0) {
                throw new Error('Target user not found');
            }
            
            // Build update query dynamically
            const allowedFields = ['name', 'email', 'phone', 'address', 'role', 'store_id', 'is_active'];
            const updateFields = [];
            const updateValues = [];
            
            for (const [key, value] of Object.entries(updates)) {
                if (allowedFields.includes(key)) {
                    if (key === 'password') {
                        // Hash password if provided
                        const hashedPassword = await bcrypt.hash(value, 12);
                        updateFields.push('password = ?');
                        updateValues.push(hashedPassword);
                    } else {
                        updateFields.push(`${key} = ?`);
                        updateValues.push(value);
                    }
                }
            }
            
            if (updateFields.length === 0) {
                throw new Error('No valid fields to update');
            }
            
            updateValues.push(targetUserId);
            
            // Execute update
            await connection.execute(
                `UPDATE users SET ${updateFields.join(', ')}, updated_at = NOW() WHERE id = ?`,
                updateValues
            );
            
            // Log the action
            await connection.execute(`
                INSERT INTO god_mode_audit (
                    user_id, action_type, target_type, target_id, target_store_id,
                    old_value, new_value, ip_address, user_agent
                ) VALUES (?, 'user_edit', 'user', ?, ?, ?, ?, ?, ?)
            `, [
                godUserId, targetUserId, currentUser[0].store_id,
                JSON.stringify(currentUser[0]),
                JSON.stringify(updates),
                metadata.ip_address || null,
                metadata.user_agent || null
            ]);
            
            await connection.commit();
            
            return {
                success: true,
                message: 'User updated successfully',
                updated_fields: Object.keys(updates)
            };
            
        } catch (error) {
            await connection.rollback();
            console.error('Error editing user:', error);
            throw new Error(`User edit failed: ${error.message}`);
        } finally {
            connection.release();
        }
    }
    
    /**
     * Get users from any store with filtering
     * @param {number} godUserId - God mode user ID
     * @param {Object} filters - Search filters
     * @returns {Promise<Array>} Filtered users
     */
    static async getAllUsers(godUserId, filters = {}) {
        try {
            // Verify god mode privileges
            if (!(await this.isGodModeUser(godUserId))) {
                throw new Error('Insufficient privileges for this action');
            }
            
            let query = `
                SELECT 
                    u.*,
                    s.name as store_name,
                    s.address as store_address,
                    CASE WHEN u.role = 'god_mode' THEN 'God Mode' 
                         WHEN u.role = 'admin' THEN 'Admin' 
                         ELSE 'User' END as role_display
                FROM users u
                INNER JOIN stores s ON u.store_id = s.id
                WHERE 1=1
            `;
            
            const params = [];
            
            // Apply filters
            if (filters.store_id) {
                query += ' AND u.store_id = ?';
                params.push(filters.store_id);
            }
            
            if (filters.role) {
                query += ' AND u.role = ?';
                params.push(filters.role);
            }
            
            if (filters.is_active !== undefined) {
                query += ' AND u.is_active = ?';
                params.push(filters.is_active);
            }
            
            if (filters.search) {
                query += ' AND (u.name LIKE ? OR u.email LIKE ? OR s.name LIKE ?)';
                const searchPattern = `%${filters.search}%`;
                params.push(searchPattern, searchPattern, searchPattern);
            }
            
            query += ' ORDER BY s.name ASC, u.name ASC';
            
            if (filters.limit) {
                query += ' LIMIT ?';
                params.push(parseInt(filters.limit));
            }
            
            const [rows] = await pool.execute(query, params);
            return rows;
            
        } catch (error) {
            console.error('Error fetching all users:', error);
            throw new Error('Failed to fetch users');
        }
    }
    
    /**
     * Get god mode audit log
     * @param {number} godUserId - God mode user ID requesting the log
     * @param {Object} filters - Filter options
     * @returns {Promise<Array>} Audit log entries
     */
    static async getAuditLog(godUserId, filters = {}) {
        try {
            // Verify god mode privileges
            if (!(await this.isGodModeUser(godUserId))) {
                throw new Error('Insufficient privileges for this action');
            }
            
            let query = `
                SELECT 
                    gma.*,
                    u.name as user_name,
                    u.email as user_email,
                    s.name as target_store_name
                FROM god_mode_audit gma
                INNER JOIN users u ON gma.user_id = u.id
                LEFT JOIN stores s ON gma.target_store_id = s.id
                WHERE 1=1
            `;
            
            const params = [];
            
            // Apply filters
            if (filters.user_id) {
                query += ' AND gma.user_id = ?';
                params.push(filters.user_id);
            }
            
            if (filters.action_type) {
                query += ' AND gma.action_type = ?';
                params.push(filters.action_type);
            }
            
            if (filters.target_type) {
                query += ' AND gma.target_type = ?';
                params.push(filters.target_type);
            }
            
            if (filters.target_store_id) {
                query += ' AND gma.target_store_id = ?';
                params.push(filters.target_store_id);
            }
            
            if (filters.start_date) {
                query += ' AND gma.action_timestamp >= ?';
                params.push(filters.start_date);
            }
            
            if (filters.end_date) {
                query += ' AND gma.action_timestamp <= ?';
                params.push(filters.end_date);
            }
            
            query += ' ORDER BY gma.action_timestamp DESC';
            
            if (filters.limit) {
                query += ` LIMIT ${parseInt(filters.limit)}`;
            }
            
            const [rows] = await pool.execute(query, params);
            return rows;
            
        } catch (error) {
            console.error('Error fetching audit log:', error);
            throw new Error('Failed to fetch audit log');
        }
    }
    
    /**
     * Grant god mode role to a user
     * @param {number} granterUserId - God mode user granting the permission
     * @param {number} targetUserId - User to grant god mode to
     * @param {Object} metadata - Action metadata
     * @returns {Promise<Object>} Grant result
     */
    static async grantGodMode(granterUserId, targetUserId, metadata = {}) {
        const connection = await pool.getConnection();
        
        try {
            await connection.beginTransaction();
            
            // Verify granter has god mode privileges
            if (!(await this.isGodModeUser(granterUserId))) {
                throw new Error('Insufficient privileges to grant god mode');
            }
            
            // Get target user info
            const [targetUser] = await connection.execute(
                'SELECT * FROM users WHERE id = ?',
                [targetUserId]
            );
            
            if (targetUser.length === 0) {
                throw new Error('Target user not found');
            }
            
            if (targetUser[0].role === 'god_mode') {
                throw new Error('User already has god mode privileges');
            }
            
            // Update user role
            await connection.execute(
                'UPDATE users SET role = ?, updated_at = NOW() WHERE id = ?',
                ['god_mode', targetUserId]
            );
            
            // Grant all god mode permissions
            const permissions = [
                'view_all_stores', 'edit_all_users', 'create_users', 'delete_users',
                'edit_all_drugs', 'create_drugs', 'delete_drugs',
                'edit_all_transactions', 'create_transactions', 'delete_transactions',
                'switch_stores', 'grant_permissions', 'revoke_permissions',
                'change_user_roles', 'view_system_settings', 'edit_system_settings',
                'view_god_mode_audit', 'impersonate_users'
            ];
            
            for (const permission of permissions) {
                await connection.execute(`
                    INSERT INTO user_permissions (user_id, permission_name, permission_value, granted_by)
                    VALUES (?, ?, TRUE, ?)
                    ON DUPLICATE KEY UPDATE permission_value = TRUE, granted_by = ?
                `, [targetUserId, permission, granterUserId, granterUserId]);
            }
            
            // Grant access to all stores
            const [stores] = await connection.execute('SELECT id FROM stores');
            for (const store of stores) {
                await connection.execute(`
                    INSERT INTO store_access (user_id, store_id, access_level, granted_by)
                    VALUES (?, ?, 'god_mode', ?)
                    ON DUPLICATE KEY UPDATE access_level = 'god_mode', granted_by = ?
                `, [targetUserId, store.id, granterUserId, granterUserId]);
            }
            
            // Log the action
            await connection.execute(`
                INSERT INTO god_mode_audit (
                    user_id, action_type, target_type, target_id, target_store_id,
                    old_value, new_value, ip_address, user_agent
                ) VALUES (?, 'role_change', 'user', ?, ?, ?, ?, ?, ?)
            `, [
                granterUserId, targetUserId, targetUser[0].store_id,
                JSON.stringify({ previous_role: targetUser[0].role }),
                JSON.stringify({ new_role: 'god_mode' }),
                metadata.ip_address || null,
                metadata.user_agent || null
            ]);
            
            await connection.commit();
            
            return {
                success: true,
                message: `Successfully granted god mode to ${targetUser[0].name}`,
                user_id: targetUserId,
                new_role: 'god_mode'
            };
            
        } catch (error) {
            await connection.rollback();
            console.error('Error granting god mode:', error);
            throw new Error(`Failed to grant god mode: ${error.message}`);
        } finally {
            connection.release();
        }
    }
    
    /**
     * Get comprehensive statistics for god mode dashboard
     * @param {number} godUserId - God mode user ID
     * @returns {Promise<Object>} System statistics
     */
    static async getSystemStats(godUserId) {
        try {
            // Verify god mode privileges
            if (!(await this.isGodModeUser(godUserId))) {
                throw new Error('Insufficient privileges for this action');
            }
            
            const [stats] = await pool.execute(`
                SELECT 
                    (SELECT COUNT(*) FROM stores) as total_stores,
                    (SELECT COUNT(*) FROM users WHERE is_active = TRUE) as total_users,
                    (SELECT COUNT(*) FROM users WHERE role = 'god_mode' AND is_active = TRUE) as god_mode_users,
                    (SELECT COUNT(*) FROM drugs) as total_drugs,
                    (SELECT COUNT(DISTINCT drug_id) FROM store_inventory WHERE is_active = TRUE) as active_drugs,
                    (SELECT SUM(quantity_on_hand) FROM store_inventory_snapshot) as total_inventory,
                    (SELECT COUNT(*) FROM god_mode_audit WHERE action_timestamp >= DATE_SUB(NOW(), INTERVAL 24 HOUR)) as recent_god_actions,
                    (SELECT COUNT(*) FROM user_sessions WHERE is_god_mode_session = TRUE AND expires_at > NOW()) as active_god_sessions
            `);
            
            return stats[0];
            
        } catch (error) {
            console.error('Error fetching system stats:', error);
            throw new Error('Failed to fetch system statistics');
        }
    }
}

module.exports = GodModeUser;