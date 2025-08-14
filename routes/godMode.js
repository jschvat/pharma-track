/**
 * God Mode Routes
 * 
 * API endpoints for god mode users with super administrator capabilities:
 * - Store switching and multi-store management
 * - Cross-store user, drug, and transaction operations
 * - Permission management and role changes
 * - System-wide statistics and audit logging
 * 
 * @author PharmaTraK Development Team
 * @version 1.0.0
 */

const express = require('express');
const router = express.Router();
const GodModeUser = require('../models/GodModeUser');
const { pool } = require('../config/database');

// Middleware to verify god mode privileges
const requireGodMode = async (req, res, next) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        
        const isGodMode = await GodModeUser.isGodModeUser(req.user.id);
        if (!isGodMode) {
            return res.status(403).json({ 
                error: 'God mode privileges required for this action',
                required_role: 'god_mode',
                current_role: req.user.role || 'unknown'
            });
        }
        
        next();
    } catch (error) {
        console.error('God mode verification error:', error);
        res.status(500).json({ error: 'Failed to verify god mode privileges' });
    }
};

// Apply god mode middleware to all routes
router.use(requireGodMode);

/**
 * Get accessible stores for god mode user
 * GET /api/god-mode/stores
 */
router.get('/stores', async (req, res) => {
    try {
        const stores = await GodModeUser.getAccessibleStores(req.user.id);
        
        res.json({
            success: true,
            stores,
            total_count: stores.length,
            message: 'Accessible stores retrieved successfully'
        });
        
    } catch (error) {
        console.error('Error fetching accessible stores:', error);
        res.status(500).json({ 
            error: 'Failed to fetch accessible stores',
            details: error.message 
        });
    }
});

/**
 * Switch current store context
 * POST /api/god-mode/switch-store
 */
router.post('/switch-store', async (req, res) => {
    try {
        const { target_store_id } = req.body;
        
        if (!target_store_id) {
            return res.status(400).json({ 
                error: 'target_store_id is required' 
            });
        }
        
        const metadata = {
            ip_address: req.ip,
            user_agent: req.get('User-Agent')
        };
        
        const result = await GodModeUser.switchStore(
            req.user.id,
            target_store_id,
            req.session?.token || req.headers.authorization?.split(' ')[1],
            metadata
        );
        
        res.json({
            success: true,
            ...result,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Error switching store:', error);
        res.status(400).json({ 
            error: 'Store switch failed',
            details: error.message 
        });
    }
});

/**
 * Get current store context
 * GET /api/god-mode/current-context
 */
router.get('/current-context', async (req, res) => {
    try {
        const sessionToken = req.session?.token || req.headers.authorization?.split(' ')[1];
        
        if (!sessionToken) {
            return res.status(400).json({ 
                error: 'Session token required' 
            });
        }
        
        const context = await GodModeUser.getCurrentStoreContext(req.user.id, sessionToken);
        
        res.json({
            success: true,
            context,
            user_id: req.user.id
        });
        
    } catch (error) {
        console.error('Error getting store context:', error);
        res.status(400).json({ 
            error: 'Failed to get current context',
            details: error.message 
        });
    }
});

/**
 * Get all users across all stores
 * GET /api/god-mode/users
 */
router.get('/users', async (req, res) => {
    try {
        const filters = {
            store_id: req.query.store_id ? parseInt(req.query.store_id) : null,
            role: req.query.role || null,
            is_active: req.query.is_active !== undefined ? req.query.is_active === 'true' : undefined,
            search: req.query.search || null,
            limit: req.query.limit ? parseInt(req.query.limit) : 100
        };
        
        const users = await GodModeUser.getAllUsers(req.user.id, filters);
        
        res.json({
            success: true,
            users,
            total_count: users.length,
            filters_applied: Object.keys(filters).filter(key => filters[key] !== null && filters[key] !== undefined)
        });
        
    } catch (error) {
        console.error('Error fetching all users:', error);
        res.status(500).json({ 
            error: 'Failed to fetch users',
            details: error.message 
        });
    }
});

/**
 * Edit any user (god mode privilege)
 * PUT /api/god-mode/users/:userId
 */
router.put('/users/:userId', async (req, res) => {
    try {
        const targetUserId = parseInt(req.params.userId);
        const updates = req.body;
        
        if (!targetUserId) {
            return res.status(400).json({ 
                error: 'Invalid user ID' 
            });
        }
        
        const metadata = {
            ip_address: req.ip,
            user_agent: req.get('User-Agent')
        };
        
        const result = await GodModeUser.editUser(req.user.id, targetUserId, updates, metadata);
        
        res.json({
            success: true,
            ...result,
            target_user_id: targetUserId,
            updated_by: req.user.id
        });
        
    } catch (error) {
        console.error('Error editing user:', error);
        res.status(400).json({ 
            error: 'User edit failed',
            details: error.message 
        });
    }
});

/**
 * Grant god mode privileges to a user
 * POST /api/god-mode/grant/:userId
 */
router.post('/grant/:userId', async (req, res) => {
    try {
        const targetUserId = parseInt(req.params.userId);
        
        if (!targetUserId) {
            return res.status(400).json({ 
                error: 'Invalid user ID' 
            });
        }
        
        const metadata = {
            ip_address: req.ip,
            user_agent: req.get('User-Agent')
        };
        
        const result = await GodModeUser.grantGodMode(req.user.id, targetUserId, metadata);
        
        res.json({
            success: true,
            ...result,
            granted_by: req.user.id,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Error granting god mode:', error);
        res.status(400).json({ 
            error: 'Failed to grant god mode',
            details: error.message 
        });
    }
});

/**
 * Get system-wide statistics
 * GET /api/god-mode/stats
 */
router.get('/stats', async (req, res) => {
    try {
        const stats = await GodModeUser.getSystemStats(req.user.id);
        
        res.json({
            success: true,
            stats,
            generated_at: new Date().toISOString(),
            generated_by: req.user.id
        });
        
    } catch (error) {
        console.error('Error fetching system stats:', error);
        res.status(500).json({ 
            error: 'Failed to fetch system statistics',
            details: error.message 
        });
    }
});

/**
 * Get god mode audit log
 * GET /api/god-mode/audit
 */
router.get('/audit', async (req, res) => {
    try {
        const filters = {
            user_id: req.query.user_id ? parseInt(req.query.user_id) : null,
            action_type: req.query.action_type || null,
            target_type: req.query.target_type || null,
            target_store_id: req.query.target_store_id ? parseInt(req.query.target_store_id) : null,
            start_date: req.query.start_date || null,
            end_date: req.query.end_date || null,
            limit: req.query.limit ? parseInt(req.query.limit) : 50
        };
        
        const auditLog = await GodModeUser.getAuditLog(req.user.id, filters);
        
        res.json({
            success: true,
            audit_log: auditLog,
            total_count: auditLog.length,
            filters_applied: Object.keys(filters).filter(key => filters[key] !== null)
        });
        
    } catch (error) {
        console.error('Error fetching audit log:', error);
        res.status(500).json({ 
            error: 'Failed to fetch audit log',
            details: error.message 
        });
    }
});

/**
 * Get all drugs across all stores
 * GET /api/god-mode/drugs
 */
router.get('/drugs', async (req, res) => {
    try {
        let query = `
            SELECT 
                d.*,
                COUNT(DISTINCT si.store_id) as store_count,
                SUM(sis.quantity_on_hand) as total_quantity,
                AVG(si.unit_cost) as avg_unit_cost,
                AVG(si.selling_price) as avg_selling_price
            FROM drugs d
            LEFT JOIN store_inventory si ON d.id = si.drug_id AND si.is_active = TRUE
            LEFT JOIN store_inventory_snapshot sis ON d.id = sis.drug_id
            WHERE 1=1
        `;
        
        const params = [];
        
        // Apply filters
        if (req.query.search) {
            query += ' AND (d.ndc LIKE ? OR d.generic_name LIKE ? OR d.brand_name LIKE ?)';
            const searchPattern = `%${req.query.search}%`;
            params.push(searchPattern, searchPattern, searchPattern);
        }
        
        if (req.query.dea_schedule) {
            query += ' AND d.dea_schedule = ?';
            params.push(req.query.dea_schedule);
        }
        
        query += ' GROUP BY d.id ORDER BY d.generic_name ASC';
        
        if (req.query.limit) {
            query += ` LIMIT ${parseInt(req.query.limit)}`;
        }
        
        const [drugs] = await pool.execute(query, params);
        
        res.json({
            success: true,
            drugs,
            total_count: drugs.length
        });
        
    } catch (error) {
        console.error('Error fetching all drugs:', error);
        res.status(500).json({ 
            error: 'Failed to fetch drugs',
            details: error.message 
        });
    }
});

/**
 * Get all transactions across all stores
 * GET /api/god-mode/transactions
 */
router.get('/transactions', async (req, res) => {
    try {
        let query = `
            SELECT 
                ial.*,
                d.generic_name,
                d.ndc,
                s.name as store_name,
                u.name as performed_by_name
            FROM inventory_audit_log ial
            INNER JOIN drugs d ON ial.drug_id = d.id
            INNER JOIN stores s ON ial.store_id = s.id
            INNER JOIN users u ON ial.performed_by = u.id
            WHERE 1=1
        `;
        
        const params = [];
        
        // Apply filters
        if (req.query.store_id) {
            query += ' AND ial.store_id = ?';
            params.push(parseInt(req.query.store_id));
        }
        
        if (req.query.drug_id) {
            query += ' AND ial.drug_id = ?';
            params.push(parseInt(req.query.drug_id));
        }
        
        if (req.query.transaction_type) {
            query += ' AND ial.transaction_type = ?';
            params.push(req.query.transaction_type);
        }
        
        if (req.query.start_date) {
            query += ' AND ial.transaction_date >= ?';
            params.push(req.query.start_date);
        }
        
        if (req.query.end_date) {
            query += ' AND ial.transaction_date <= ?';
            params.push(req.query.end_date);
        }
        
        query += ' ORDER BY ial.transaction_date DESC';
        
        if (req.query.limit) {
            query += ` LIMIT ${parseInt(req.query.limit)}`;
        }
        
        const [transactions] = await pool.execute(query, params);
        
        res.json({
            success: true,
            transactions,
            total_count: transactions.length
        });
        
    } catch (error) {
        console.error('Error fetching all transactions:', error);
        res.status(500).json({ 
            error: 'Failed to fetch transactions',
            details: error.message 
        });
    }
});

/**
 * Create a new user in any store
 * POST /api/god-mode/users
 */
router.post('/users', async (req, res) => {
    try {
        const { name, email, phone, password, address, store_id, role = 'user' } = req.body;
        
        // Validate required fields
        if (!name || !email || !phone || !password || !address || !store_id) {
            return res.status(400).json({
                error: 'Missing required fields',
                required: ['name', 'email', 'phone', 'password', 'address', 'store_id']
            });
        }
        
        const bcrypt = require('bcrypt');
        const hashedPassword = await bcrypt.hash(password, 12);
        
        const [result] = await pool.execute(`
            INSERT INTO users (name, email, phone, password, address, store_id, role, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)
        `, [name, email, phone, hashedPassword, address, store_id, role]);
        
        // Log the action
        const metadata = {
            ip_address: req.ip,
            user_agent: req.get('User-Agent')
        };
        
        await pool.execute(`
            INSERT INTO god_mode_audit (
                user_id, action_type, target_type, target_id, target_store_id,
                new_value, ip_address, user_agent
            ) VALUES (?, 'user_create', 'user', ?, ?, ?, ?, ?)
        `, [
            req.user.id, result.insertId, store_id,
            JSON.stringify({ name, email, role, store_id }),
            metadata.ip_address || null,
            metadata.user_agent || null
        ]);
        
        res.status(201).json({
            success: true,
            message: 'User created successfully',
            user_id: result.insertId,
            created_by: req.user.id
        });
        
    } catch (error) {
        console.error('Error creating user:', error);
        
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                error: 'User with this email already exists'
            });
        }
        
        res.status(500).json({ 
            error: 'Failed to create user',
            details: error.message 
        });
    }
});

/**
 * Delete a user (god mode privilege)
 * DELETE /api/god-mode/users/:userId
 */
router.delete('/users/:userId', async (req, res) => {
    try {
        const targetUserId = parseInt(req.params.userId);
        
        if (!targetUserId || targetUserId === req.user.id) {
            return res.status(400).json({ 
                error: 'Invalid user ID or cannot delete yourself' 
            });
        }
        
        // Get user info before deletion for audit log
        const [userInfo] = await pool.execute(
            'SELECT * FROM users WHERE id = ?',
            [targetUserId]
        );
        
        if (userInfo.length === 0) {
            return res.status(404).json({
                error: 'User not found'
            });
        }
        
        // Soft delete - set is_active to false
        await pool.execute(
            'UPDATE users SET is_active = FALSE, updated_at = NOW() WHERE id = ?',
            [targetUserId]
        );
        
        // Log the action
        const metadata = {
            ip_address: req.ip,
            user_agent: req.get('User-Agent')
        };
        
        await pool.execute(`
            INSERT INTO god_mode_audit (
                user_id, action_type, target_type, target_id, target_store_id,
                old_value, ip_address, user_agent
            ) VALUES (?, 'user_delete', 'user', ?, ?, ?, ?, ?)
        `, [
            req.user.id, targetUserId, userInfo[0].store_id,
            JSON.stringify(userInfo[0]),
            metadata.ip_address || null,
            metadata.user_agent || null
        ]);
        
        res.json({
            success: true,
            message: 'User deactivated successfully',
            user_id: targetUserId,
            deleted_by: req.user.id
        });
        
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ 
            error: 'Failed to delete user',
            details: error.message 
        });
    }
});

module.exports = router;