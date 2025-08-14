-- God Mode User Migration
-- Adds god_mode role and capabilities for super administrators

USE pharmatrak;

-- 1. Add god_mode role to users table
ALTER TABLE users 
MODIFY COLUMN role ENUM('admin', 'user', 'god_mode') DEFAULT 'user';

-- 2. Create user_permissions table for fine-grained permissions
CREATE TABLE IF NOT EXISTS user_permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    permission_name VARCHAR(50) NOT NULL,
    permission_value BOOLEAN DEFAULT TRUE,
    granted_by INT NULL, -- User who granted this permission
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL, -- Optional expiration
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY unique_user_permission (user_id, permission_name),
    INDEX idx_user_permissions_user (user_id),
    INDEX idx_user_permissions_name (permission_name)
);

-- 3. Create store_access table for god mode users to track which stores they can access
CREATE TABLE IF NOT EXISTS store_access (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    store_id INT NOT NULL,
    access_level ENUM('read', 'write', 'admin', 'god_mode') DEFAULT 'read',
    granted_by INT NULL,
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
    FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY unique_user_store_access (user_id, store_id),
    INDEX idx_store_access_user (user_id),
    INDEX idx_store_access_store (store_id)
);

-- 4. Create user_sessions table to track god mode store switching
CREATE TABLE IF NOT EXISTS user_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    session_token VARCHAR(255) NOT NULL,
    current_store_id INT NULL, -- For god mode users to track current store context
    original_store_id INT NOT NULL, -- User's original store
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    is_god_mode_session BOOLEAN DEFAULT FALSE,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (current_store_id) REFERENCES stores(id) ON DELETE SET NULL,
    FOREIGN KEY (original_store_id) REFERENCES stores(id) ON DELETE CASCADE,
    UNIQUE KEY unique_session_token (session_token),
    INDEX idx_sessions_user (user_id),
    INDEX idx_sessions_token (session_token),
    INDEX idx_sessions_expires (expires_at)
);

-- 5. Create audit log for god mode actions
CREATE TABLE IF NOT EXISTS god_mode_audit (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    action_type ENUM(
        'store_switch', 'user_edit', 'user_create', 'user_delete',
        'drug_edit', 'drug_create', 'drug_delete',
        'transaction_edit', 'transaction_create', 'transaction_delete',
        'permission_grant', 'permission_revoke',
        'role_change', 'system_setting_change'
    ) NOT NULL,
    target_type ENUM('store', 'user', 'drug', 'transaction', 'system') NOT NULL,
    target_id INT NULL, -- ID of the target (store_id, user_id, drug_id, etc.)
    target_store_id INT NULL, -- Store context where action occurred
    old_value JSON NULL, -- Previous value (for edits)
    new_value JSON NULL, -- New value (for edits)
    action_details JSON NULL, -- Additional action metadata
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    action_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (target_store_id) REFERENCES stores(id) ON DELETE SET NULL,
    INDEX idx_god_audit_user (user_id),
    INDEX idx_god_audit_action (action_type),
    INDEX idx_god_audit_target (target_type, target_id),
    INDEX idx_god_audit_store (target_store_id),
    INDEX idx_god_audit_timestamp (action_timestamp)
);

-- 6. Insert default god mode permissions
INSERT INTO user_permissions (user_id, permission_name, permission_value, granted_by) 
SELECT 
    u.id,
    perm.permission_name,
    TRUE,
    NULL
FROM users u
CROSS JOIN (
    SELECT 'view_all_stores' as permission_name UNION ALL
    SELECT 'edit_all_users' UNION ALL
    SELECT 'create_users' UNION ALL
    SELECT 'delete_users' UNION ALL
    SELECT 'edit_all_drugs' UNION ALL
    SELECT 'create_drugs' UNION ALL
    SELECT 'delete_drugs' UNION ALL
    SELECT 'edit_all_transactions' UNION ALL
    SELECT 'create_transactions' UNION ALL
    SELECT 'delete_transactions' UNION ALL
    SELECT 'switch_stores' UNION ALL
    SELECT 'grant_permissions' UNION ALL
    SELECT 'revoke_permissions' UNION ALL
    SELECT 'change_user_roles' UNION ALL
    SELECT 'view_system_settings' UNION ALL
    SELECT 'edit_system_settings' UNION ALL
    SELECT 'view_god_mode_audit' UNION ALL
    SELECT 'impersonate_users'
) perm
WHERE u.role = 'god_mode'
ON DUPLICATE KEY UPDATE permission_value = VALUES(permission_value);

-- 7. Grant all store access to existing god mode users
INSERT INTO store_access (user_id, store_id, access_level, granted_by)
SELECT 
    u.id,
    s.id,
    'god_mode',
    NULL
FROM users u
CROSS JOIN stores s
WHERE u.role = 'god_mode'
ON DUPLICATE KEY UPDATE access_level = VALUES(access_level);

-- 8. Create view for god mode capabilities
CREATE OR REPLACE VIEW v_god_mode_users AS
SELECT 
    u.id,
    u.name,
    u.email,
    u.role,
    u.store_id as original_store_id,
    s.name as original_store_name,
    COUNT(DISTINCT sa.store_id) as accessible_stores_count,
    COUNT(DISTINCT up.permission_name) as permissions_count,
    u.is_active,
    u.date_created
FROM users u
LEFT JOIN stores s ON u.store_id = s.id
LEFT JOIN store_access sa ON u.id = sa.user_id AND sa.is_active = TRUE
LEFT JOIN user_permissions up ON u.id = up.user_id AND up.permission_value = TRUE
WHERE u.role = 'god_mode'
GROUP BY u.id, u.name, u.email, u.role, u.store_id, s.name, u.is_active, u.date_created;

-- 9. Create view for current god mode sessions
CREATE OR REPLACE VIEW v_god_mode_sessions AS
SELECT 
    us.id as session_id,
    u.id as user_id,
    u.name as user_name,
    u.email as user_email,
    us.current_store_id,
    cs.name as current_store_name,
    us.original_store_id,
    os.name as original_store_name,
    us.ip_address,
    us.last_activity,
    us.expires_at,
    us.created_at,
    CASE 
        WHEN us.expires_at > NOW() THEN 'active'
        ELSE 'expired'
    END as session_status
FROM user_sessions us
INNER JOIN users u ON us.user_id = u.id
LEFT JOIN stores cs ON us.current_store_id = cs.id
LEFT JOIN stores os ON us.original_store_id = os.id
WHERE us.is_god_mode_session = TRUE
    AND u.role = 'god_mode'
ORDER BY us.last_activity DESC;

-- 10. Create indexes for performance
CREATE INDEX idx_god_audit_composite ON god_mode_audit(user_id, action_timestamp, action_type);
CREATE INDEX idx_sessions_activity ON user_sessions(last_activity, expires_at);
CREATE INDEX idx_store_access_active ON store_access(is_active, access_level);

-- 11. Clean up expired sessions (optional maintenance)
-- DELETE FROM user_sessions WHERE expires_at < NOW() - INTERVAL 7 DAY;

COMMIT;